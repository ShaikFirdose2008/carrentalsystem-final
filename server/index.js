import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

const app = express();
const port = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET;

if (isProduction && !sessionSecret) throw new Error("SESSION_SECRET must be set in production.");

app.set("trust proxy", isProduction ? 1 : false);
app.use(express.json({ limit: "1mb" }));
app.use(session({
  name: "roam.sid",
  secret: sessionSecret || randomUUID(),
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: isProduction, maxAge: 1000 * 60 * 60 * 8 }
}));

const users = new Map();
const failedLogins = [];
const securityEvents = [];
const adminActions = [];
let cars = [
  { id: "c1", name: "Porsche 911 Carrera", brand: "Porsche", type: "Sports", fuel: "Petrol", seats: 2, price: 4800, mileage: 10, rating: 4.98, image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85", location: "Bandra West", city: "Mumbai", tag: "MOST LOVED", transmission: "Automatic", available: true, registration: "MH 02 AB 9110", odometer: 12000, lastService: "2026-10-15" },
  { id: "c2", name: "Mini Cooper S", brand: "Mini", type: "City", fuel: "Petrol", seats: 4, price: 1800, mileage: 16, rating: 4.92, image: "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&w=1000&q=85", location: "Bandra West", city: "Mumbai", tag: "CITY FAVORITE", transmission: "Automatic", available: true, registration: "MH 02 CD 2024", odometer: 8200, lastService: "2026-09-11" },
  { id: "c3", name: "Mercedes-Benz GLC", brand: "Mercedes-Benz", type: "Luxury", fuel: "Diesel", seats: 5, price: 3600, mileage: 14, rating: 4.96, image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=85", location: "Andheri East", city: "Mumbai", tag: "EXTRA COMFORT", transmission: "Automatic", available: true, registration: "MH 02 EF 3030", odometer: 19800, lastService: "2026-07-12" },
  { id: "c4", name: "Jeep Wrangler", brand: "Jeep", type: "Adventure", fuel: "Diesel", seats: 5, price: 2900, mileage: 12, rating: 4.89, image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=85", location: "Powai", city: "Mumbai", tag: "WEEKEND READY", transmission: "Automatic", available: true, registration: "MH 02 GH 4040", odometer: 21400, lastService: "2026-08-05" },
  { id: "c5", name: "Hyundai i20", brand: "Hyundai", type: "Budget", fuel: "Petrol", seats: 5, price: 900, mileage: 20, rating: 4.84, image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1000&q=85", location: "Dadar", city: "Mumbai", tag: "GREAT VALUE", transmission: "Manual", available: true, registration: "MH 02 IJ 5050", odometer: 9100, lastService: "2026-10-02" },
  { id: "c6", name: "Tesla Model 3", brand: "Tesla", type: "Electric", fuel: "Electric", seats: 5, price: 2600, mileage: 7, rating: 4.95, image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1000&q=85", location: "BKC", city: "Mumbai", tag: "ELECTRIC DRIVE", transmission: "Automatic", available: true, registration: "MH 02 KL 6060", odometer: 6700, lastService: "2026-09-22" }
];
let bookings = [];
let maintenance = [
  { id: "m1", car: "Tesla Model 3", task: "Battery health check", date: "2026-11-09T15:30", status: "In progress", priority: "High" },
  { id: "m2", car: "Jeep Wrangler", task: "Routine service · 20,000 km", date: "2026-11-10T10:00", status: "Scheduled", priority: "Normal" },
  { id: "m3", car: "Mini Cooper S", task: "Tire rotation", date: "2026-11-14T09:00", status: "Scheduled", priority: "Normal" }
];
let drivers = [
  { id: "d1", name: "Aarav Sharma", phone: "+91 98765 43210", license: "MH-DR-1248", status: "Verified", assigned: "MH 02 CD 2024" },
  { id: "d2", name: "Ananya Iyer", phone: "+91 98123 45670", license: "MH-DR-2391", status: "Verified", assigned: "MH 02 EF 3030" }
];
let reviews = [];
let inspections = [];
let notifications = [];
const favorites = new Map();
let trackingProgress = new Map();
let sequence = 7;

function recordSecurity(type, details, req) {
  securityEvents.unshift({ id: randomUUID(), type, details, ip: req.ip, at: new Date().toISOString() });
  if (securityEvents.length > 200) securityEvents.pop();
}

function recordAdminAction(action, req) {
  adminActions.unshift({ id: randomUUID(), action, email: req.session.user.email, at: new Date().toISOString() });
  if (adminActions.length > 200) adminActions.pop();
}

function addNotification(userId, text, kind, bookingId) {
  notifications.unshift({ id: randomUUID(), userId, text, kind, bookingId, at: new Date().toISOString(), read: false });
  if (notifications.length > 1000) notifications.pop();
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: "Please sign in to continue." });
  const account = users.get(req.session.user.email);
  if (!account || account.status === "suspended") return res.status(403).json({ error: "This account is suspended. Contact Roam support." });
  next();
}

function requireAdmin(req, res, next) {
  if (req.session.user?.role !== "admin") return res.status(403).json({ error: "Administrator access is required." });
  next();
}

function cleanUser(user) {
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status || "active", preferences: user.preferences || {} };
}

function overlappingBooking(carId, start, end, excludeId) {
  return bookings.find((booking) => booking.carId === carId
    && booking.id !== excludeId
    && !["Cancelled", "Rejected"].includes(booking.status)
    && new Date(start) < new Date(booking.endAt)
    && new Date(end) > new Date(booking.startAt));
}

function pricingFor(car, startAt, endAt) {
  const hours = Math.max(1, Math.ceil((new Date(endAt) - new Date(startAt)) / 3600000));
  const basePrice = car.price * hours;
  const discount = hours >= 24 ? Math.round(basePrice * 0.1) : 0;
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "short" }).format(new Date(startAt));
  const demandSurcharge = ["Sat", "Sun"].includes(weekday) ? Math.round(basePrice * 0.05) : 0;
  return { hours, basePrice, discount, demandSurcharge, total: basePrice - discount + demandSurcharge };
}

