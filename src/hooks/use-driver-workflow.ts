import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/lib/company-context";
import { useSession } from "@/lib/session";
import { getDevicePlatform, getInstallationId } from "@/lib/telemetry/installation";
import { queryLocationPermission } from "@/lib/telemetry/capture";
import type { Database } from "@/integrations/supabase/types";

type Job = Database["public"]["Tables"]["jobs"]["Row"];
type Driver = Database["public"]["Tables"]["drivers"]["Row"];

function filePath(companyId: string, folder: string, file: File) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return `${companyId}/${folder}/${crypto.randomUUID()}-${safeName}`;
}

export function useDriverWorkflow() {
  const { activeCompany } = useCompany();
  const { user } = useSession();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!activeCompany || !user) {
      setDriver(null);
      setJobs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("*")
        .eq("company_id", activeCompany.id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (driverError) throw driverError;
      setDriver(driverData);

      if (!driverData) {
        setJobs([]);
        return;
      }

      const { data: jobData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("company_id", activeCompany.id)
        .eq("driver_id", driverData.id)
        .in("status", ["assigned", "accepted", "in_progress", "arrived"])
        .order("scheduled_at", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });
      if (jobsError) throw jobsError;
      setJobs(jobData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load driver workflow");
      setDriver(null);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [activeCompany, user]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  const currentJob = useMemo(
    () =>
      jobs.find((job) => ["accepted", "in_progress", "arrived"].includes(job.status)) ??
      jobs.find((job) => job.status === "assigned") ??
      null,
    [jobs],
  );
  const nextJob = useMemo(
    () => jobs.find((job) => job.id !== currentJob?.id && job.status === "assigned") ?? null,
    [currentJob?.id, jobs],
  );

  const transition = async (jobId: string, action: "accept" | "start" | "arrive") => {
    const permission =
      action === "start"
        ? await queryLocationPermission().catch(() => "unsupported" as const)
        : null;
    const installationId = getInstallationId();
    const deviceInstallationId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        installationId,
      )
        ? installationId
        : null;
    console.info("phase35.trip_start.invoke", { jobId, action, deviceInstallationId });
    const { data: transitioned, error: err } = await supabase.rpc("driver_transition_job", {
      _job_id: jobId,
      _action: action,
      _device_installation_id: action === "start" ? deviceInstallationId : null,
      _app_version: action === "start" ? "phase4-web" : undefined,
      _device_platform: action === "start" ? getDevicePlatform() : undefined,
      _location_permission_state: permission,
    });
    if (err) throw err;
    console.info("phase35.trip_start.response", {
      jobId,
      action,
      status: transitioned?.status,
      startedAt: transitioned?.started_at,
    });
    if (
      action === "start" &&
      (transitioned?.status !== "in_progress" || !transitioned.started_at)
    ) {
      throw new Error("Trip start was not acknowledged by the server");
    }
    await fetch();
    if (action === "start") {
      const refreshed = jobs.find((job) => job.id === jobId);
      console.info("phase35.trip_start.refetch", {
        jobId,
        status: refreshed?.status,
        startedAt: refreshed?.started_at,
      });
    }
  };

  const saveNotes = async (jobId: string, notes: string) => {
    const { error: err } = await supabase.rpc("driver_update_job_notes", {
      _job_id: jobId,
      _notes: notes,
    });
    if (err) throw err;
    await fetch();
  };

  const failJob = async (jobId: string, reason: string, notes?: string) => {
    const { error: err } = await supabase.rpc("driver_fail_job", {
      _job_id: jobId,
      _reason: reason,
      _notes: notes || undefined,
    });
    if (err) throw err;
    await fetch();
  };

  const submitProof = async (
    jobId: string,
    proof: {
      recipientName: string;
      notes?: string;
      photo?: File | null;
      signature?: File | null;
    },
  ) => {
    if (!activeCompany) throw new Error("No active company");
    let photoUrl: string | null = null;
    let signatureUrl: string | null = null;
    const uploadedPaths: Array<{ bucket: string; path: string }> = [];

    try {
      if (proof.photo) {
        photoUrl = filePath(activeCompany.id, `jobs/${jobId}/photos`, proof.photo);
        const { error: uploadError } = await supabase.storage
          .from("proof-of-completion")
          .upload(photoUrl, proof.photo, { upsert: false });
        if (uploadError) throw uploadError;
        uploadedPaths.push({ bucket: "proof-of-completion", path: photoUrl });
      }

      if (proof.signature) {
        signatureUrl = filePath(activeCompany.id, `jobs/${jobId}/signatures`, proof.signature);
        const { error: uploadError } = await supabase.storage
          .from("proof-of-completion")
          .upload(signatureUrl, proof.signature, {
            upsert: false,
            contentType: "image/png",
          });
        if (uploadError) throw uploadError;
        uploadedPaths.push({ bucket: "proof-of-completion", path: signatureUrl });
      }

      // POD submission is intentionally a review boundary. Completion is owned by the
      // reviewer/driver departure authorities after the immutable proof is accepted.
      const { error: err } = await supabase.rpc("driver_submit_pod_for_review", {
        _job_id: jobId,
        _recipient_name: proof.recipientName,
        _notes: proof.notes || undefined,
        _photo_url: photoUrl ?? undefined,
        _signature_url: signatureUrl ?? undefined,
      });
      if (err) throw err;
      await fetch();
    } catch (error) {
      await Promise.all(
        uploadedPaths.map(async ({ bucket, path }) => {
          await supabase.storage
            .from(bucket)
            .remove([path])
            .catch(() => undefined);
        }),
      );
      throw error;
    }
  };

  const queueServerItem = async (input: {
    operation: string;
    payload?: Record<string, unknown>;
    priority?: string;
    idempotencyKey: string;
  }) => {
    if (!activeCompany || !driver || !user) throw new Error("Driver context unavailable");
    console.info("phase35.queue.click", {
      operation: input.operation,
      jobId: currentJob?.id,
      driverId: driver.id,
    });
    const { data: device, error: deviceError } = await supabase
      .from("driver_app_devices")
      .select("id")
      .eq("company_id", activeCompany.id)
      .eq("driver_id", driver.id)
      .is("revoked_at", null)
      .maybeSingle();
    if (deviceError) throw deviceError;
    if (!device) throw new Error("No registered driver device");
    const { data: session, error: sessionError } = await supabase
      .from("driver_navigation_sessions")
      .select("id")
      .eq("company_id", activeCompany.id)
      .eq("driver_id", driver.id)
      .eq("state", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) throw new Error("No active navigation session");
    const job = currentJob;
    if (!job) throw new Error("No assigned job");
    console.info("phase35.queue.invoke", {
      operation: input.operation,
      jobId: job.id,
      deviceId: device.id,
      sessionId: session.id,
    });
    const { data: queueRow, error: queueError } = await supabase.rpc("driver_queue_enqueue", {
      _company_id: activeCompany.id,
      _driver_id: driver.id,
      _device_id: device.id,
      _session_id: session.id,
      _entity: "job",
      _entity_id: job.id,
      _operation: input.operation,
      _priority: input.priority ?? (input.operation === "pod_submit" ? "pod" : "trip"),
      _payload: (input.payload ?? {}) as never,
      _checksum: JSON.stringify(input.payload ?? {}),
      _idempotency_key: input.idempotencyKey,
    });
    if (queueError) throw queueError;
    if (!queueRow) throw new Error("Queue boundary returned no persisted row");
    console.info("phase35.queue.persisted", {
      operation: input.operation,
      queueId: queueRow.id,
      state: queueRow.state,
    });
    return queueRow;
  };

  const syncServerQueue = async () => {
    if (!activeCompany || !driver) throw new Error("Driver context unavailable");
    const { data: device, error: deviceError } = await supabase
      .from("driver_app_devices")
      .select("id")
      .eq("company_id", activeCompany.id)
      .eq("driver_id", driver.id)
      .is("revoked_at", null)
      .maybeSingle();
    if (deviceError) throw deviceError;
    if (!device) throw new Error("No registered driver device");
    const { data: session } = await supabase
      .from("driver_navigation_sessions")
      .select("id")
      .eq("company_id", activeCompany.id)
      .eq("driver_id", driver.id)
      .eq("state", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!session) throw new Error("No active navigation session");
    const { data: claimed, error: claimError } = await supabase.rpc("driver_queue_claim", {
      _company_id: activeCompany.id,
      _driver_id: driver.id,
      _device_id: device.id,
      _session_id: session.id,
      _batch_size: 20,
      _lease_seconds: 120,
    });
    if (claimError) throw claimError;
    for (const item of claimed ?? []) {
      const { error } = await supabase.rpc("driver_queue_process_claim", { _queue_id: item.id });
      if (error) throw error;
    }
    const { data: summary, error: summaryError } = await supabase.rpc("driver_queue_summary", {
      _company_id: activeCompany.id,
      _driver_id: driver.id,
    });
    if (summaryError) throw summaryError;
    await fetch();
    return summary as { pending: number; failed: number; conflicted: number; all_synced: boolean };
  };

  return {
    driver,
    jobs,
    currentJob,
    nextJob,
    loading,
    error,
    fetch,
    transition,
    saveNotes,
    failJob,
    submitProof,
    queueServerItem,
    syncServerQueue,
  };
}
