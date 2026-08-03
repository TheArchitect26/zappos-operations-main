import { spawn, spawnSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const host = process.env.NITRO_HOST || "127.0.0.1";
const port = process.env.NITRO_PORT || "4173";
const healthUrl = `http://${host}:${port}/auth`;
const outputEntry = new URL("../.output/server/index.mjs", import.meta.url);
const outputMetadata = new URL("../.output/nitro.json", import.meta.url);
const srvxEntry = new URL("../node_modules/srvx/bin/srvx.mjs", import.meta.url);

const build = spawnSync("npm", ["run", "build"], {
  env: {
    ...process.env,
    NITRO_PRESET: "node-server",
  },
  stdio: "inherit",
});

if (build.error) {
  console.error(`[e2e-server] Production build could not start: ${build.error.message}`);
  process.exit(1);
}

if (build.status !== 0) {
  console.error(`[e2e-server] Production build failed with exit code ${build.status}.`);
  process.exit(build.status ?? 1);
}

try {
  await access(outputEntry);
  await access(srvxEntry);
  const metadata = JSON.parse(await readFile(outputMetadata, "utf8"));
  if (metadata.preset !== "node-server") {
    throw new Error(`expected node-server output, received ${String(metadata.preset)}`);
  }
} catch (error) {
  console.error(`[e2e-server] Production Nitro output is unavailable: ${error.message}`);
  process.exit(1);
}

const server = spawn(
  process.execPath,
  [
    fileURLToPath(srvxEntry),
    "serve",
    "--prod",
    "--entry",
    fileURLToPath(outputEntry),
    "--host",
    host,
    "--port",
    port,
  ],
  {
    env: {
      ...process.env,
      NITRO_HOST: host,
      NITRO_PORT: port,
    },
    stdio: "inherit",
  },
);

console.log(`[e2e-server] Started Nitro PID ${server.pid ?? "unknown"} on ${healthUrl}.`);

let shuttingDown = false;
const stop = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  if (server.exitCode === null) server.kill(signal);
};

process.once("SIGINT", () => stop("SIGINT"));
process.once("SIGTERM", () => stop("SIGTERM"));

const exited = new Promise((resolve) => {
  server.once("error", (error) => {
    console.error(`[e2e-server] Nitro failed to start: ${error.message}`);
    resolve(1);
  });
  server.once("exit", (code, signal) => {
    const exitCode = code ?? (signal && shuttingDown ? 0 : 1);
    if (!shuttingDown || exitCode !== 0) {
      console.error(
        `[e2e-server] Nitro exited before Playwright shutdown (code=${String(code)}, signal=${String(signal)}).`,
      );
    }
    resolve(exitCode);
  });
});

let ready = false;
for (let attempt = 1; attempt <= 60; attempt += 1) {
  if (server.exitCode !== null) break;
  try {
    const response = await fetch(healthUrl, { redirect: "manual" });
    if (response.status >= 200 && response.status < 500) {
      ready = true;
      console.log(`[e2e-server] Ready after ${attempt} health check(s).`);
      break;
    }
  } catch {
    // The server socket is not ready yet.
  }
  await new Promise((resolve) => setTimeout(resolve, 500));
}

if (!ready) {
  console.error(
    `[e2e-server] Readiness failed: ${healthUrl} did not respond while Nitro was alive.`,
  );
  stop("SIGTERM");
  await exited;
  process.exit(1);
}

process.exitCode = await exited;