if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must contain at least 12 characters.");
  users.set(email, { id: randomUUID(), name: process.env.ADMIN_NAME || "Fleet Administrator", email, phone: "", role: "admin", status: "active", passwordHash: bcrypt.hashSync(password, 12), preferences: {} });
  console.log(`Configured fleet administrator: ${email}`);
} else {
  console.warn("No admin account configured. Set ADMIN_EMAIL and ADMIN_PASSWORD to enable administrator login.");
}

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/auth/me", (req, res, next) => {
  if (!req.session.user) return res.json({ user: null });
  const account = users.get(req.session.user.email);
  if (!account || account.status === "suspended") {
    return req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie("roam.sid", { httpOnly: true, sameSite: "lax", secure: isProduction });
      res.json({ user: null });
    });
  }
  res.json({ user: cleanUser(account) });
});
app.post("/api/auth/register", async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const phone = String(req.body.phone || "").trim();
  const password = String(req.body.password || "");
  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\+91[\s-]?[6-9]\d{9}$/.test(phone) || password.length < 10) {
    return res.status(400).json({ error: "Enter a name, valid email, Indian mobile (+91), and password of at least 10 characters." });
  }
  if (users.has(email)) return res.status(409).json({ error: "An account with that email already exists." });
  users.set(email, { id: randomUUID(), name, email, phone, role: "user", status: "active", passwordHash: await bcrypt.hash(password, 12), preferences: {}, rewards: 250 });
  recordSecurity("account_created", `New customer account: ${email}`, req);
  res.status(201).json({ message: "Account created. Please sign in.", email });
});
app.post("/api/auth/login", async (req, res, next) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const recentAttempts = failedLogins.filter((entry) => entry.email === email && entry.at > Date.now() - 15 * 60 * 1000);
  if (recentAttempts.length >= 8) return res.status(429).json({ error: "Too many failed sign-in attempts. Try again in 15 minutes." });
  const account = users.get(email);
  if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
    failedLogins.push({ email, at: Date.now() });
    if (failedLogins.length > 1000) failedLogins.shift();
    recordSecurity("failed_login", `Failed sign-in for ${email || "unknown account"}`, req);
    return res.status(401).json({ error: "Email or password is incorrect." });
  }
  if (account.status === "suspended") {
    recordSecurity("suspended_login", `Sign-in blocked for suspended account ${email}`, req);
    return res.status(403).json({ error: "This account is suspended. Contact Roam support." });
  }
  req.session.regenerate((error) => {
    if (error) return next(error);
    req.session.user = cleanUser(account);
    req.session.save((saveError) => {
      if (saveError) return next(saveError);
      res.json({ user: req.session.user });
    });
  });
});
app.post("/api/auth/logout", requireAuth, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie("roam.sid", { httpOnly: true, sameSite: "lax", secure: isProduction });
    res.json({ message: "Signed out." });
  });
});
app.get("/api/profile", requireAuth, (req, res) => {
  const account = users.get(req.session.user.email);
  res.json(cleanUser(account));
});
app.patch("/api/profile", requireAuth, (req, res) => {
  const account = users.get(req.session.user.email);
  const name = String(req.body.name || "").trim();
  const phone = String(req.body.phone || "").trim();
  if (name.length < 2 || !/^\+91[\s-]?[6-9]\d{9}$/.test(phone)) return res.status(400).json({ error: "Enter your name and a valid +91 mobile number." });
  account.name = name;
  account.phone = phone;
  account.preferences = { ...account.preferences, ...req.body.preferences };
  req.session.user = cleanUser(account);
  res.json(req.session.user);
});

