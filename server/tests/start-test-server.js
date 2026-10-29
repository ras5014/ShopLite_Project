import { startTestServer } from "./helpers.js";

const app = await startTestServer(5105);
console.log(`Isolated browser-test API ready at ${app.url}`);

let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await app.stop();
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
