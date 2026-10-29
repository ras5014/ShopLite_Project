import { execFile, spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import { Product } from "../src/models/Product.js";
import { User } from "../src/models/User.js";

async function unusedPort() {
  const socket = net.createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  return port;
}

export async function startTestServer(requestedPort) {
  const database = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
  let child;

  async function stop() {
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = once(child, "exit");
      child.kill();
      await exited;
    }
    await mongoose.disconnect();
    await database.stop();
  }

  try {
    await mongoose.connect(database.getUri());
    await User.init();
    const products = await Product.create([
      { name: "Insulated Bottle", slug: "bottle", description: "A reusable bottle", category: "Lifestyle", price: 799, imageUrl: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" },
      { name: "Desk Lamp", slug: "lamp", description: "A study light", category: "Home", price: 1499, imageUrl: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" },
      { name: "Hidden Product", slug: "hidden", description: "Not for sale", category: "Home", price: 10, active: false },
    ]);
    const port = requestedPort || await unusedPort();
    const url = `http://127.0.0.1:${port}`;
    const secret = randomBytes(32).toString("hex");
    child = spawn(process.execPath, [fileURLToPath(new URL("../src/server.js", import.meta.url))], {
      env: {
        ...process.env,
        PORT: String(port),
        MONGODB_URI: database.getUri(),
        JWT_SECRET: secret,
        CLIENT_ORIGIN: "http://127.0.0.1:5175",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let logs = "";
    child.stdout.on("data", (data) => { logs += data; });
    child.stderr.on("data", (data) => { logs += data; });
    let spawnError;
    child.on("error", (error) => { spawnError = error; });
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (spawnError) throw spawnError;
      if (child.exitCode !== null) throw new Error(`Test server exited: ${logs}`);
      try {
        const response = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(500) });
        if (response.ok) {
          ready = true;
          break;
        }
      } catch (error) {
        if (attempt === 99) throw new Error(`Test server did not become ready: ${logs}`, { cause: error });
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error(`Test server did not become ready: ${logs}`);

    async function request(path, { method = "GET", body, token } = {}) {
      const headers = {};
      if (body !== undefined) headers["Content-Type"] = "application/json";
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch(url + path, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, data: await response.json() };
    }

    async function seed() {
      return promisify(execFile)(
        process.execPath,
        [fileURLToPath(new URL("../src/seed/seedProducts.js", import.meta.url))],
        { env: { ...process.env, MONGODB_URI: database.getUri() } },
      );
    }

    return { url, request, products, secret, seed, stop };
  } catch (error) {
    await stop();
    throw error;
  }
}

export async function register(request, email) {
  const response = await request("/api/auth/register", {
    method: "POST",
    body: { name: "Student", email, password: "classroom-test-password" },
  });
  if (response.status !== 201) throw new Error(JSON.stringify(response));
  return response.data;
}