app.get("/api/cars", (_req, res) => res.json(cars));
app.post("/api/cars", requireAdmin, (req, res) => {
  const { name, type, seats, price, image, location, fuel, transmission, mileage } = req.body;
  if (!name || !type || !Number.isFinite(Number(price)) || Number(price) <= 0 || !Number.isInteger(Number(seats)) || Number(seats) < 2) {
    return res.status(400).json({ error: "Name, category, positive hourly price, and at least 2 seats are required." });
  }
  const car = { id: `c${sequence++}`, name: String(name).trim(), brand: String(name).trim().split(" ")[0], type, seats: Number(seats), price: Number(price), mileage: Number(mileage) || 15, fuel: fuel || "Petrol", transmission: transmission || "Automatic", image: image || "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=85", location: location || "Bandra West", city: "Mumbai", tag: "JUST ADDED", rating: 4.9, available: true, registration: "PENDING", odometer: 0, lastService: new Date().toISOString().slice(0, 10) };
  cars.unshift(car);
  recordAdminAction(`Added vehicle ${car.name}`, req);
  res.status(201).json(car);
});
app.patch("/api/cars/:id", requireAdmin, (req, res) => {
  const car = cars.find((item) => item.id === req.params.id);
  if (!car) return res.status(404).json({ error: "Vehicle not found." });
  for (const field of ["name", "type", "seats", "price", "fuel", "transmission", "mileage", "location", "available", "odometer", "lastService"]) {
    if (req.body[field] !== undefined) car[field] = req.body[field];
  }
  recordAdminAction(`Updated vehicle ${car.name}`, req);
  res.json(car);
});
app.delete("/api/cars/:id", requireAdmin, (req, res) => {
  if (bookings.some((booking) => booking.carId === req.params.id && !["Cancelled", "Rejected"].includes(booking.status))) {
    return res.status(409).json({ error: "This vehicle has active bookings and cannot be removed." });
  }
  const car = cars.find((item) => item.id === req.params.id);
  if (!car) return res.status(404).json({ error: "Vehicle not found." });
  cars = cars.filter((item) => item.id !== req.params.id);
  recordAdminAction(`Removed vehicle ${car.name}`, req);
  res.json({ message: "Vehicle removed." });
});

