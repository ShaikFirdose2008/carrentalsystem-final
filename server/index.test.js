import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { after, before, test } from "node:test";

let child;
let baseUrl;
let userCookie;
let adminCookie;
let booking;

async function unusedPort() {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

async function waitForApi() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error("Test API exited before becoming ready.");
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Test API did not become ready.");
}

async function api(path, { method = "GET", cookie, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json();
  return { response, data };
}

before(async () => {
  const port = await unusedPort();
  baseUrl = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ["server/index.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      ADMIN_EMAIL: "fleet-test@example.com",
      ADMIN_PASSWORD: "test-admin-password-2026",
      SESSION_SECRET: "test-session-secret-with-sufficient-length"
    },
    stdio: "ignore"
  });
  await waitForApi();
});

after(async () => {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await once(child, "exit");
});

test("registration creates a customer account and rejects admin self-assignment", async () => {
  const result = await api("/api/auth/register", {
    method: "POST",
    body: {
      name: "Test Rider",
      email: "rider-test@example.com",
      phone: "+91 9876543210",
      password: "test-customer-password-2026",
      role: "admin"
    }
  });
  assert.equal(result.response.status, 201);
  const login = await api("/api/auth/login", {
    method: "POST",
    body: { email: "rider-test@example.com", password: "test-customer-password-2026" }
  });
  assert.equal(login.response.status, 200);
  assert.equal(login.data.user.role, "user");
  userCookie = login.response.headers.get("set-cookie").split(";")[0];
});

test("user sessions cannot access admin resources", async () => {
  const analytics = await api("/api/admin/analytics", { cookie: userCookie });
  assert.equal(analytics.response.status, 403);
  const addCar = await api("/api/cars", {
    method: "POST",
    cookie: userCookie,
    body: { name: "Unauthorized Admin Car", type: "Luxury", seats: 4, price: 1000 }
  });
  assert.equal(addCar.response.status, 403);
  const profile = await api("/api/profile", { cookie: userCookie });
  assert.equal(profile.data.role, "user");
  assert.equal(Object.hasOwn(profile.data, "passwordHash"), false);
});

test("booking availability prevents overlapping vehicle reservations", async () => {
  const start = new Date(Date.now() + 36 * 60 * 60 * 1000);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const startAt = start.toISOString();
  const endAt = end.toISOString();
  const available = await api("/api/bookings/check-availability", {
    method: "POST", cookie: userCookie, body: { carId: "c5", startAt, endAt }
  });
  assert.equal(available.response.status, 200);
  assert.equal(available.data.available, true);
  const quote = await api("/api/pricing/quote", {
    method: "POST", cookie: userCookie, body: { carId: "c5", startAt, endAt }
  });
  assert.equal(quote.response.status, 200);
  const create = await api("/api/bookings", {
    method: "POST", cookie: userCookie, body: { carId: "c5", startAt, endAt, city: "Mumbai", pickup: "Dadar" }
  });
  assert.equal(create.response.status, 201);
  assert.equal(create.data.paymentStatus, "Not processed (demo)");
  assert.equal(create.data.total, quote.data.total);
  booking = create.data;
  const conflict = await api("/api/bookings", {
    method: "POST",
    cookie: userCookie,
    body: { carId: "c5", startAt: new Date(start.getTime() + 60 * 60 * 1000).toISOString(), endAt, city: "Mumbai", pickup: "Dadar" }
  });
  assert.equal(conflict.response.status, 409);
});

test("admin access requires the provisioned account and can verify a booking QR", async () => {
  const login = await api("/api/auth/login", {
    method: "POST",
    body: { email: "fleet-test@example.com", password: "test-admin-password-2026" }
  });
  assert.equal(login.response.status, 200);
  assert.equal(login.data.user.role, "admin");
  adminCookie = login.response.headers.get("set-cookie").split(";")[0];
  const customerList = await api("/api/admin/customers", { cookie: adminCookie });
  const customer = customerList.data.find((item) => item.email === "rider-test@example.com");
  assert.ok(customer);
  const suspend = await api(`/api/admin/customers/${customer.id}/status`, {
    method: "PATCH", cookie: adminCookie, body: { status: "suspended" }
  });
  assert.equal(suspend.response.status, 200);
  const blocked = await api("/api/profile", { cookie: userCookie });
  assert.equal(blocked.response.status, 403);
  const reactivate = await api(`/api/admin/customers/${customer.id}/status`, {
    method: "PATCH", cookie: adminCookie, body: { status: "active" }
  });
  assert.equal(reactivate.response.status, 200);
  const bookings = await api("/api/bookings", { cookie: adminCookie });
  assert.equal(bookings.data.some((item) => item.id === booking.id), true);
  const verified = await api(`/api/bookings/${booking.id}/verify-qr`, {
    method: "POST",
    cookie: adminCookie,
    body: { token: booking.qrToken }
  });
  assert.equal(verified.response.status, 200);
  assert.equal(verified.data.verified, true);
});
