import { AlertTriangle, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const sections = [
  "Identity",
  "Authentication",
  "Authorization",
  "Sessions",
  "Devices",
  "MFA",
  "API Security",
  "Secrets",
  "Certificates",
  "Access Reviews",
  "Delegation",
  "Security Events",
  "Threat Detection",
  "Compliance",
  "Privacy",
  "Data Governance",
  "Retention",
  "Legal Holds",
  "Encryption",
  "Key Management",
  "Audit",
  "Security Score",
];
const Panel = ({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className="grid gap-2 md:grid-cols-2">
      {items.map((item) => (
        <div key={item} className="rounded-md border p-3 text-sm">
          {item}
        </div>
      ))}
    </CardContent>
  </Card>
);

export function SecurityWorkspace() {
  return (
    <div className="space-y-5" data-testid="security-workspace">
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <Badge key={section} variant="secondary">
            {section}
          </Badge>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardDescription>Security score</CardDescription>
            <CardTitle>Unavailable</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            No complete evidence snapshot exists.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>MFA adoption</CardDescription>
            <CardTitle>Unknown</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Supabase factor evidence not loaded.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>High-risk sessions</CardDescription>
            <CardTitle>Unknown</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Absence of session records is not evidence of safety.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Threat alerts</CardDescription>
            <CardTitle>Unknown</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Detection source not configured.
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="identity">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="identity">Identity & Access</TabsTrigger>
          <TabsTrigger value="sessions">Sessions & Devices</TabsTrigger>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="privacy">Privacy & Data</TabsTrigger>
        </TabsList>
        <TabsContent value="identity">
          <Panel
            title="Enterprise identity and authorization"
            description="Supabase Auth and existing company RBAC remain authoritative."
            items={[
              "Users, employees, customers and suppliers",
              "Service, API, integration, Brain and ZIP identities",
              "Password, MFA, passkey and recovery-code metadata",
              "Company, branch, department, project and resource scope",
              "Temporary elevation and emergency access",
              "Delegated authority with automatic expiry",
              "Quarterly Access Reviews",
              "Human approval only",
            ]}
          />
        </TabsContent>
        <TabsContent value="sessions">
          <Panel
            title="Sessions, trusted devices and API security"
            description="References are hashed; credentials and raw addresses are never stored."
            items={[
              "Active sessions and concurrent-session evidence",
              "Idle timeout and expiration",
              "Session revocation and remote logout",
              "Trusted device approval, expiry and risk review",
              "Browser and country metadata",
              "IP hash",
              "API scopes, rotation and revocation",
              "No plaintext tokens",
            ]}
          />
        </TabsContent>
        <TabsContent value="threats">
          <Panel
            title="Security events and threat detection"
            description="Security evidence is append-only; Brain recommendations cannot mutate access."
            items={[
              "Login, logout and MFA events",
              "Role and permission changes",
              "Impossible travel",
              "Excessive failures and downloads",
              "Privilege escalation",
              "Suspicious API and automation use",
              "Cross-company attempts",
              "Brain advisory investigation",
            ]}
          />
        </TabsContent>
        <TabsContent value="governance">
          <Panel
            title="Compliance and cryptographic governance"
            description="Metadata describes evidence and coverage; no key or secret value is retained."
            items={[
              "Secret rotation metadata",
              "Certificate expiry",
              "At-rest and in-transit encryption evidence",
              "Key version references",
              "Compliance posture",
              "Security Score",
              "Existing audit authority links",
              "Command Centre and BI signals",
            ]}
          />
        </TabsContent>
        <TabsContent value="privacy">
          <Panel
            title="Privacy, classification and lifecycle"
            description="Operational records are never silently deleted."
            items={[
              "Consent, access, export and delete requests",
              "Data minimisation",
              "Public through Highly Restricted",
              "ZIP, Brain, API, report and document classification",
              "Retention with human disposition review",
              "Approved Legal Holds",
              "Held records cannot be deleted",
              "Deletion requests restrict or anonymise operational evidence",
            ]}
          />
        </TabsContent>
      </Tabs>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Security boundaries
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          <span>Supabase Auth: identity authority</span>
          <span>Existing RBAC: authorization authority</span>
          <span>ZIP: cited and read-only</span>
          <span>Brain: advisory only</span>
          <span>Mobile: trusted device and remote logout only</span>
          <span>No autonomous deletion or elevation</span>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <KeyRound className="h-4 w-4" />
          Secret and certificate metadata only
        </span>
        <span className="flex items-center gap-1">
          <LockKeyhole className="h-4 w-4" />
          No plaintext credentials or encryption keys
        </span>
        <span className="flex items-center gap-1">
          <AlertTriangle className="h-4 w-4" />
          Unknown remains unknown without evidence
        </span>
      </div>
    </div>
  );
}