app.get("/api/bookings", requireAuth, (req, res) => {
  const visible = req.session.user.role === "admin" ? bookings : bookings.filter((item) => item.userId === req.session.user.id);
  res.json(visible);
});
app.post("/api/bookings/check-availability", requireAuth, (req, res) => {
  const { carId, startAt, endAt } = req.body;
  const car = cars.find((item) => item.id === carId);
  if (!car || !Number.isFinite(Date.parse(startAt)) || !Number.isFinite(Date.parse(endAt)) || new Date(startAt) < new Date() || new Date(endAt) <= new Date(startAt)) {
    return res.status(400).json({ error: "Choose a vehicle and valid pickup and return dates." });
  }
  const conflict = overlappingBooking(carId, startAt, endAt);
  res.json({ available: car.available && !conflict, unavailableReason: !car.available ? "Vehicle is marked unavailable." : null, conflict: conflict ? { id: conflict.id, startAt: conflict.startAt, endAt: conflict.endAt } : null });
});
app.post("/api/pricing/quote", requireAuth, (req, res) => {
  const { carId, startAt, endAt } = req.body;
  const car = cars.find((item) => item.id === carId);
  if (!car || !Number.isFinite(Date.parse(startAt)) || !Number.isFinite(Date.parse(endAt)) || new Date(startAt) < new Date() || new Date(endAt) <= new Date(startAt)) {
    return res.status(400).json({ error: "Choose a vehicle and valid pickup and return dates." });
  }
  if (!car.available) return res.status(409).json({ error: "This vehicle is currently unavailable." });
  res.json(pricingFor(car, startAt, endAt));
});
app.post("/api/bookings", requireAuth, (req, res) => {
  const { carId, startAt, endAt, city, pickup } = req.body;
  const car = cars.find((item) => item.id === carId);
  if (!car || !Number.isFinite(Date.parse(startAt)) || !Number.isFinite(Date.parse(endAt)) || new Date(endAt) <= new Date(startAt)) {
    return res.status(400).json({ error: "Choose a vehicle and valid pickup and return dates." });
  }
  if (overlappingBooking(carId, startAt, endAt)) return res.status(409).json({ error: "That car was just booked for part of this time. Choose another time or vehicle." });
  const price = pricingFor(car, startAt, endAt);
  const booking = {
    id: `R-${Math.floor(100000 + Math.random() * 900000)}`,
    qrToken: randomUUID(),
    userId: req.session.user.id,
    carId,
    car: car.name,
    customer: req.session.user.name,
    hours: price.hours,
    startAt,
    endAt,
    city: city || car.city,
    pickup: pickup || car.location,
    basePrice: price.basePrice,
    discount: price.discount,
    demandSurcharge: price.demandSurcharge,
    total: price.total,
    status: "Confirmed",
    paymentStatus: "Not processed (demo)",
    createdAt: new Date().toISOString()
  };
  bookings.unshift(booking);
  addNotification(booking.userId, `Booking ${booking.id} is confirmed. Payment has not been processed.`, "booking", booking.id);
  recordSecurity("booking_created", `Booking ${booking.id} · ${car.name}`, req);
  res.status(201).json(booking);
});
app.patch("/api/bookings/:id/status", requireAuth, (req, res) => {
  const booking = bookings.find((item) => item.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found." });
  if (req.session.user.role !== "admin" && booking.userId !== req.session.user.id) return res.status(403).json({ error: "You cannot update this booking." });
  const allowed = req.session.user.role === "admin" ? ["Approved", "Rejected", "Cancelled", "Active", "Completed"] : ["Cancelled"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "That booking status change is not allowed." });
  if (req.session.user.role !== "admin" && (!["Confirmed", "Approved"].includes(booking.status) || new Date(booking.startAt).getTime() - Date.now() < 2 * 60 * 60 * 1000)) {
    return res.status(409).json({ error: "Customer cancellation is available only more than 2 hours before a confirmed pickup." });
  }
  booking.status = req.body.status;
  if (req.session.user.role === "admin") recordAdminAction(`${req.body.status} booking ${booking.id}`, req);
  addNotification(booking.userId, `Booking ${booking.id} status changed to ${booking.status}.`, "booking", booking.id);
  res.json(booking);
});
app.post("/api/bookings/:id/verify-qr", requireAuth, requireAdmin, (req, res) => {
  const booking = bookings.find((item) => item.id === req.params.id && item.qrToken === req.body.token);
  if (!booking) return res.status(404).json({ error: "QR code doesn't match this booking." });
  booking.pickupVerifiedAt = new Date().toISOString();
  recordAdminAction(`Verified pickup QR for ${booking.id}`, req);
  res.json({ verified: true, booking: { id: booking.id, car: booking.car, customer: booking.customer } });
});
app.get("/api/bookings/:id/invoice", requireAuth, (req, res) => {
  const booking = bookings.find((item) => item.id === req.params.id);
  if (!booking || (req.session.user.role !== "admin" && booking.userId !== req.session.user.id)) return res.status(404).json({ error: "Booking not found." });
  res.json({ invoice: `ROAM-${booking.id}`, booking: { ...booking, qrToken: undefined } });
});
app.get("/api/tracking/:id", requireAuth, (req, res) => {
  const booking = bookings.find((item) => item.id === req.params.id);
  if (!booking || (req.session.user.role !== "admin" && booking.userId !== req.session.user.id)) return res.status(404).json({ error: "Booking not found." });
  const car = cars.find((item) => item.id === booking.carId);
  const progress = (trackingProgress.get(booking.id) || 0) % 4;
  trackingProgress.set(booking.id, progress + 1);
  const status = booking.pickupVerifiedAt ? "Pickup verified" : ["Driver assigned", "On the way to pickup", "Arriving shortly", "Ready for pickup"][progress];
  if (booking.lastTrackingStatus !== status) {
    booking.lastTrackingStatus = status;
    addNotification(booking.userId, `Tracking update for ${booking.id}: ${status}.`, "tracking", booking.id);
  }
  res.json({
    mode: "SIMULATED DEMO TRACKING",
    status,
    etaMinutes: Math.max(2, 14 - progress * 3),
    pickup: booking.pickup,
    destination: booking.pickup,
    registration: car?.registration || "Pending",
    driver: drivers[0] || null,
    progress: 35 + progress * 18,
    coordinates: { lat: 19.076 + progress * 0.004, lng: 72.878 + progress * 0.005 }
  });
});
app.get("/api/maintenance", requireAdmin, (_req, res) => res.json(maintenance));
app.post("/api/maintenance", requireAdmin, (req, res) => {
  const { car, task, date, priority } = req.body;
  if (!car || !task || !date) return res.status(400).json({ error: "Car, task, and date are required." });
  const item = { id: randomUUID(), car, task, date, priority: priority || "Normal", status: "Scheduled" };
  maintenance.unshift(item);
  recordAdminAction(`Scheduled maintenance: ${car} · ${task}`, req);
  res.status(201).json(item);
});
app.get("/api/drivers", requireAdmin, (_req, res) => res.json(drivers));
app.post("/api/drivers", requireAdmin, (req, res) => {
  const { name, phone, license } = req.body;
  if (!name || !/^\+91[\s-]?[6-9]\d{9}$/.test(phone || "") || !license) return res.status(400).json({ error: "Name, valid +91 phone, and license number are required." });
  const driver = { id: randomUUID(), name, phone, license, status: "Pending verification", assigned: "Unassigned" };
  drivers.unshift(driver);
  recordAdminAction(`Registered driver ${name}`, req);
  res.status(201).json(driver);
});
app.patch("/api/drivers/:id", requireAdmin, (req, res) => {
  const driver = drivers.find((item) => item.id === req.params.id);
  if (!driver) return res.status(404).json({ error: "Driver not found." });
  const nextStatus = req.body.status || driver.status;
  if (req.body.status && !["Verified", "Pending verification", "Suspended"].includes(req.body.status)) return res.status(400).json({ error: "Choose an allowed verification status." });
  if (req.body.assigned !== undefined) {
    if (req.body.assigned !== "Unassigned" && !cars.some((car) => car.registration === req.body.assigned)) return res.status(400).json({ error: "Choose a registered vehicle." });
    if (req.body.assigned !== "Unassigned" && nextStatus !== "Verified") return res.status(409).json({ error: "Verify the driver before assigning a vehicle." });
    if (drivers.some((item) => item.id !== driver.id && item.assigned === req.body.assigned && req.body.assigned !== "Unassigned")) return res.status(409).json({ error: "That vehicle is already assigned to another driver." });
    driver.assigned = req.body.assigned;
  }
  driver.status = nextStatus;
  recordAdminAction(`Updated driver ${driver.name}`, req);
  res.json(driver);
});
app.get("/api/admin/customers", requireAdmin, (_req, res) => res.json([...users.values()].filter((item) => item.role === "user").map((item) => ({ ...cleanUser(item), status: item.status, bookings: bookings.filter((booking) => booking.userId === item.id).length }))));
app.patch("/api/admin/customers/:id/status", requireAdmin, (req, res) => {
  const account = [...users.values()].find((item) => item.id === req.params.id && item.role === "user");
  if (!account) return res.status(404).json({ error: "Customer not found." });
  if (!["active", "suspended"].includes(req.body.status)) return res.status(400).json({ error: "Choose an allowed account status." });
  account.status = req.body.status;
  recordAdminAction(`${req.body.status === "suspended" ? "Suspended" : "Reactivated"} customer ${account.email}`, req);
  res.json({ ...cleanUser(account), status: account.status, bookings: bookings.filter((booking) => booking.userId === account.id).length });
});
app.get("/api/admin/analytics", requireAdmin, (_req, res) => res.json({
  users: [...users.values()].filter((item) => item.role === "user").length,
  cars: cars.length,
  bookings: bookings.length,
  revenue: bookings.reduce((sum, item) => sum + item.total, 0),
  monthlyRevenue: Array.from({ length: 6 }, (_value, index) => ({ month: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"][index], amount: bookings.filter((item) => new Date(item.createdAt).getMonth() === (index + 5) % 12).reduce((sum, item) => sum + item.total, 0) }))
}));
app.get("/api/admin/security", requireAdmin, (_req, res) => res.json({ failedLogins: failedLogins.slice(-50).reverse(), events: securityEvents.slice(0, 50), adminActions: adminActions.slice(0, 50) }));
app.get("/api/notifications", requireAuth, (req, res) => {
  const now = Date.now();
  for (const booking of bookings) {
    const timeToPickup = new Date(booking.startAt).getTime() - now;
    const reminderAlreadyCreated = notifications.some((item) => item.userId === req.session.user.id && item.kind === "reminder" && item.bookingId === booking.id);
    if (booking.userId === req.session.user.id && ["Confirmed", "Approved"].includes(booking.status) && timeToPickup > 0 && timeToPickup <= 24 * 60 * 60 * 1000 && !reminderAlreadyCreated) {
      addNotification(req.session.user.id, `Pickup reminder: ${booking.car} is scheduled for ${booking.pickup} on ${booking.startAt}.`, "reminder", booking.id);
    }
  }
  res.json(notifications.filter((item) => item.userId === req.session.user.id));
});
app.patch("/api/notifications/:id/read", requireAuth, (req, res) => {
  const notification = notifications.find((item) => item.id === req.params.id && item.userId === req.session.user.id);
  if (!notification) return res.status(404).json({ error: "Notification not found." });
  notification.read = true;
  res.json(notification);
});
app.get("/api/rewards", requireAuth, (req, res) => {
  const account = users.get(req.session.user.email);
  const userBookings = bookings.filter((item) => item.userId === account.id);
  res.json({ points: (account.rewards || 250) + userBookings.length * 50, history: userBookings.map((item) => ({ label: `Ride · ${item.car}`, points: 50, date: item.createdAt })) });
});
app.get("/api/favorites", requireAuth, (req, res) => res.json(favorites.get(req.session.user.id) || []));
app.put("/api/favorites", requireAuth, (req, res) => {
  const ids = req.body.carIds;
  if (!Array.isArray(ids) || ids.some((id) => !cars.some((car) => car.id === id))) return res.status(400).json({ error: "Choose valid vehicles to save." });
  favorites.set(req.session.user.id, [...new Set(ids)]);
  res.json(favorites.get(req.session.user.id));
});
app.post("/api/inspections", requireAuth, (req, res) => {
  const { bookingId, stage, fuel, odometer, notes, photos } = req.body;
  const booking = bookings.find((item) => item.id === bookingId && item.userId === req.session.user.id);
  if (!booking || !["before", "after"].includes(stage) || !Number.isFinite(Number(fuel)) || !Number.isFinite(Number(odometer))) {
    return res.status(400).json({ error: "Choose your booking, inspection stage, fuel level, and odometer reading." });
  }
  const inspection = { id: randomUUID(), bookingId, stage, fuel: Number(fuel), odometer: Number(odometer), notes: String(notes || "").slice(0, 500), photoCount: Array.isArray(photos) ? Math.min(photos.length, 8) : 0, at: new Date().toISOString() };
  inspections.unshift(inspection);
  res.status(201).json(inspection);
});
app.post("/api/reviews", requireAuth, (req, res) => {
  const { carId, rating, comment } = req.body;
  if (!cars.some((car) => car.id === carId) || !Number.isInteger(Number(rating)) || rating < 1 || rating > 5 || !String(comment || "").trim()) {
    return res.status(400).json({ error: "Choose a vehicle, a 1–5 star rating, and write a comment." });
  }
  const review = { id: randomUUID(), user: req.session.user.name, carId, rating: Number(rating), comment: String(comment).trim().slice(0, 1000), at: new Date().toISOString() };
  reviews.unshift(review);
  res.status(201).json(review);
});
app.get("/api/reviews", (_req, res) => res.json(reviews));

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(port, () => console.log(`Roam API listening on http://localhost:${port}`));
