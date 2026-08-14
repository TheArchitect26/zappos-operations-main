const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

type PublicAuthOriginInputs = {
  configuredOrigin?: string;
  codespacesOrigin?: string;
  currentOrigin?: string;
  isDevelopment: boolean;
};

function normalizeOrigin(value: string | undefined) {
  if (!value) return null;
  const url = new URL(value);
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("Public auth origin must not include a path, query, or fragment.");
  }
  return url.origin;
}

function isLocalOrigin(origin: string) {
  return LOCAL_HOSTS.has(new URL(origin).hostname);
}

export function resolvePublicAuthOrigin(inputs: PublicAuthOriginInputs) {
  const configured = normalizeOrigin(inputs.configuredOrigin);
  if (configured) {
    if (isLocalOrigin(configured) && !inputs.isDevelopment) {
      throw new Error("A local address cannot be used for public auth outside development.");
    }
    return configured;
  }

  const codespaces = normalizeOrigin(inputs.codespacesOrigin);
  if (codespaces) return codespaces;

  const current = normalizeOrigin(inputs.currentOrigin);
  if (current && inputs.isDevelopment && isLocalOrigin(current)) return current;

  throw new Error(
    "No externally reachable public auth origin is configured. Set VITE_PUBLIC_APP_URL.",
  );
}

export function getPublicAuthOrigin() {
  return resolvePublicAuthOrigin({
    configuredOrigin: import.meta.env.VITE_PUBLIC_APP_URL,
    codespacesOrigin: import.meta.env.VITE_CODESPACES_PUBLIC_ORIGIN,
    currentOrigin: typeof window === "undefined" ? undefined : window.location.origin,
    isDevelopment: import.meta.env.DEV,
  });
}

export function getPublicAuthRedirect(path: "/auth/callback" | "/auth/reset-password") {
  const url = new URL(path, getPublicAuthOrigin());
  console.info("[Auth] public redirect selected", { origin: url.origin, path: url.pathname });
  return url.toString();
}
