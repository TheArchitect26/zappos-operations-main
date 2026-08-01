/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { useSession } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { portalApi } from "@/lib/customer-portal-api";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/customer-portal/documents")({
  head: () => ({ meta: [{ title: "Documents — Customer portal" }] }),
  component: CustomerDocumentsPage,
});

function CustomerDocumentsPage() {
  const { session } = useSession();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const openDocument = async (document: any) => {
    if (!document.file_url) return;
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.file_url, 60);
    if (error || !data?.signedUrl) return;
    await portalApi.action("document_viewed", { document_id: document.id });
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!session?.user?.id) return;
    const load = async () => {
      setLoading(true);
      setDocuments(await portalApi.documents());
      setLoading(false);
    };
    void load();
  }, [session?.user?.id]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Documents</p>
        <h2 className="mt-2 text-2xl font-semibold">Customer documents</h2>
        <p className="mt-2 text-sm text-slate-400">
          Only approved customer-visible documents are shown here.
        </p>
      </div>

      {loading ? (
        <Card className="border-white/10 bg-slate-900/70 p-6 text-sm text-slate-400">
          Loading documents...
        </Card>
      ) : documents.length === 0 ? (
        <Card className="border-white/10 bg-slate-900/70 p-8 text-center text-sm text-slate-400">
          <FileText className="mx-auto mb-3 h-8 w-8 text-slate-500" />
          No customer-visible documents are available yet.
        </Card>
      ) : (
        <div className="grid gap-3">
          {documents.map((document) => (
            <Card key={document.id} className="border-white/10 bg-slate-900/70 p-4">
              <p className="font-medium text-white">{document.name}</p>
              <p className="mt-1 text-sm text-slate-400">{document.document_type}</p>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => void openDocument(document)}>
                  Preview or download
                </Button>
                {document.expiry_date ? (
                  <span className="text-xs text-slate-500">Expires {document.expiry_date}</span>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
