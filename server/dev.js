import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const portProbe = createServer();
portProbe.listen(0, "127.0.0.1");
await new Promise((resolve, reject) => {
  portProbe.once("listening", resolve);
  portProbe.once("error", reject);
});
const apiPort = portProbe.address().port;
await new Promise((resolve, reject) => portProbe.close((error) => error ? reject(error) : resolve()));

const processes = [
  spawn(process.execPath, ["server/index.js"], { cwd: root, stdio: "inherit", env: { ...process.env, PORT: String(apiPort) } }),
  spawn(process.execPath, ["node_modules/vite/bin/vite.js"], { cwd: root, stdio: "inherit", env: { ...process.env, API_PROXY: `http://127.0.0.1:${apiPort}` } })
];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of processes) {
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
  process.exitCode = code;
}

for (const child of processes) {
  child.on("error", (error) => {
    console.error("Could not start a development process:", error);
    stop(1);
  });
  child.on("exit", (code, signal) => {
    if (stopping) return;
    if (signal) {
      stop(1);
      return;
    }
    if (code !== 0) {
      stop(code || 1);
      return;
    }
    stop(0);
  });
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
