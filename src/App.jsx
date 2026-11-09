import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { divIcon } from "leaflet";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Activity, ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck,
  Bell, CalendarDays, CarFront, Check, ChevronDown, ChevronRight, CircleHelp,
  Clock3, Compass, CreditCard, Download, FileCheck2, Gauge, Heart,
  LayoutDashboard, LocateFixed, LockKeyhole, LogOut, MapPin, Menu,
  MessageCircle, Navigation, Plus, Search, Send, Settings2, ShieldCheck,
  SlidersHorizontal, Sparkles, Star, Users, Wallet, Wrench, X, Zap
} from "lucide-react";

const API = "/api";
const CITIES = {
  Mumbai: ["Bandra West", "BKC", "Andheri East", "Colaba", "Powai", "Dadar"],
  Bengaluru: ["Indiranagar", "Koramangala", "MG Road", "Whitefield", "Jayanagar", "HSR Layout"],
  Delhi: ["Connaught Place", "Aerocity", "Hauz Khas", "Saket", "Dwarka", "Gurugram"],
  Hyderabad: ["Jubilee Hills", "HITEC City", "Banjara Hills", "Gachibowli", "Madhapur", "Secunderabad"]
};
const CITY_SPOTS = {
  Mumbai: [
    { name: "Bandra West", position: [19.0596, 72.8295] }, { name: "BKC", position: [19.066, 72.869] },
    { name: "Andheri East", position: [19.1197, 72.8464] }, { name: "Colaba", position: [18.9067, 72.8147] },
    { name: "Powai", position: [19.1176, 72.906] }, { name: "Dadar", position: [19.0178, 72.8478] }
  ],
  Bengaluru: [
    { name: "Indiranagar", position: [12.9784, 77.6408] }, { name: "Koramangala", position: [12.9352, 77.6245] },
    { name: "MG Road", position: [12.9758, 77.605] }, { name: "Whitefield", position: [12.9698, 77.75] },
    { name: "Jayanagar", position: [12.925, 77.5838] }, { name: "HSR Layout", position: [12.9116, 77.6389] }
  ],
  Delhi: [
    { name: "Connaught Place", position: [28.6315, 77.2167] }, { name: "Aerocity", position: [28.5545, 77.087] },
    { name: "Hauz Khas", position: [28.5494, 77.2001] }, { name: "Saket", position: [28.5245, 77.2066] },
    { name: "Dwarka", position: [28.5921, 77.046] }, { name: "Gurugram", position: [28.4595, 77.0266] }
  ],
  Hyderabad: [
    { name: "Jubilee Hills", position: [17.4239, 78.407] }, { name: "HITEC City", position: [17.4435, 78.3772] },
    { name: "Banjara Hills", position: [17.4126, 78.4482] }, { name: "Gachibowli", position: [17.4401, 78.3489] },
    { name: "Madhapur", position: [17.4483, 78.3915] }, { name: "Secunderabad", position: [17.4399, 78.4983] }
  ]
};
const DEFAULT_CARS = [
  { id: "c1", name: "Porsche 911 Carrera", brand: "Porsche", type: "Sports", fuel: "Petrol", seats: 2, price: 4800, mileage: 10, rating: 4.98, image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=85", location: "Bandra West", city: "Mumbai", tag: "MOST LOVED", transmission: "Automatic", available: true, registration: "MH 02 AB 9110" },
  { id: "c2", name: "Mini Cooper S", brand: "Mini", type: "City", fuel: "Petrol", seats: 4, price: 1800, mileage: 16, rating: 4.92, image: "https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&w=1000&q=85", location: "Bandra West", city: "Mumbai", tag: "CITY FAVORITE", transmission: "Automatic", available: true, registration: "MH 02 CD 2024" },
  { id: "c3", name: "Mercedes-Benz GLC", brand: "Mercedes-Benz", type: "Luxury", fuel: "Diesel", seats: 5, price: 3600, mileage: 14, rating: 4.96, image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1000&q=85", location: "Andheri East", city: "Mumbai", tag: "EXTRA COMFORT", transmission: "Automatic", available: true, registration: "MH 02 EF 3030" },
  { id: "c4", name: "Jeep Wrangler", brand: "Jeep", type: "Adventure", fuel: "Diesel", seats: 5, price: 2900, mileage: 12, rating: 4.89, image: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=85", location: "Powai", city: "Mumbai", tag: "WEEKEND READY", transmission: "Automatic", available: true, registration: "MH 02 GH 4040" },
  { id: "c5", name: "Hyundai i20", brand: "Hyundai", type: "Budget", fuel: "Petrol", seats: 5, price: 900, mileage: 20, rating: 4.84, image: "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=1000&q=85", location: "Dadar", city: "Mumbai", tag: "GREAT VALUE", transmission: "Manual", available: true, registration: "MH 02 IJ 5050" },
  { id: "c6", name: "Tesla Model 3", brand: "Tesla", type: "Electric", fuel: "Electric", seats: 5, price: 2600, mileage: 7, rating: 4.95, image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=1000&q=85", location: "BKC", city: "Mumbai", tag: "ELECTRIC DRIVE", transmission: "Automatic", available: true, registration: "MH 02 KL 6060" }
];
const USER_PAGES = [
  ["User Dashboard", LayoutDashboard], ["Explore Cars", Search], ["Car Details", CarFront],
  ["Compare Cars", SlidersHorizontal], ["Smart Car Recommendation", Sparkles], ["Trip Planner", Navigation],
  ["Booking Details", CalendarDays], ["Price Summary", Wallet], ["Payment", CreditCard],
  ["Booking Confirmation", BadgeCheck], ["Live Vehicle Tracking", LocateFixed], ["My Bookings", FileCheck2],
  ["Vehicle Inspection", ShieldCheck], ["QR Pickup Verification", Activity], ["Rewards", Star],
  ["Saved Favourite Cars", Heart], ["CarGo Assistant", MessageCircle], ["User Profile", Users], ["Reviews and Feedback", Heart],
  ["Notifications", Bell]
];
const ADMIN_PAGES = [
  ["Admin Dashboard", LayoutDashboard], ["Fleet Management", CarFront], ["Booking Management", CalendarDays],
  ["Vehicle Monitoring", LocateFixed], ["Driver Management", Users], ["Maintenance", Wrench],
  ["Customer Management", Users], ["Revenue Analytics", Activity], ["Reviews and Security", ShieldCheck],
  ["QR Pickup Verification", FileCheck2], ["CarGo Assistant", MessageCircle]
];
const FEATURE_COPY = {
  "Explore Cars": "Search and filter the available fleet by price, type, seats and more.",
  "Car Details": "Review vehicle features, hourly pricing and booking options.",
  "Compare Cars": "Compare rates, seating, fuel and specifications side by side.",
  "Smart Car Recommendation": "Find a ride for your budget, group size and preferences.",
  "Trip Planner": "Explore city places, road directions, travel time and fuel estimates.",
  "Booking Details": "Choose a pickup, rental time and check live booking availability.",
  "Price Summary": "Review hourly charges and transparent demo pricing adjustments.",
  Payment: "Confirm a demo reservation without entering card or UPI details.",
  "Booking Confirmation": "Review the latest reservation and pickup QR.",
  "Live Vehicle Tracking": "Follow a clearly labelled simulated vehicle route.",
  "My Bookings": "Manage reservations, cancellations, invoices and pickup QR codes.",
  "Vehicle Inspection": "Record vehicle condition, odometer and fuel details.",
  "QR Pickup Verification": "View your pickup code or verify a booking as an admin.",
  Rewards: "Review loyalty points and available demo offers.",
  "Saved Favourite Cars": "Return to cars saved to your shortlist.",
  "CarGo Assistant": "Ask about bookings, cars, availability, tracking or operations.",
  "User Profile": "Update account details and ride preferences.",
  "Reviews and Feedback": "Share customer feedback or inspect security activity.",
  Notifications: "Review booking updates and account alerts.",
  "Fleet Management": "Add, update and remove vehicles in the rental fleet.",
  "Booking Management": "Approve, reject and monitor customer reservations.",
  "Vehicle Monitoring": "Review authorised vehicle status and simulated tracking.",
  "Driver Management": "Manage drivers and vehicle assignments.",
  Maintenance: "Schedule service and review predictive maintenance reminders.",
  "Customer Management": "Review customer accounts and booking activity.",
  "Revenue Analytics": "Explore booking value and revenue trends.",
  "Reviews and Security": "Review customer feedback, security events and failed logins."
};
const USER_HUB_ITEMS = USER_PAGES.slice(1).map(([label, icon]) => ({ label, icon, page: label, description: FEATURE_COPY[label] }));
USER_HUB_ITEMS.push(
  { label: "Instant Availability Checker", icon: CalendarDays, page: "Booking Details", description: FEATURE_COPY["Booking Details"] },
  { label: "Dynamic Pricing", icon: Wallet, page: "Price Summary", description: FEATURE_COPY["Price Summary"] },
  { label: "Digital Invoice", icon: Download, page: "My Bookings", description: FEATURE_COPY["My Bookings"] }
);
const ADMIN_HUB_ITEMS = ADMIN_PAGES.slice(1).map(([label, icon]) => ({ label, icon, page: label, description: FEATURE_COPY[label] }));

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const dateOnly = (value) => value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "—";
const dateTime = (value) => value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "—";
const tomorrow = (hours = 10) => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hours, 0, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const makeError = async (response) => {
  try { return (await response.json()).error || "Something went wrong."; }
  catch { return "Something went wrong. Please try again."; }
};

function App() {
  const [user, setUser] = useState(null);
  const [screen, setScreen] = useState("welcome");
  const [page, setPage] = useState("Explore Cars");
  const [cars, setCars] = useState(DEFAULT_CARS);
  const [bookings, setBookings] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [analytics, setAnalytics] = useState({ users: 0, cars: 0, bookings: 0, revenue: 0, monthlyRevenue: [] });
  const [security, setSecurity] = useState({ events: [], adminActions: [], failedLogins: [] });
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [rewards, setRewards] = useState({ points: 0, history: [] });
  const [profile, setProfile] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const [booking, setBooking] = useState(null);
  const [fromDate, setFromDate] = useState(tomorrow(10));
  const [toDate, setToDate] = useState(tomorrow(13));
  const [availability, setAvailability] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [city, setCity] = useState("Mumbai");
  const [pickup, setPickup] = useState("Bandra West");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState({ category: "All", seats: "Any", fuel: "Any", transmission: "Any", maxPrice: 10000 });
  const [favorites, setFavorites] = useState([]);
  const [loginCredential, setLoginCredential] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [qr, setQr] = useState("");
  const [tracking, setTracking] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState("");
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", preference: "Comfort" });

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API}${path}`, {
      credentials: "same-origin",
      ...options,
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers }
    });
    if (!response.ok) throw new Error(await makeError(response));
    if (response.status === 204) return null;
    return response.json();
  }, []);

  const refresh = useCallback(async (currentUser) => {
    const loadedCars = await request("/cars");
    setCars(loadedCars);
    if (!currentUser) return;
    setProfile(currentUser);
    setProfileForm({ name: currentUser.name || "", phone: currentUser.phone || "", preference: currentUser.preferences?.ride || "Comfort" });
    const loadedBookings = await request("/bookings");
    setBookings(loadedBookings);
    if (currentUser.role === "admin") {
      const [serviceItems, driverItems, customerItems, stats, securityItems] = await Promise.all([
        request("/maintenance"), request("/drivers"), request("/admin/customers"),
        request("/admin/analytics"), request("/admin/security")
      ]);
      setMaintenance(serviceItems);
      setDrivers(driverItems);
      setCustomers(customerItems);
      setAnalytics(stats);
      setSecurity(securityItems);
    } else {
      const [notificationItems, rewardsData] = await Promise.all([request("/notifications"), request("/rewards")]);
      setNotifications(notificationItems);
      setRewards(rewardsData);
      setFavorites(await request("/favorites"));
    }
    setReviews(await request("/reviews"));
  }, [request]);

  useEffect(() => {
    let active = true;
    request("/auth/me").then(async ({ user: currentUser }) => {
      if (!active) return;
      if (currentUser) {
        setUser(currentUser);
        setScreen("app");
        setPage(currentUser.role === "admin" ? "Admin Dashboard" : "User Dashboard");
        await refresh(currentUser);
      } else {
        const loadedCars = await request("/cars");
        if (active) setCars(loadedCars);
      }
    }).catch((failure) => {
      if (active) setError(failure.message);
    });
    return () => { active = false; };
  }, [request, refresh]);

  useEffect(() => {
    setError("");
    if (page !== "Price Summary" && page !== "Payment") setAvailability(null);
    setMenuOpen(false);
  }, [page]);

  useEffect(() => {
    if (!selectedCar) return;
    const best = CITIES[city] || CITIES.Mumbai;
    setPickup(best.includes(selectedCar.location) ? selectedCar.location : best[0]);
  }, [city, selectedCar]);

  const userPages = user?.role === "admin" ? ADMIN_PAGES : USER_PAGES;
  const visibleCars = useMemo(() => cars.filter((car) => {
    const matchesSearch = `${car.name} ${car.brand} ${car.type} ${car.location}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filter.category === "All" || car.type === filter.category;
    return matchesSearch && matchesCategory && car.price <= filter.maxPrice
      && (filter.seats === "Any" || car.seats >= Number(filter.seats))
      && (filter.fuel === "Any" || car.fuel === filter.fuel)
      && (filter.transmission === "Any" || car.transmission === filter.transmission);
  }), [cars, filter, search]);

  async function submitRegistration(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setBusy(true);
    setError("");
    try {
      await request("/auth/register", { method: "POST", body: JSON.stringify(values) });
      setNotice("Account created. Sign in with your new credentials.");
      setScreen("login");
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function submitLogin(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    setBusy(true);
    setError("");
    try {
      const result = await request("/auth/login", { method: "POST", body: JSON.stringify(values) });
      setUser(result.user);
      setLoginCredential({ id: values.email, password: values.password, name: result.user.name });
      await refresh(result.user);
      setScreen("save-password");
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  function enterDashboard(announcement = "") {
    setLoginCredential(null);
    setScreen("app");
    setPage(user?.role === "admin" ? "Admin Dashboard" : "User Dashboard");
    setNotice(announcement);
  }

  async function logout() {
    try {
      await request("/auth/logout", { method: "POST" });
      setUser(null);
      setProfile(null);
      setScreen("welcome");
      setPage("Explore Cars");
      setBookings([]);
      setNotice("You have safely signed out.");
    } catch (failure) { setError(failure.message); }
  }

  async function changeBookingStatus(item, status) {
    try {
      const updated = await request(`/bookings/${item.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setBookings((items) => items.map((entry) => entry.id === updated.id ? updated : entry));
      setNotice(`Booking ${updated.id}: ${updated.status}.`);
      if (user?.role === "admin") setSecurity(await request("/admin/security"));
    } catch (failure) { setError(failure.message); }
  }

  async function checkAvailability() {
    if (!selectedCar) return;
    setBusy(true);
    setError("");
    try {
      const result = await request("/bookings/check-availability", { method: "POST", body: JSON.stringify({ carId: selectedCar.id, startAt: new Date(fromDate).toISOString(), endAt: new Date(toDate).toISOString() }) });
      setAvailability(result);
      if (result.available) setNotice("Great news — this car is available for those dates.");
      else setError("This vehicle has an overlapping reservation for your selected time.");
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function createBooking() {
    if (!selectedCar || !availability?.available) {
      setError("Check availability before continuing.");
      setPage("Booking Details");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await request("/bookings", { method: "POST", body: JSON.stringify({
        carId: selectedCar.id, startAt: new Date(fromDate).toISOString(), endAt: new Date(toDate).toISOString(), city, pickup
      }) });
      setBooking(saved);
      setBookings((items) => [saved, ...items]);
      setPage("Booking Confirmation");
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function loadTracking(item) {
    setSelectedBookingId(item.id);
    try { setTracking(await request(`/tracking/${item.id}`)); setPage("Live Vehicle Tracking"); }
    catch (failure) { setError(failure.message); }
  }

  async function refreshTracking() {
    if (!selectedBookingId) return;
    try { setTracking(await request(`/tracking/${selectedBookingId}`)); }
    catch (failure) { setError(failure.message); }
  }

  async function openQr(item) {
    if (!item?.qrToken) {
      setError("Pickup QR is unavailable. Complete a booking first.");
      return;
    }
    setSelectedBookingId(item.id);
    try { setQr(await QRCode.toDataURL(JSON.stringify({ bookingId: item.id, token: item.qrToken }), { width: 220, margin: 1, color: { dark: "#20392b", light: "#ffffff" } })); setPage("QR Pickup Verification"); }
    catch { setError("Couldn't create the pickup QR code."); }
  }

  async function downloadInvoice(item) {
    try {
      const result = await request(`/bookings/${item.id}/invoice`);
      const invoice = result.booking;
      const content = `ROAM MOBILITY · TAX INVOICE PREVIEW\nInvoice: ${result.invoice}\nBooking: ${invoice.id}\nCustomer: ${invoice.customer}\nVehicle: ${invoice.car}\nPickup: ${invoice.pickup}, ${invoice.city}\nPeriod: ${dateTime(invoice.startAt)} - ${dateTime(invoice.endAt)}\nRental total: ${money(invoice.total)}\nPayment: ${invoice.paymentStatus}\n\nDEMO ONLY — no tax has been charged or payment processed.`;
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
      link.download = `${result.invoice}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (failure) { setError(failure.message); }
  }

  async function saveCar(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = Object.fromEntries(new FormData(formElement).entries());
    try {
      const car = await request("/cars", { method: "POST", body: JSON.stringify({ ...form, price: Number(form.price), seats: Number(form.seats), mileage: Number(form.mileage) }) });
      setCars((items) => [car, ...items]);
      setNotice("Vehicle added to your fleet.");
      formElement.reset();
    } catch (failure) { setError(failure.message); }
  }

  async function updateCar(car, changes) {
    try {
      const updated = await request(`/cars/${car.id}`, { method: "PATCH", body: JSON.stringify(changes) });
      setCars((items) => items.map((item) => item.id === updated.id ? updated : item));
      setNotice("Vehicle details updated.");
    } catch (failure) { setError(failure.message); }
  }

  async function removeCar(car) {
    try {
      await request(`/cars/${car.id}`, { method: "DELETE" });
      setCars((items) => items.filter((item) => item.id !== car.id));
      setNotice("Vehicle removed from the fleet.");
    } catch (failure) { setError(failure.message); }
  }

  async function addMaintenance(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const item = Object.fromEntries(new FormData(formElement).entries());
    try {
      const saved = await request("/maintenance", { method: "POST", body: JSON.stringify(item) });
      setMaintenance((items) => [saved, ...items]);
      setNotice("Service appointment scheduled.");
      formElement.reset();
    } catch (failure) { setError(failure.message); }
  }

  async function addDriver(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = Object.fromEntries(new FormData(formElement).entries());
    try {
      const driver = await request("/drivers", { method: "POST", body: JSON.stringify(data) });
      setDrivers((items) => [driver, ...items]);
      setNotice("Driver added. Identity verification is pending.");
      formElement.reset();
    } catch (failure) { setError(failure.message); }
  }

  async function updateDriver(driver, changes) {
    try {
      const updated = await request(`/drivers/${driver.id}`, { method: "PATCH", body: JSON.stringify(changes) });
      setDrivers((items) => items.map((item) => item.id === updated.id ? updated : item));
      setNotice(`${updated.name}'s driver record was updated.`);
    } catch (failure) { setError(failure.message); }
  }

  async function updateCustomer(customer, status) {
    try {
      const updated = await request(`/admin/customers/${customer.id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
      setCustomers((items) => items.map((item) => item.id === updated.id ? updated : item));
      setSecurity(await request("/admin/security"));
      setNotice(`${updated.name}'s account is ${updated.status}.`);
    } catch (failure) { setError(failure.message); }
  }

  async function sendReview(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const data = Object.fromEntries(new FormData(formElement).entries());
    try {
      const saved = await request("/reviews", { method: "POST", body: JSON.stringify(data) });
      setReviews((items) => [saved, ...items]);
      setNotice("Thank you — your feedback was submitted.");
      formElement.reset();
    } catch (failure) { setError(failure.message); }
  }

  async function saveProfile(event) {
    event.preventDefault();
    try {
      const updated = await request("/profile", { method: "PATCH", body: JSON.stringify({ name: profileForm.name, phone: profileForm.phone, preferences: { ride: profileForm.preference } }) });
      setProfile(updated);
      setUser(updated);
      setNotice("Profile updated.");
    } catch (failure) { setError(failure.message); }
  }

  async function saveInspection(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      await request("/inspections", { method: "POST", body: JSON.stringify({ ...data, fuel: Number(data.fuel), odometer: Number(data.odometer), photos: photoPreviews.map((photo) => photo.name) }) });
      setPhotoPreviews([]);
      setNotice("Inspection notes saved. Photo previews remain on this device only.");
    } catch (failure) { setError(failure.message); }
  }

  async function submitQrVerification(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const result = await request(`/bookings/${data.bookingId}/verify-qr`, { method: "POST", body: JSON.stringify({ token: data.token }) });
      setNotice(`Pickup verified for ${result.booking.customer} · ${result.booking.car}.`);
    } catch (failure) { setError(failure.message); }
  }

  async function sendAssistant(event) {
    event.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    const lower = text.toLowerCase();
    let answer = "I can help with availability, finding a car, trip estimates, bookings or tracking. What would you like to do?";
    if (lower.includes("cancel")) answer = "Open My Bookings and use Cancel on an eligible upcoming reservation. The cancellation is recorded by the demo API.";
    else if (lower.includes("track") || lower.includes("delivery")) answer = "Open My Bookings and choose Track on a booking. Tracking is simulated in this demo; no live GPS device is connected.";
    else if (lower.includes("budget") || lower.includes("cheap")) answer = `The ${cars.filter((car) => car.type === "Budget").sort((a, b) => a.price - b.price)[0]?.name || "budget cars"} starts at ${money(Math.min(...cars.map((car) => car.price)))}/hour. Open Smart Car Recommendation for a tailored match.`;
    else if (lower.includes("available")) answer = "Open a car's Booking Details, choose pickup and return times, and check availability before you continue.";
    else if (lower.includes("reward")) answer = `You currently have ${rewards.points} Roam points. See Rewards to check offers and your earning history.`;
    else if (user?.role === "admin" && lower.includes("maintenance")) answer = `${maintenance.length} service reminders are in the queue. Open Maintenance to schedule or review work.`;
    setChat((items) => [...items, { from: "user", text }, { from: "assistant", text: answer }]);
    setChatInput("");
  }

  async function saveNotificationRead(item) {
    try {
      const updated = await request(`/notifications/${item.id}/read`, { method: "PATCH" });
      setNotifications((items) => items.map((entry) => entry.id === updated.id ? updated : entry));
    } catch (failure) { setError(failure.message); }
  }

  if (screen === "welcome") return <WelcomeScreen onLogin={() => { setError(""); setScreen("login"); }} onRegister={() => { setError(""); setScreen("signup"); }} notice={notice} />;
  if (screen === "signup") return <AuthScreen mode="signup" onSubmit={submitRegistration} onSwitch={() => { setError(""); setScreen("login"); }} onBack={() => setScreen("welcome")} error={error} busy={busy} />;
  if (screen === "login") return <AuthScreen mode="login" onSubmit={submitLogin} onSwitch={() => { setError(""); setScreen("signup"); }} onBack={() => setScreen("welcome")} error={error} busy={busy} notice={notice} />;
  if (screen === "save-password") return <SavePasswordScreen name={user?.name} credential={loginCredential} onContinue={enterDashboard} />;
  if (!user) return <WelcomeScreen onLogin={() => setScreen("login")} onRegister={() => setScreen("signup")} notice="" />;

  const isAdmin = user.role === "admin";
  const currentPages = isAdmin ? ADMIN_PAGES : USER_PAGES;
  const navGroups = isAdmin
    ? [{ label: "OPERATIONS", items: ADMIN_PAGES.slice(0, 5) }, { label: "MANAGEMENT", items: ADMIN_PAGES.slice(5) }]
    : [{ label: "YOUR ROAM", items: USER_PAGES.slice(0, 6) }, { label: "YOUR BOOKINGS", items: USER_PAGES.slice(6, 14) }, { label: "ACCOUNT", items: USER_PAGES.slice(14) }];
  const switchPage = (nextPage) => { setError(""); setNotice(""); setPage(nextPage); };

  return <div className="app-shell">
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <a className="brand" href="#" onClick={(event) => { event.preventDefault(); switchPage(isAdmin ? "Admin Dashboard" : "User Dashboard"); }}><span className="brand-mark"><Navigation size={17} fill="currentColor" /></span><span>roam<span className="brand-dot">.</span></span></a>
      <div className="workspace-label">{isAdmin ? "FLEET WORKSPACE" : "MEMBER SPACE"}</div>
      <nav className="main-nav" aria-label="Main navigation">
        {navGroups.map((group) => <div className="nav-group" key={group.label}><span className="nav-group-label">{group.label}</span>{group.items.map(([label, Icon]) => <button key={label} className={`nav-link ${page === label ? "active" : ""}`} onClick={() => switchPage(label)}><Icon size={16} /><span>{label}</span>{label === "Notifications" && notifications.some((item) => !item.read) && <span className="nav-unread" />}</button>)}</div>)}
      </nav>
      <div className="sidebar-bottom"><button className="nav-link" onClick={() => switchPage("CarGo Assistant")}><CircleHelp size={17} /><span>Help & support</span></button><div className="profile-card"><div className="avatar">{user.name?.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div className="profile-info"><strong>{user.name}</strong><span>{isAdmin ? "Fleet administrator" : "Roam member"}</span></div><button className="icon-button profile-menu" onClick={logout} aria-label="Sign out"><LogOut size={15} /></button></div></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={19} /></button><div className="breadcrumb"><span>{isAdmin ? "Fleet workspace" : "Your Roam"}</span><ChevronRight size={13} /><strong>{page}</strong></div><div className="top-actions">{!isAdmin && <div className="city-switch"><MapPin size={14} /><select value={city} onChange={(event) => { setCity(event.target.value); setPickup(CITIES[event.target.value][0]); }} aria-label="Choose city">{Object.keys(CITIES).map((name) => <option key={name}>{name}</option>)}</select><ChevronDown size={12} /></div>}<button className="icon-button notification-button" aria-label="Notifications" onClick={() => switchPage(isAdmin ? "Reviews and Security" : "Notifications")}><Bell size={17} /><span /></button><div className="top-avatar">{user.name?.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div></div></header>
      <div className="page-content">
        {error && <div className="alert alert-error" role="alert"><X size={15} /><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={14} /></button></div>}
        {notice && <div className="alert alert-success" role="status"><Check size={15} /><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={14} /></button></div>}
        {busy && <div className="loading-line"><span />Working securely…</div>}
        {page === "User Dashboard" && !isAdmin && <UserDashboard user={user} cars={cars} bookings={bookings} rewards={rewards} go={switchPage} onTrack={loadTracking} />}
        {page === "Admin Dashboard" && isAdmin && <AdminDashboard analytics={analytics} bookings={bookings} maintenance={maintenance} cars={cars} go={switchPage} />}
        {page === "Explore Cars" && !isAdmin && <ExploreCars cars={visibleCars} allCars={cars} search={search} setSearch={setSearch} filter={filter} setFilter={setFilter} favorites={favorites} toggleFavorite={async (id) => { const next = favorites.includes(id) ? favorites.filter((item) => item !== id) : [...favorites, id]; try { setFavorites(await request("/favorites", { method: "PUT", body: JSON.stringify({ carIds: next }) })); } catch (failure) { setError(failure.message); } }} compareIds={compareIds} setCompareIds={setCompareIds} openCar={(car) => { setSelectedCar(car); switchPage("Car Details"); }} go={switchPage} />}
        {page === "Saved Favourite Cars" && !isAdmin && <SavedCars cars={cars.filter((car) => favorites.includes(car.id))} openCar={(car) => { setSelectedCar(car); switchPage("Car Details"); }} toggle={async (car) => { const next = favorites.filter((id) => id !== car.id); try { setFavorites(await request("/favorites", { method: "PUT", body: JSON.stringify({ carIds: next }) })); } catch (failure) { setError(failure.message); } }} />}
        {page === "Car Details" && <CarDetails car={selectedCar || cars[0]} onBook={() => switchPage("Booking Details")} compare={() => { setCompareIds((items) => items.includes((selectedCar || cars[0]).id) ? items : [...items, (selectedCar || cars[0]).id].slice(-3)); switchPage("Compare Cars"); }} />}
        {page === "Compare Cars" && <CompareCars cars={cars.filter((car) => compareIds.includes(car.id)).length ? cars.filter((car) => compareIds.includes(car.id)) : cars.slice(0, 3)} openCar={(car) => { setSelectedCar(car); switchPage("Car Details"); }} />}
        {page === "Smart Car Recommendation" && <Recommendation cars={cars} onSelect={(car) => { setSelectedCar(car); switchPage("Car Details"); }} />}
        {page === "Trip Planner" && <TripPlanner cars={cars} city={city} setCity={setCity} pickup={pickup} setPickup={setPickup} />}
        {page === "Booking Details" && <BookingDetails car={selectedCar || cars[0]} city={city} pickup={pickup} setPickup={setPickup} fromDate={fromDate} setFromDate={(value) => { setFromDate(value); setAvailability(null); }} toDate={toDate} setToDate={(value) => { setToDate(value); setAvailability(null); }} availability={availability} check={checkAvailability} proceed={() => { if (availability?.available) switchPage("Price Summary"); else setError("Check availability before continuing."); }} busy={busy} />}
        {page === "Price Summary" && <PriceSummary car={selectedCar || cars[0]} fromDate={fromDate} toDate={toDate} proceed={() => switchPage("Payment")} back={() => switchPage("Booking Details")} />}
        {page === "Payment" && <PaymentDemo car={selectedCar || cars[0]} fromDate={fromDate} toDate={toDate} proceed={createBooking} back={() => switchPage("Price Summary")} busy={busy} />}
        {page === "Booking Confirmation" && <Confirmation booking={booking || bookings[0]} go={switchPage} openQr={openQr} />}
        {page === "Live Vehicle Tracking" && <Tracking booking={bookings.find((item) => item.id === selectedBookingId)} tracking={tracking} refresh={refreshTracking} />}
        {page === "My Bookings" && <MyBookings bookings={bookings} admin={false} onCancel={(item) => changeBookingStatus(item, "Cancelled")} onTrack={loadTracking} onInvoice={downloadInvoice} onQr={openQr} />}
        {page === "Vehicle Inspection" && <Inspection bookings={bookings} previews={photoPreviews} setPreviews={setPhotoPreviews} onSubmit={saveInspection} />}
        {page === "QR Pickup Verification" && <QrPage bookings={bookings} qr={qr} selectedId={selectedBookingId} onSelect={setSelectedBookingId} onVerify={submitQrVerification} admin={isAdmin} />}
        {page === "Rewards" && <Rewards data={rewards} />}
        {page === "CarGo Assistant" && <Assistant chat={chat} input={chatInput} setInput={setChatInput} onSend={sendAssistant} />}
        {page === "User Profile" && <Profile user={profile || user} form={profileForm} setForm={setProfileForm} onSave={saveProfile} />}
        {page === "Reviews and Feedback" && !isAdmin && <Reviews cars={cars} reviews={reviews} onSubmit={sendReview} />}
        {page === "Reviews and Security" && isAdmin && <SecurityPage data={security} reviews={reviews} />}
        {page === "Notifications" && <Notifications items={notifications} markRead={saveNotificationRead} />}
        {page === "Fleet Management" && isAdmin && <FleetManagement cars={cars} onSave={saveCar} onUpdate={updateCar} onDelete={removeCar} />}
        {page === "Booking Management" && isAdmin && <MyBookings bookings={bookings} admin onStatus={changeBookingStatus} onTrack={loadTracking} onInvoice={downloadInvoice} onQr={openQr} />}
        {page === "Vehicle Monitoring" && isAdmin && <Monitoring bookings={bookings} cars={cars} onTrack={loadTracking} />}
        {page === "Driver Management" && isAdmin && <DriverManagement drivers={drivers} cars={cars} onSubmit={addDriver} onUpdate={updateDriver} />}
        {page === "Maintenance" && isAdmin && <MaintenancePage items={maintenance} cars={cars} onSubmit={addMaintenance} />}
        {page === "Customer Management" && isAdmin && <Customers items={customers} bookings={bookings} onStatus={updateCustomer} />}
        {page === "Revenue Analytics" && isAdmin && <RevenueAnalytics analytics={analytics} bookings={bookings} />}
      </div>
      <footer className="page-footer"><span>ROAM A LITTLE. FEEL A LOT.</span><span>INDIA · ₹ INR <i>✳</i></span></footer>
    </main>
    <button className="assistant-fab" onClick={() => switchPage("CarGo Assistant")} aria-label="Open CarGo Assistant"><MessageCircle size={20} /><span className="fab-sparkle"><Sparkles size={10} /></span></button>
  </div>;
}

function WelcomeScreen({ onLogin, onRegister, notice }) {
  return <div className="welcome-page"><header className="welcome-nav"><a className="brand" href="#"><span className="brand-mark"><Navigation size={17} fill="currentColor" /></span>roam<span className="brand-dot">.</span></a><div><button className="button-quiet" onClick={onLogin}>Sign in</button><button className="button-primary" onClick={onRegister}>Create account <ArrowRight size={15} /></button></div></header><main className="welcome-hero"><div className="welcome-copy"><span className="eyebrow"><span className="eyebrow-line" /> A LITTLE MORE EVERYWHERE</span><h1>Your city.<br /><em>Your kind</em><br />of drive.</h1><p>Premium cars for the plans you haven't made yet. Rent by the hour, and see where a good day takes you.</p><div className="welcome-actions"><button className="button-primary button-large" onClick={onRegister}>Find your next ride <ArrowRight size={16} /></button><button className="button-quiet" onClick={onLogin}>Already a member? Sign in</button></div><div className="welcome-proof"><div className="proof-avatars"><span>AS</span><span>MI</span><span>RK</span></div><div><strong>4.9/5</strong><small>From 2,400+ happy drives</small></div><span className="proof-divider" /><div><strong>12 cities</strong><small>And more on the map</small></div></div></div><div className="welcome-art"><img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=90" alt="Premium car ready for a city drive" /><div className="art-gradient" /><div className="art-tag"><span className="live-dot" /> YOUR CITY, YOUR WAY</div><div className="art-caption"><span>01 — 06</span><strong>Make a day<br />of it.</strong><span>GOOD RIDES. GOOD DAYS.</span></div><div className="floating-pickup"><MapPin size={15} /><span><small>PICKUP SPOTS NEAR</small><strong>Bandra West, Mumbai</strong></span><span className="pickup-online" /></div></div></main><footer className="welcome-footer"><span>MADE FOR THE WAY YOU GO <i>✳</i></span><span>PREMIUM RIDES · HOURLY PRICING · INDIA</span></footer>{notice && <div className="welcome-notice">{notice}</div>}</div>;
}

function AuthScreen({ mode, onSubmit, onSwitch, onBack, error, busy, notice }) {
  const signup = mode === "signup";
  return <div className="auth-page"><div className="auth-image"><div className="auth-logo"><span className="brand-mark"><Navigation size={17} fill="currentColor" /></span>roam<span>.</span></div><div className="auth-image-copy"><span className="eyebrow light-eyebrow"><span className="eyebrow-line" /> GOOD RIDES. GOOD DAYS.</span><h1>The road<br /><em>looks good</em><br />on you.</h1><p>More ways to get there. More reasons to stay out.</p></div><img src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1500&q=85" alt="Porsche on a winding road" /><span className="auth-image-foot">ROAM MOBILITY · EST. 2025</span></div><div className="auth-form-side"><div className="auth-form"><button className="back-link" onClick={onBack}><ArrowLeft size={14} /> Back</button><span className="eyebrow"><span className="eyebrow-line" /> {signup ? "A NEW CHAPTER" : "WELCOME BACK"}</span><h2>{signup ? "Make yourself at home." : "Let's get you moving."}</h2><p>{signup ? "Create your account. Your next drive is closer than you think." : "Good to see you again. Let's pick up where you left off."}</p>{notice && <div className="notice-inline"><Check size={14} />{notice}</div>}{error && <div className="auth-error" role="alert">{error}</div>}<form onSubmit={onSubmit} className="auth-fields" noValidate>{signup && <><label>YOUR NAME<input name="name" autoComplete="name" minLength="2" placeholder="Jamie Parker" required /></label><label>INDIAN MOBILE NUMBER<input name="phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" pattern="\\+91[\\s-]?[6-9][0-9]{9}" required /></label></>}<label>EMAIL ADDRESS<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label><label>PASSWORD<input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 10 : 1} placeholder={signup ? "At least 10 characters" : "Your password"} required /></label>{signup && <small className="auth-hint"><LockKeyhole size={12} /> Passwords are hashed on the server and never stored in your browser.</small>}<button className="button-primary auth-submit" disabled={busy}>{busy ? <><span className="button-spinner" /> Please wait…</> : signup ? "Create secure account" : "Sign in securely"} <ArrowRight size={15} /></button></form><div className="auth-toggle">{signup ? "Already have an account?" : "New to Roam?"}<button onClick={onSwitch}>{signup ? "Sign in" : "Create an account"}</button></div>{!signup && <div className="admin-note"><ShieldCheck size={15} /><span>Administrator accounts are provisioned by your organization. User registration never grants admin access.</span></div>}<div className="auth-privacy"><ShieldCheck size={13} /> Encrypted session · Your data stays yours.</div></div></div></div>;
}

function SavePasswordScreen({ name, credential, onContinue }) {
  async function saveNow() {
    if (!credential || !window.PasswordCredential || !navigator.credentials?.store) {
      onContinue("This browser cannot save passwords through Roam. Your password was not stored by Roam.");
      return;
    }
    try {
      await navigator.credentials.store(new window.PasswordCredential({ id: credential.id, password: credential.password, name: credential.name }));
      onContinue();
    } catch {
      onContinue("Your browser declined the save request. Your password was not stored by Roam.");
    }
  }
  return <div className="save-page"><div className="save-card"><div className="save-shield"><ShieldCheck size={24} /></div><span className="eyebrow"><span className="eyebrow-line" /> SIGNED IN SECURELY</span><h1>Welcome back,<br /><em>{name?.split(" ")[0] || "friend"}.</em></h1><p>Would you like your browser to remember this password for next time?</p><div className="save-note"><LockKeyhole size={16} /><span>Roam never saves your password. “Save Now” asks your browser's password manager to save it securely.</span></div><button className="button-primary save-primary" onClick={saveNow}>Save Now <ArrowRight size={15} /></button><button className="button-quiet save-secondary" onClick={onContinue}>Not Now</button><small>Either choice takes you to your secure dashboard.</small></div></div>;
}

function SavedCars({ cars, openCar, toggle }) {
  return <div className="feature-page"><PageHeader eyebrow="YOUR SHORTLIST" title="The ones you loved." subtitle="Your favourite rides, saved to your Roam account." />{cars.length ? <div className="car-grid">{cars.map((car) => <CarCard key={car.id} car={car} favorite onFavorite={() => toggle(car)} onClick={() => openCar(car)} showCompare={false} />)}</div> : <EmptyState icon={Heart} title="Your shortlist is a blank canvas." text="Tap the heart on a ride to keep it close." />}</div>;
}

function PageHeader({ eyebrow, title, subtitle, action }) {
  return <div className="page-title-row"><div><span className="eyebrow"><span className="eyebrow-line" /> {eyebrow}</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>;
}

function UserDashboard({ user, cars, bookings, rewards, go, onTrack }) {
  const next = bookings.find((item) => ["Confirmed", "Approved", "Active"].includes(item.status));
  return <div className="dashboard-page"><div className="dashboard-hero"><div><span className="eyebrow light-eyebrow"><span className="eyebrow-line" /> YOUR NEXT GOOD DAY</span><h1>Good morning,<br /><em>{user.name?.split(" ")[0]}.</em></h1><p>Where would you like the day to take you?</p><button className="button-light" onClick={() => go("Explore Cars")}>Find my next ride <ArrowRight size={15} /></button></div><div className="dash-hero-art"><img src={cars[0]?.image} alt={cars[0]?.name || "A car for your next trip"} /><div className="dash-hero-chip"><span className="live-dot" /> {cars.length} RIDE OPTIONS NEARBY</div></div><span className="dash-orbit orbit-a" /><span className="dash-orbit orbit-b" /></div><div className="quick-stats"><Stat label="YOUR TRIPS" value={bookings.length} icon={CalendarDays} tint="mint" /><Stat label="ROAM POINTS" value={rewards.points} icon={Star} tint="gold" /><Stat label="RIDES NEAR YOU" value={cars.length} icon={CarFront} tint="blue" /><Stat label="YOUR RATING" value="4.9" icon={BadgeCheck} tint="rose" /></div><div className="dashboard-grid"><section className="content-card next-trip-card"><div className="panel-title"><div><span className="eyebrow">UP NEXT</span><h2>{next ? "Your next set of keys." : "Your next adventure awaits."}</h2></div><button className="text-button" onClick={() => go("My Bookings")}>All bookings <ArrowRight size={14} /></button></div>{next ? <div className="next-trip"><img src={cars.find((car) => car.id === next.carId)?.image || cars[0]?.image} alt={next.car} /><div><span className="booking-label">{next.status.toUpperCase()} · {next.id}</span><h3>{next.car}</h3><span><MapPin size={13} /> {next.pickup}, {next.city}</span><span><CalendarDays size={13} /> {dateTime(next.startAt)}</span></div><button className="outline-button" onClick={() => onTrack(next)}>Track ride <ArrowUpRight size={14} /></button></div> : <EmptyState icon={Compass} title="Nothing booked just yet." text="A great drive is only a few clicks away." action="Explore cars" onClick={() => go("Explore Cars")} />}</section><section className="content-card concierge-card"><div className="concierge-icon"><Sparkles size={18} /></div><span className="eyebrow">CAR-GO, YOUR CO-PILOT</span><h2>Need a little<br /><em>inspiration?</em></h2><p>Tell us the plan. We'll find a ride that fits just right.</p><button className="text-button" onClick={() => go("Smart Car Recommendation")}>Find my match <ArrowRight size={14} /></button></section></div><div className="section-heading-row dashboard-section-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> HAND-PICKED FOR YOU</span><h2>Lovely rides, <span>nearby.</span></h2></div><button className="text-button" onClick={() => go("Explore Cars")}>Explore all <ArrowRight size={14} /></button></div><div className="compact-car-grid">{cars.slice(0, 3).map((car) => <CompactCar key={car.id} car={car} onClick={() => go("Explore Cars")} />)}</div><FeatureHub items={USER_HUB_ITEMS} title="Your Roam toolkit" subtitle="Every part of your rental journey, one tap away." go={go} /></div>;
}

function AdminDashboard({ analytics, bookings, maintenance, cars, go }) {
  return <div className="admin-page"><div className="admin-welcome"><div><span className="eyebrow light-eyebrow"><span className="eyebrow-line" /> FLEET COMMAND · {dateOnly(new Date())}</span><h1>Built for the<br /><em>road ahead.</em></h1><p>Your fleet, customers and bookings at a glance.</p></div><div className="admin-welcome-stamp"><span>ROAM</span><Navigation size={28} fill="currentColor" /><small>FLEET DESK · 01</small></div></div><div className="stats-grid"><Stat label="REGISTERED USERS" value={analytics.users} icon={Users} tint="mint" /><Stat label="FLEET VEHICLES" value={analytics.cars || cars.length} icon={CarFront} tint="blue" /><Stat label="TOTAL BOOKINGS" value={analytics.bookings} icon={CalendarDays} tint="gold" /><Stat label="BOOKED VALUE" value={money(analytics.revenue)} icon={Wallet} tint="rose" /></div><div className="admin-content-grid"><section className="content-card"><div className="panel-title"><div><span className="eyebrow">LATEST ACTIVITY</span><h2>Recent reservations</h2></div><button className="text-button" onClick={() => go("Booking Management")}>Review all <ArrowRight size={14} /></button></div>{bookings.length ? bookings.slice(0, 5).map((item) => <div className="activity-row" key={item.id}><div className="activity-icon"><CarFront size={16} /></div><div><strong>{item.customer} · {item.car}</strong><span>{dateTime(item.startAt)} · {item.id}</span></div><b>{money(item.total)}</b></div>) : <EmptyState icon={CalendarDays} title="No bookings so far." text="New reservations will show up here." />}</section><section className="content-card service-panel"><div className="panel-title"><div><span className="eyebrow">PREDICTIVE SERVICE</span><h2>Keep them road-ready.</h2></div><Wrench size={17} /></div>{maintenance.slice(0, 4).map((item) => <div className="service-row" key={item.id}><span className="service-dot" /><div><strong>{item.car}</strong><span>{item.task}</span></div><small>{dateOnly(item.date)}</small></div>)}<button className="text-button" onClick={() => go("Maintenance")}>Open maintenance <ArrowRight size={14} /></button></section></div><FeatureHub items={ADMIN_HUB_ITEMS} title="Operations workspace" subtitle="Fleet, customers, security and service tools are all available here." go={go} /></div>;
}

function FeatureHub({ items, title, subtitle, go }) {
  return <section className="feature-hub"><div className="section-heading-row dashboard-section-heading"><div><span className="eyebrow"><span className="eyebrow-line" /> ALL YOUR TOOLS</span><h2>{title}</h2><p>{subtitle}</p></div></div><div className="feature-hub-grid">{items.map(({ label, icon: Icon, page, description }) => <button className="feature-hub-card" key={label} onClick={() => go(page)}><span className="feature-hub-icon"><Icon size={17} /></span><span className="feature-hub-copy"><strong>{label}</strong><small>{description}</small></span><ArrowUpRight size={14} className="feature-hub-arrow" /></button>)}</div></section>;
}

function Stat({ label, value, icon: Icon, tint }) {
  return <div className="stat-card"><div className={`stat-icon ${tint}`}><Icon size={17} /></div><span className="stat-label">{label}</span><strong>{value}</strong><span className="stat-delta"><span className="stat-delta-dot" /> Live overview</span><span className="stat-card-arrow"><ArrowUpRight size={14} /></span></div>;
}

function CompactCar({ car, onClick }) {
  return <button className="compact-car" onClick={onClick}><img src={car.image} alt={car.name} /><span><small>{car.type.toUpperCase()} · {car.seats} SEATS</small><strong>{car.name}</strong><span><b>{money(car.price)}</b> / hour <i><Star size={11} fill="currentColor" /> {car.rating}</i></span></span></button>;
}

function ExploreCars({ cars, allCars, search, setSearch, filter, setFilter, favorites, toggleFavorite, compareIds, setCompareIds, openCar, go }) {
  const types = ["All", ...new Set(allCars.map((car) => car.type))];
  return <div className="explore-page">
    <section className="explore-banner"><div><span className="eyebrow light-eyebrow"><span className="eyebrow-line" /> THE KEYS TO YOUR CITY</span><h1>Find your kind<br /><em>of drive.</em></h1><p>Premium rides. By the hour. Ready when you are.</p></div><span className="banner-number">01<span>—</span>06</span><span className="banner-wheel">✳</span></section>
    <div className="section-heading-row explore-head"><div><span className="eyebrow"><span className="eyebrow-line" /> {cars.length} RIDES READY TO ROAM</span><h2>Pick your <span>perfect match.</span></h2><p>Thoughtful rides for wherever the day goes.</p></div><button className="text-button" onClick={() => go("Compare Cars")}>Compare selected ({compareIds.length}) <ArrowRight size={14} /></button></div>
    <div className="filter-toolbar"><label className="search-box"><Search size={16} /><input placeholder="Search brand, model or category…" value={search} onChange={(event) => setSearch(event.target.value)} /><kbd>⌘ K</kbd></label><label className="filter-select"><span>CLASS</span><select value={filter.category} onChange={(event) => setFilter({ ...filter, category: event.target.value })}>{types.map((item) => <option key={item}>{item}</option>)}</select></label><label className="filter-select"><span>SEATS</span><select value={filter.seats} onChange={(event) => setFilter({ ...filter, seats: event.target.value })}><option>Any</option><option value="2">2+</option><option value="4">4+</option><option value="5">5+</option></select></label><label className="filter-select"><span>FUEL</span><select value={filter.fuel} onChange={(event) => setFilter({ ...filter, fuel: event.target.value })}>{["Any", "Petrol", "Diesel", "Electric", "Hybrid"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="filter-select"><span>TRANSMISSION</span><select value={filter.transmission} onChange={(event) => setFilter({ ...filter, transmission: event.target.value })}>{["Any", "Automatic", "Manual"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="filter-price"><span>UP TO {money(filter.maxPrice)}/HR</span><input type="range" min="900" max="8000" step="100" value={filter.maxPrice} onChange={(event) => setFilter({ ...filter, maxPrice: Number(event.target.value) })} /></label></div>
    {cars.length ? <div className="car-grid">{cars.map((car) => <CarCard key={car.id} car={car} favorite={favorites.includes(car.id)} onFavorite={() => toggleFavorite(car.id)} compare={compareIds.includes(car.id)} onCompare={() => setCompareIds((items) => items.includes(car.id) ? items.filter((id) => id !== car.id) : [...items, car.id].slice(-3))} onClick={() => openCar(car)} />)}</div> : <EmptyState icon={Search} title="No rides match those filters." text="Try widening the price range or changing your search." action="Clear filters" onClick={() => { setSearch(""); setFilter({ category: "All", seats: "Any", fuel: "Any", transmission: "Any", maxPrice: 10000 }); }} />}
  </div>;
}

function CarCard({ car, favorite, onFavorite, compare, onCompare, onClick, showCompare = true }) {
  return <article className="car-card"><div className="car-image-wrap"><img src={car.image} alt={car.name} loading="lazy" /><span className="car-tag"><span />{car.tag || "READY TO ROAM"}</span><button className={`favorite-button ${favorite ? "is-favorite" : ""}`} onClick={onFavorite} aria-label={favorite ? "Remove favourite" : "Save favourite"}><Heart size={16} fill={favorite ? "currentColor" : "none"} /></button>{showCompare && <button className={`compare-toggle ${compare ? "selected" : ""}`} onClick={onCompare}>{compare ? <Check size={12} /> : <Plus size={12} />} Compare</button>}</div><div className="car-details"><div className="car-name-row"><div><span className="car-type">{car.brand || car.type} · {car.type}</span><h3>{car.name}</h3></div><span className="rating"><Star size={13} fill="currentColor" /> {car.rating}</span></div><div className="car-specs"><span><Users size={13} /> {car.seats} seats</span><span><Zap size={13} /> {car.fuel}</span><span><Gauge size={13} /> {car.mileage} km/l</span></div><div className="car-card-bottom"><div className="car-price"><strong>{money(car.price)}</strong><span>/ hour</span></div><button onClick={onClick}>View details <ArrowRight size={14} /></button></div></div></article>;
}

function CarDetails({ car, onBook, compare }) {
  return <div className="feature-page"><PageHeader eyebrow={`${car.type} · ${car.transmission || "Automatic"}`} title="A closer look." subtitle="The details make the drive." action={<button className="button-primary" onClick={onBook}>Book this ride <ArrowRight size={15} /></button>} /><div className="details-layout"><div className="details-photo"><img src={car.image} alt={car.name} /><span className="car-tag"><span />{car.tag}</span></div><section className="content-card details-specs"><div className="details-title"><div><span className="eyebrow">{car.brand || car.type} · {car.type.toUpperCase()}</span><h2>{car.name}</h2></div><span className="rating"><Star size={14} fill="currentColor" /> {car.rating}</span></div><p className="muted-copy">A beautifully maintained {car.type.toLowerCase()} ready for the city, the coast or whatever comes next.</p><div className="spec-grid"><Spec icon={Users} label="PASSENGERS" value={`${car.seats} seats`} /><Spec icon={Gauge} label="MILEAGE" value={`${car.mileage} km/l`} /><Spec icon={Zap} label="FUEL" value={car.fuel} /><Spec icon={Settings2} label="TRANSMISSION" value={car.transmission} /><Spec icon={MapPin} label="PICKUP" value={`${car.location}, ${car.city}`} /><Spec icon={ShieldCheck} label="COVER" value="Roadside assistance" /></div><div className="details-price"><span>From <strong>{money(car.price)}</strong> / hour</span><button className="outline-button" onClick={compare}>Add to compare <SlidersHorizontal size={14} /></button></div></section></div></div>;
}

function Spec({ icon: Icon, label, value }) { return <div className="spec-item"><Icon size={15} /><span>{label}</span><strong>{value}</strong></div>; }

function CompareCars({ cars, openCar }) {
  return <div className="feature-page"><PageHeader eyebrow="SMART PRICE COMPARISON" title="The finer details." subtitle="Compare prices, space and specs side-by-side." /><div className="compare-grid">{cars.map((car) => <article className="compare-card" key={car.id}><img src={car.image} alt={car.name} /><span className="eyebrow">{car.type}</span><h2>{car.name}</h2><strong className="compare-price">{money(car.price)}<small> / hour</small></strong><div className="compare-row"><span>Passengers</span><b>{car.seats} seats</b></div><div className="compare-row"><span>Fuel</span><b>{car.fuel}</b></div><div className="compare-row"><span>Transmission</span><b>{car.transmission}</b></div><div className="compare-row"><span>Mileage</span><b>{car.mileage} km/l</b></div><div className="compare-row"><span>Customer rating</span><b><Star size={12} fill="currentColor" /> {car.rating}</b></div><button className="button-primary compare-cta" onClick={() => openCar(car)}>View this car <ArrowRight size={14} /></button></article>)}</div></div>;
}

function Recommendation({ cars, onSelect }) {
  const [budget, setBudget] = useState("6000");
  const [passengers, setPassengers] = useState("4");
  const [distance, setDistance] = useState("80");
  const [preference, setPreference] = useState("Comfort");
  const suggestions = [...cars].filter((car) => car.seats >= Number(passengers)).sort((a, b) => {
    const priceDelta = Math.abs(a.price * 4 - Number(budget)) - Math.abs(b.price * 4 - Number(budget));
    const preferenceMatch = (car) => preference === "Adventure" ? car.type === "Adventure" : preference === "Luxury" ? car.type === "Luxury" : preference === "Efficiency" ? car.mileage >= 15 : 0;
    return Number(preferenceMatch(b)) - Number(preferenceMatch(a)) || priceDelta;
  });
  return <div className="feature-page"><PageHeader eyebrow="SMART CAR RECOMMENDATION" title="A ride that gets you." subtitle="A few details, and we'll find your kind of drive." /><div className="recommend-layout"><form className="content-card recommendation-form"><label>YOUR TOTAL BUDGET<input type="number" min="0" value={budget} onChange={(event) => setBudget(event.target.value)} /></label><label>HOW MANY PASSENGERS<select value={passengers} onChange={(event) => setPassengers(event.target.value)}><option value="1">1 or more</option><option value="2">2 or more</option><option value="4">4 or more</option><option value="5">5 or more</option></select></label><label>ESTIMATED DISTANCE<input type="number" min="1" value={distance} onChange={(event) => setDistance(event.target.value)} /><small>Distance estimate in kilometres.</small></label><label>WHAT MATTERS MOST?<select value={preference} onChange={(event) => setPreference(event.target.value)}><option>Comfort</option><option>Adventure</option><option>Luxury</option><option>Efficiency</option></select></label><div className="recommend-insight"><Sparkles size={16} /> We balance your budget, party size, trip distance and preference. Estimated trip cost includes hourly hire and fuel.</div></form><div className="recommend-results"><span className="eyebrow"><span className="eyebrow-line" /> YOUR BEST MATCHES</span>{suggestions.length ? suggestions.slice(0, 3).map((car, index) => <div className="recommend-car" key={car.id}><span className="match-rank">0{index + 1}</span><img src={car.image} alt={car.name} /><div><small>{index === 0 ? "BEST FIT" : "ALSO A GOOD FIT"} · {car.seats} SEATS · {car.mileage} KM/L</small><strong>{car.name}</strong><span>{money(car.price)}/hour · est. {money(car.price * 4 + Math.ceil(Number(distance) / car.mileage) * 105)} total*</span></div><button className="icon-button" onClick={() => onSelect(car)} aria-label={`View ${car.name}`}><ArrowRight size={16} /></button></div>) : <EmptyState icon={CarFront} title="No fit just yet." text="Try reducing your passenger count." />}<small className="estimate-disclaimer">*Fuel estimate uses an illustrative ₹105/litre. Actual consumption and pump rates vary.</small></div></div></div>;
}

const vehicleMarkerIcon = divIcon({
  className: "roam-car-marker-shell",
  html: '<span class="roam-car-marker"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11.5 6.8 6.8A2 2 0 0 1 8.7 5.5h6.6a2 2 0 0 1 1.9 1.3l1.8 4.7 1.5 1.2v5.1h-2.2v-1.6H5.7v1.6H3.5v-5.1L5 11.5Zm2.1-.3h9.8L15.5 8a.4.4 0 0 0-.4-.3H8.9a.4.4 0 0 0-.4.3l-1.4 3.2ZM7 14.8a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Zm10 0a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2Z"/></svg></span>',
  iconSize: [38, 38],
  iconAnchor: [19, 19]
});

function MapRouteViewport({ route }) {
  const map = useMap();
  useEffect(() => {
    if (route.length > 1) map.fitBounds(route, { padding: [48, 48], maxZoom: 13 });
  }, [map, route]);
  return null;
}

function routePosition(route, progress) {
  if (!route.length) return [0, 0];
  if (route.length === 1) return route[0];
  const segments = [];
  let total = 0;
  for (let index = 1; index < route.length; index += 1) {
    const previous = route[index - 1];
    const next = route[index];
    const length = Math.hypot(next[0] - previous[0], next[1] - previous[1]);
    segments.push({ previous, next, length });
    total += length;
  }
  let remaining = total * progress;
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const ratio = segment.length ? remaining / segment.length : 0;
      return [
        segment.previous[0] + (segment.next[0] - segment.previous[0]) * ratio,
        segment.previous[1] + (segment.next[1] - segment.previous[1]) * ratio
      ];
    }
    remaining -= segment.length;
  }
  return route[route.length - 1];
}

function straightLineKm(start, end) {
  const radians = (value) => value * Math.PI / 180;
  const [lat1, lon1] = start.map(radians);
  const [lat2, lon2] = end.map(radians);
  const latitudeDiff = lat2 - lat1;
  const longitudeDiff = lon2 - lon1;
  const value = Math.sin(latitudeDiff / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(longitudeDiff / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function TripPlanner({ cars, city, setCity, pickup, setPickup }) {
  const spots = CITY_SPOTS[city] || CITY_SPOTS.Mumbai;
  const [destination, setDestination] = useState(spots.find((spot) => spot.name !== pickup)?.name || spots[0].name);
  const [selected, setSelected] = useState(cars[0]?.id || "");
  const [route, setRoute] = useState([]);
  const [routeStats, setRouteStats] = useState({ distanceKm: 0, durationMinutes: 0 });
  const [routeMessage, setRouteMessage] = useState("");
  const [routeLoading, setRouteLoading] = useState(true);
  const [progress, setProgress] = useState(0.02);
  const [isMoving, setIsMoving] = useState(true);
  const car = cars.find((item) => item.id === selected) || cars[0];
  const start = spots.find((spot) => spot.name === pickup) || spots[0];
  const end = spots.find((spot) => spot.name === destination && spot.name !== start.name) || spots.find((spot) => spot.name !== start.name) || spots[0];
  const liters = car && car.fuel !== "Electric" ? routeStats.distanceKm / car.mileage : 0;
  const routeKey = `${city}-${start.name}-${end.name}`;

  useEffect(() => {
    const firstSpot = (CITY_SPOTS[city] || CITY_SPOTS.Mumbai)[0];
    if (!CITIES[city]?.includes(pickup)) setPickup(firstSpot.name);
    if (destination === pickup || !CITIES[city]?.includes(destination)) {
      setDestination((CITY_SPOTS[city] || CITY_SPOTS.Mumbai).find((spot) => spot.name !== (CITIES[city]?.includes(pickup) ? pickup : firstSpot.name))?.name || firstSpot.name);
    }
  }, [city, pickup]);

  useEffect(() => {
    const controller = new AbortController();
    const origin = start.position;
    const target = end.position;
    const fallbackKm = straightLineKm(origin, target);
    setRoute([origin, target]);
    setRouteStats({ distanceKm: fallbackKm, durationMinutes: fallbackKm / 35 * 60 });
    setRouteLoading(true);
    setRouteMessage("");
    setProgress(0.02);
    setIsMoving(true);
    const coordinates = `${origin[1]},${origin[0]};${target[1]},${target[0]}`;

    fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Directions service responded with ${response.status}.`);
        return response.json();
      })
      .then((result) => {
        const roadRoute = result.routes?.[0];
        if (!roadRoute?.geometry?.coordinates?.length) throw new Error("No road route was returned for these places.");
        setRoute(roadRoute.geometry.coordinates.map(([longitude, latitude]) => [latitude, longitude]));
        setRouteStats({ distanceKm: roadRoute.distance / 1000, durationMinutes: roadRoute.duration / 60 });
      })
      .catch((failure) => {
        if (failure.name !== "AbortError") setRouteMessage("Road directions are unavailable right now. Showing a straight-line estimate instead.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setRouteLoading(false);
      });

    return () => controller.abort();
  }, [routeKey]);

  useEffect(() => {
    if (!isMoving) return undefined;
    const timer = window.setInterval(() => {
      setProgress((value) => value >= 0.99 ? 0 : value + 0.01);
    }, 350);
    return () => window.clearInterval(timer);
  }, [isMoving, routeKey]);

  const movingPosition = useMemo(() => routePosition(route, progress), [route, progress]);

  return <div className="feature-page"><PageHeader eyebrow="SMART TRIP PLANNER" title="Map the good stuff." subtitle="Choose a city and local stops, then follow a road route on the live map." /><div className="trip-planner-layout"><section className="trip-map-panel"><div className="trip-map-topline"><span><span className="map-live-dot" /> OPENSTREETMAP · {city.toUpperCase()}</span><span className="simulated-map-label">SIMULATED DRIVE</span></div><MapContainer key={city} center={start.position} zoom={12} scrollWheelZoom className="trip-map"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapRouteViewport route={route} /><Polyline positions={route} pathOptions={{ color: "#547d48", weight: 6, opacity: 0.86 }} />{spots.map((spot) => <CircleMarker key={spot.name} center={spot.position} radius={spot.name === start.name || spot.name === end.name ? 8 : 5} pathOptions={{ color: spot.name === start.name ? "#31634b" : spot.name === end.name ? "#d27a5c" : "#718a70", fillColor: spot.name === start.name ? "#bde2a1" : spot.name === end.name ? "#f1b18e" : "#fff", fillOpacity: 1, weight: 2 }} eventHandlers={{ click: () => { if (spot.name !== start.name) setDestination(spot.name); } }}><Tooltip>{spot.name}{spot.name === start.name ? " · Pickup" : spot.name === end.name ? " · Destination" : " · Click to set destination"}</Tooltip><Popup>{spot.name}{spot.name === start.name ? " · Pickup" : spot.name === end.name ? " · Destination" : ""}</Popup></CircleMarker>)}<Marker position={movingPosition} icon={vehicleMarkerIcon}><Popup>Demo vehicle · simulated movement, not live GPS</Popup></Marker></MapContainer><div className="map-simulation-caption"><span><span className="tracking-pulse" />{isMoving ? "Vehicle is moving" : "Vehicle paused"} · demo only</span><span>{Math.round(progress * 100)}% of route</span></div><div className="map-controls"><button className="outline-button" onClick={() => setIsMoving((moving) => !moving)}>{isMoving ? "Pause vehicle" : "Move vehicle"} <Navigation size={13} /></button><button className="text-button" onClick={() => { setProgress(0.02); setIsMoving(true); }}>Restart simulation</button></div><div className="trip-place-list"><span>PLACES IN {city.toUpperCase()} · CLICK TO SET DESTINATION</span>{spots.filter((spot) => spot.name !== start.name).map((spot) => <button key={spot.name} className={spot.name === end.name ? "active" : ""} onClick={() => setDestination(spot.name)}>{spot.name}</button>)}</div></section><section className="content-card trip-controls"><span className="eyebrow">PLAN YOUR ROUTE</span><label>CITY<select value={city} onChange={(event) => { const nextCity = event.target.value; setCity(nextCity); setPickup(CITY_SPOTS[nextCity][0].name); setDestination(CITY_SPOTS[nextCity][1].name); }}>{Object.keys(CITY_SPOTS).map((name) => <option key={name}>{name}</option>)}</select></label><label>PICKUP AREA<select value={start.name} onChange={(event) => setPickup(event.target.value)}>{spots.map((spot) => <option key={spot.name}>{spot.name}</option>)}</select></label><label>DESTINATION AREA<select value={end.name} onChange={(event) => setDestination(event.target.value)}>{spots.filter((spot) => spot.name !== start.name).map((spot) => <option key={spot.name}>{spot.name}</option>)}</select></label><label>YOUR RIDE<select value={selected} onChange={(event) => setSelected(event.target.value)}>{cars.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="trip-estimates"><div><Clock3 size={15} /><span>Typical drive<strong>{routeStats.durationMinutes ? `${Math.max(1, Math.round(routeStats.durationMinutes))} min` : "—"}</strong></span></div><div><Gauge size={15} /><span>Route distance<strong>{routeStats.distanceKm ? `${routeStats.distanceKm.toFixed(1)} km` : "—"}</strong></span></div><div><Zap size={15} /><span>Fuel estimate<strong>{car?.fuel === "Electric" ? "Electric · varies" : `${liters.toFixed(1)} L · ${money(Math.round(liters * 105))}`}</strong></span></div></div>{routeLoading && <div className="route-message" role="status">Loading road directions…</div>}{routeMessage && <div className="route-message route-fallback" role="status">{routeMessage}</div>}<small className="muted-copy">Map tiles © OpenStreetMap contributors. Road route from OSRM; moving vehicle is simulated. Route time excludes live traffic. Fuel assumes ₹105/litre.</small></section></div></div>;
}

function BookingDetails({ car, city, pickup, setPickup, fromDate, setFromDate, toDate, setToDate, availability, check, proceed, busy }) {
  return <div className="feature-page"><PageHeader eyebrow="BOOKING DETAILS" title="Make a little plan." subtitle="Pick your ride, pickup spot and dates. We'll check availability before confirming." /><div className="booking-details-layout"><section className="content-card booking-fields"><div className="selected-car-line"><img src={car.image} alt={car.name} /><div><span className="eyebrow">{car.type} · {car.seats} seats · {car.fuel}</span><h3>{car.name}</h3><strong>{money(car.price)} <small>/ hour</small></strong></div></div><label>PICKUP AREA<select value={pickup} onChange={(event) => setPickup(event.target.value)}>{(CITIES[city] || CITIES.Mumbai).map((spot) => <option key={spot}>{spot}</option>)}</select></label><div className="form-two-col"><label>PICKUP · DD/MM/YYYY<input type="datetime-local" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label><label>RETURN · DD/MM/YYYY<input type="datetime-local" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label></div><button className="outline-button availability-button" disabled={busy} onClick={check}><CalendarDays size={15} /> Check instant availability</button>{availability && <div className={`availability-result ${availability.available ? "available" : "unavailable"}`}><span>{availability.available ? <Check size={16} /> : <X size={16} />}</span><div><strong>{availability.available ? "It's available." : "This ride is booked then."}</strong><small>{availability.available ? `${dateTime(fromDate)} — ${dateTime(toDate)}` : "Choose another time or a different car."}</small></div></div>}</section><aside className="booking-side-card"><span className="eyebrow">A QUICK HEADS-UP</span><div><ShieldCheck size={16} /><span>All rides include roadside assistance.</span></div><div><Clock3 size={16} /><span>Free cancellation up to 2 hours before pickup.</span></div><div><Wallet size={16} /><span>Demo checkout only — no payment is taken.</span></div><button className="button-primary" disabled={!availability?.available || busy} onClick={proceed}>See price summary <ArrowRight size={15} /></button></aside></div></div>;
}

function quote(car, start, end) {
  const hours = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 3600000));
  const base = car.price * hours;
  const longRentalDiscount = hours >= 24 ? Math.round(base * .1) : 0;
  const weekendSurcharge = [0, 6].includes(new Date(start).getDay()) ? Math.round(base * .05) : 0;
  return { hours, base, longRentalDiscount, weekendSurcharge, total: base - longRentalDiscount + weekendSurcharge };
}

function PriceSummary({ car, fromDate, toDate, proceed, back }) {
  const cost = quote(car, fromDate, toDate);
  return <div className="feature-page"><PageHeader eyebrow="PRICE SUMMARY" title="No surprises." subtitle="A clear breakdown, before you confirm." /><div className="price-summary-card"><div className="selected-car-line"><img src={car.image} alt={car.name} /><div><span className="eyebrow">YOUR RIDE</span><h3>{car.name}</h3><span>{dateTime(fromDate)} — {dateTime(toDate)}</span></div></div><div className="price-line"><span>Hourly rental · {cost.hours} hours × {money(car.price)}</span><strong>{money(cost.base)}</strong></div>{cost.longRentalDiscount > 0 && <div className="price-line discount-line"><span>Long-rental offer (10%)</span><strong>− {money(cost.longRentalDiscount)}</strong></div>}{cost.weekendSurcharge > 0 && <div className="price-line"><span>Weekend demand adjustment (5%)</span><strong>{money(cost.weekendSurcharge)}</strong></div>}<div className="price-line"><span>Roadside assistance</span><strong className="included-price">Included</strong></div><div className="price-total"><span>Total estimate</span><strong>{money(cost.total)}</strong></div><small className="muted-copy">Demo pricing rules: 10% off rentals of 24+ hours; 5% weekend demand adjustment. Final price is reserved server-side.</small><div className="summary-actions"><button className="outline-button" onClick={back}><ArrowLeft size={14} /> Change dates</button><button className="button-primary" onClick={proceed}>Continue to demo payment <ArrowRight size={15} /></button></div></div></div>;
}

function PaymentDemo({ car, fromDate, toDate, proceed, back, busy }) {
  const total = quote(car, fromDate, toDate).total;
  return <div className="feature-page"><PageHeader eyebrow="PAYMENT · DEMO ONLY" title="One last look." subtitle="This project is not connected to a payment provider. No card details are collected and no payment will be taken." /><div className="payment-layout"><section className="content-card payment-choice"><div className="payment-demo-icon"><ShieldCheck size={22} /></div><span className="eyebrow">SAFE DEMONSTRATION CHECKOUT</span><h2>No real payment is processed.</h2><p>Confirming creates a reservation with payment status marked “Not processed (demo)”. For production payments, integrate a verified provider and never handle raw card credentials here.</p><div className="demo-payment-banner"><LockKeyhole size={16} /> No card or UPI details are requested on this screen.</div><button className="button-primary" disabled={busy} onClick={proceed}>{busy ? "Creating reservation…" : "Confirm demo booking — no payment"} <ArrowRight size={15} /></button><button className="text-button" onClick={back}><ArrowLeft size={14} /> Back to price breakdown</button></section><aside className="payment-total"><span className="eyebrow">YOUR ESTIMATED TOTAL</span><strong>{money(total)}</strong><span>{car.name} · {quote(car, fromDate, toDate).hours} hours</span><span className="status-pill status-demo">PAYMENT NOT PROCESSED</span></aside></div></div>;
}

function Confirmation({ booking, go, openQr }) {
  if (!booking) return <EmptyState icon={CalendarDays} title="No confirmed ride found." text="Start by choosing a car." action="Explore cars" onClick={() => go("Explore Cars")} />;
  return <div className="confirmation-page"><div className="confirmation-icon"><Check size={29} /></div><span className="eyebrow">RESERVATION SAVED · {booking.id}</span><h1>It's happening.</h1><p>Your ride reservation is confirmed. Payment has <strong>not</strong> been processed in this demo.</p><div className="confirmation-receipt"><div className="selected-car-line"><img src={DEFAULT_CARS.find((item) => item.id === booking.carId)?.image || DEFAULT_CARS[0].image} alt={booking.car} /><div><span className="eyebrow">YOUR RIDE</span><h3>{booking.car}</h3></div><strong>{money(booking.total)}</strong></div><div className="price-line"><span>Pickup · {booking.pickup}, {booking.city}</span><span>{dateTime(booking.startAt)}</span></div><div className="price-line"><span>Return</span><span>{dateTime(booking.endAt)}</span></div><div className="demo-payment-banner"><ShieldCheck size={15} /> Status: {booking.paymentStatus || "Not processed (demo)"}</div></div><div className="confirmation-actions"><button className="button-primary" onClick={() => go("My Bookings")}>View my bookings <ArrowRight size={14} /></button><button className="outline-button" onClick={() => openQr(booking)}>Open pickup QR <Activity size={14} /></button></div></div>;
}

function MyBookings({ bookings, admin, onCancel, onStatus, onTrack, onInvoice, onQr }) {
  const [filter, setFilter] = useState("All");
  const options = admin ? ["All", "Confirmed", "Approved", "Rejected", "Cancelled", "Active", "Completed"] : ["All", "Upcoming", "Active", "Completed", "Cancelled"];
  const shown = bookings.filter((item) => {
    if (filter === "All") return true;
    if (["Upcoming", "Active", "Completed", "Cancelled"].includes(filter)) return filter === "Upcoming" ? ["Confirmed", "Approved"].includes(item.status) : item.status === filter;
    return item.status === filter;
  });
  return <div className="feature-page"><PageHeader eyebrow={admin ? "RESERVATION CONTROL" : "EVERY GOOD DAY OUT"} title={admin ? "Booking management." : "My bookings."} subtitle={admin ? "Review, approve, reject or monitor reservations." : "Upcoming, active and completed drives — all together."} /><div className="booking-filter-tabs">{options.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>{shown.length ? <div className="booking-list">{shown.map((item) => <BookingRow key={item.id} booking={item} admin={admin} onCancel={onCancel} onStatus={onStatus} onTrack={onTrack} onInvoice={onInvoice} onQr={onQr} />)}</div> : <EmptyState icon={CalendarDays} title={`No ${filter.toLowerCase()} bookings.`} text={admin ? "New reservations will appear here." : "Your next drive is waiting to happen."} />}</div>;
}

function BookingRow({ booking, admin, onCancel, onStatus, onTrack, onInvoice, onQr }) {
  const canCancel = ["Confirmed", "Approved"].includes(booking.status) && new Date(booking.startAt).getTime() - Date.now() >= 2 * 60 * 60 * 1000;
  return <article className="booking-row-card"><img src={DEFAULT_CARS.find((car) => car.id === booking.carId)?.image || DEFAULT_CARS[0].image} alt={booking.car} /><div className="booking-row-main"><div className="booking-title"><div><span className="eyebrow">{booking.id} · {booking.status.toUpperCase()}</span><h3>{booking.car}</h3></div><span className="booking-amount">{money(booking.total)}</span></div><div className="booking-meta"><span><MapPin size={13} /> {booking.pickup}, {booking.city}</span><span><CalendarDays size={13} /> {dateTime(booking.startAt)} — {dateOnly(booking.endAt)}</span><span><CreditCard size={13} /> {booking.paymentStatus || "Demo — not processed"}</span>{admin && <span><Users size={13} /> {booking.customer}</span>}</div><div className="booking-row-actions">{admin && booking.status === "Confirmed" && <><button className="small-action approve" onClick={() => onStatus(booking, "Approved")}>Approve</button><button className="small-action reject" onClick={() => onStatus(booking, "Rejected")}>Reject</button></>}{canCancel && !admin && <button className="small-action reject" onClick={() => onCancel(booking)}>Cancel booking</button>}{admin && ["Confirmed", "Approved", "Active"].includes(booking.status) && <button className="small-action" onClick={() => onTrack(booking)}>Monitor</button>}{!admin && ["Confirmed", "Approved", "Active"].includes(booking.status) && <><button className="small-action" onClick={() => onTrack(booking)}>Track ride</button><button className="small-action" onClick={() => onQr(booking)}>Pickup QR</button></>}<button className="small-action" onClick={() => onInvoice(booking)}><Download size={12} /> Invoice</button></div></div></article>;
}

function Tracking({ booking, tracking, refresh }) {
  return <div className="feature-page"><PageHeader eyebrow="VEHICLE MONITORING · SIMULATED DEMO" title="The ride is on its way." subtitle="This is a clearly labelled route simulation. No live GPS device or driver feed is connected." action={<button className="outline-button" onClick={refresh}><Activity size={14} /> Refresh simulation</button>} /><div className="tracking-banner"><span className="tracking-pulse" /> SIMULATED TRACKING · DEMO ONLY · NO LIVE GPS</div><div className="tracking-layout"><div className="tracking-map map-canvas"><div className="map-water" /><div className="tracking-road road-one" /><div className="tracking-road road-two" /><div className="tracking-road road-three" /><svg className="tracking-route" viewBox="0 0 600 300" preserveAspectRatio="none"><path d="M75 233 C150 205 125 135 255 155 S355 225 425 138 S500 90 540 52" /></svg><span className="tracking-pin pickup-pin"><MapPin size={18} fill="currentColor" /></span><span className="tracking-pin destination-pin"><MapPin size={18} fill="currentColor" /></span><span className="tracking-car"><CarFront size={20} /></span><span className="tracking-map-label pickup-map-label">{booking?.pickup || tracking?.pickup || "Pickup"}</span><span className="tracking-map-label destination-map-label">{booking?.pickup || tracking?.destination || "Drop-off"}</span><div className="map-compass"><Navigation size={14} /><span>N</span></div></div><section className="content-card tracking-info"><span className="eyebrow">DELIVERY STATUS</span><h2>{tracking?.status || "Driver assigned"}</h2><div className="tracking-eta"><strong>{tracking?.etaMinutes ?? 14}<small> min</small></strong><span>estimated arrival<br />{booking ? dateTime(booking.startAt) : "Demo route"}</span></div><div className="progress-track"><span style={{ width: `${tracking?.progress || 35}%` }} /></div><div className="track-step"><span className="track-step-icon"><Users size={15} /></span><div><small>DRIVER · SIMULATED</small><strong>{tracking?.driver?.name || "Aarav Sharma"}</strong><span>{tracking?.driver?.phone || "+91 98765 43210"}</span></div></div><div className="track-step"><span className="track-step-icon"><CarFront size={15} /></span><div><small>YOUR VEHICLE</small><strong>{booking?.car || "Reservation vehicle"}</strong><span>Registration {tracking?.registration || "Pending"}</span></div></div><div className="tracking-status-foot"><ShieldCheck size={14} /> Driver location data requires consent and authorised GPS.</div></section></div></div>;
}

function Inspection({ bookings, previews, setPreviews, onSubmit }) {
  const eligible = bookings.filter((item) => !["Cancelled", "Rejected"].includes(item.status));
  return <div className="feature-page"><PageHeader eyebrow="DIGITAL VEHICLE INSPECTION" title="A little peace of mind." subtitle="Record fuel, odometer and notes before and after the drive." />{eligible.length ? <form className="content-card inspection-form" onSubmit={onSubmit}><label>BOOKING<select name="bookingId" required>{eligible.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.car}</option>)}</select></label><label>INSPECTION STAGE<select name="stage"><option value="before">Before pickup</option><option value="after">After return</option></select></label><div className="form-two-col"><label>FUEL LEVEL<input name="fuel" type="number" min="0" max="100" placeholder="75" required /><small>Percentage of tank.</small></label><label>ODOMETER READING<input name="odometer" type="number" min="0" placeholder="12000" required /><small>Distance in km.</small></label></div><label>CONDITION NOTES<textarea name="notes" maxLength="500" placeholder="Note any existing scratches, marks or condition details…" /></label><label className="upload-zone"><input type="file" accept="image/*" multiple onChange={(event) => setPreviews(Array.from(event.target.files || []).slice(0, 8).map((file) => ({ name: file.name, url: URL.createObjectURL(file) })))} /><Plus size={18} /><strong>Add before / after photos</strong><small>Images preview locally in this browser; this demo does not upload photo files.</small></label>{previews.length > 0 && <div className="photo-preview-grid">{previews.map((item) => <div key={item.url}><img src={item.url} alt="Inspection preview" /><span>{item.name}</span></div>)}</div>}<button className="button-primary">Save inspection notes <ArrowRight size={14} /></button></form> : <EmptyState icon={ShieldCheck} title="Inspection is ready when you are." text="Create a booking first to attach an inspection record." />}</div>;
}

function QrPage({ bookings, qr, selectedId, onSelect, onVerify, admin }) {
  const selected = bookings.find((item) => item.id === selectedId) || bookings[0];
  return <div className="feature-page"><PageHeader eyebrow="BOOKING-SPECIFIC PICKUP VERIFICATION" title={admin ? "Verify the hand-off." : "Your pickup pass."} subtitle={admin ? "Scan and confirm the customer’s reservation QR token." : "Show this one-time reservation QR to the authorised pickup team."} /><div className="qr-layout"><section className="content-card qr-card">{bookings.length ? <><label>RESERVATION<select value={selected?.id || ""} onChange={(event) => onSelect(event.target.value)}>{bookings.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.car}</option>)}</select></label>{!admin && qr && <><img className="qr-image" src={qr} alt={`Pickup QR code for ${selected?.id}`} /><strong>{selected?.id}</strong><span className="qr-disclaimer">Private pickup credential. Share only at the authorised hand-off.</span></>}{!admin && !qr && <button className="button-primary" onClick={() => onSelect(selected?.id)}>Open QR pass <ArrowRight size={14} /></button>}{admin && <form className="qr-verify-form" onSubmit={onVerify}><label>BOOKING ID<input name="bookingId" required placeholder="R-123456" /></label><label>SCANNED QR TOKEN<input name="token" required placeholder="Enter token from authorised QR scanner" /></label><button className="button-primary">Verify pickup <ShieldCheck size={14} /></button></form>}</> : <EmptyState icon={Activity} title="No pickup QR yet." text="A booking-specific pass appears after a reservation is created." />}</section><aside className="booking-side-card"><span className="eyebrow">A SAFE HAND-OFF</span><div><ShieldCheck size={16} /><span>Every QR is linked to a specific reservation.</span></div><div><LockKeyhole size={16} /><span>Only authorised staff should verify pickup tokens.</span></div><div><Activity size={16} /><span>Admin verification records the hand-off event.</span></div></aside></div></div>;
}

function Rewards({ data }) {
  return <div className="feature-page"><PageHeader eyebrow="ROAM REWARDS" title="Good drives add up." subtitle="Earn points with each completed booking. Redeem eligible offers." /><div className="rewards-hero"><div><span className="eyebrow light-eyebrow">YOUR CURRENT BALANCE</span><strong>{Number(data.points || 0).toLocaleString("en-IN")} <small>points</small></strong><span>Earn 50 points per reservation.</span></div><Star size={42} /></div><div className="rewards-offers"><div className="content-card"><span className="offer-icon"><Wallet size={18} /></span><span className="eyebrow">REDEEM · 500 POINTS</span><h3>₹250 off your next ride</h3><p>You're building toward your next reward. Redemption is a demo preview.</p><button className="outline-button" disabled={data.points < 500}> {data.points >= 500 ? "Redeem offer" : `${500 - Number(data.points || 0)} points to go`} <ArrowRight size={13} /></button></div><div className="content-card rewards-history"><span className="eyebrow">YOUR REWARD HISTORY</span>{data.history?.length ? data.history.map((item, index) => <div className="activity-row" key={`${item.label}-${index}`}><div className="activity-icon"><Star size={15} /></div><div><strong>{item.label}</strong><span>{dateOnly(item.date)}</span></div><b>+{item.points} pts</b></div>) : <EmptyState icon={Star} title="Your first reward is waiting." text="Complete a reservation to start earning." />}</div></div></div>;
}

function Assistant({ chat, input, setInput, onSend }) {
  return <div className="feature-page"><PageHeader eyebrow="CARGO AI · DEMO ASSISTANT" title="A co-pilot for the details." subtitle="Ask about bookings, car availability, trip estimates, cancellations or tracking." /><div className="assistant-page content-card"><div className="assistant-header"><span className="chat-avatar"><Sparkles size={17} /></span><div><strong>CarGo Assistant</strong><small><span className="live-dot" /> Ready to help · local demo responses</small></div><span className="chat-badge">BETA</span></div><div className="assistant-messages">{chat.length === 0 && <div className="assistant-welcome"><span><Sparkles size={22} /></span><strong>Where can I help you roam?</strong><small>Try “find a budget ride”, “check availability”, or “how do I track?”</small></div>}{chat.map((item, index) => <div key={index} className={`chat-message ${item.from === "user" ? "chat-user" : ""}`}>{item.text}</div>)}</div><form className="assistant-input" onSubmit={onSend}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask CarGo anything…" /><button aria-label="Send message"><Send size={16} /></button></form><small className="assistant-disclaimer">Assistant replies are rule-based demo guidance, not an external AI service.</small></div></div>;
}

function Profile({ user, form, setForm, onSave }) {
  return <div className="feature-page"><PageHeader eyebrow="YOUR ROAM ACCOUNT" title="The details are yours." subtitle="Manage your profile and account preferences." /><form className="content-card profile-form" onSubmit={onSave}><div className="profile-identity"><div className="profile-big-avatar">{user.name?.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div><div><strong>{user.name}</strong><span>{user.role === "admin" ? "Fleet administrator" : "Roam member"} · verified account</span></div><BadgeCheck size={18} /></div><label>FULL NAME<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength="2" required /></label><label>EMAIL ADDRESS<input value={user.email || ""} readOnly /><small>Email changes require an account recovery flow.</small></label><label>INDIAN MOBILE NUMBER<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="+91 98765 43210" required /></label><label>PREFERRED RIDE<select value={form.preference || "Comfort"} onChange={(event) => setForm({ ...form, preference: event.target.value })}><option>Comfort</option><option>Budget</option><option>Luxury</option><option>Electric</option><option>Adventure</option></select></label><div className="profile-security-note"><ShieldCheck size={15} /> Passwords are securely hashed on the server. Sessions use HTTP-only cookies; credentials are not stored in localStorage.</div><button className="button-primary">Save profile <Check size={14} /></button></form></div>;
}

function Reviews({ cars, reviews, onSubmit }) {
  return <div className="feature-page"><PageHeader eyebrow="CUSTOMER FEEDBACK" title="Good drives deserve a note." subtitle="Share a rating or read what other Roam members think." /><div className="reviews-layout"><form className="content-card review-form" onSubmit={onSubmit}><span className="eyebrow">WRITE A REVIEW</span><label>VEHICLE<select name="carId">{cars.map((car) => <option key={car.id} value={car.id}>{car.name}</option>)}</select></label><label>YOUR RATING<select name="rating"><option value="5">★★★★★ · Loved it</option><option value="4">★★★★ · Really good</option><option value="3">★★★ · Good</option><option value="2">★★ · Could improve</option><option value="1">★ · Not for me</option></select></label><label>YOUR FEEDBACK<textarea name="comment" required maxLength="1000" placeholder="What made the ride memorable?" /></label><button className="button-primary">Share your review <ArrowRight size={14} /></button></form><div className="review-feed">{reviews.length ? reviews.map((item) => <article className="content-card review-card" key={item.id}><span className="rating"><Star size={13} fill="currentColor" /> {item.rating}.0</span><p>“{item.comment}”</p><div><span className="avatar">{item.user?.slice(0, 1)}</span><strong>{item.user}</strong><small>{dateOnly(item.at)}</small></div></article>) : <EmptyState icon={Heart} title="No reviews yet." text="Be the first to share a good drive." />}</div></div></div>;
}

function Notifications({ items, markRead }) {
  return <div className="feature-page"><PageHeader eyebrow="NOTIFICATIONS & ALERTS" title="A few useful updates." subtitle="Booking updates, payment status, pickup reminders and delivery alerts." />{items.length ? <div className="notification-list">{items.map((item) => <article className={`notification-item ${item.read ? "read" : ""}`} key={item.id}><span className="notification-icon"><Bell size={16} /></span><div><strong>{item.text}</strong><small>{dateTime(item.at)}</small></div>{!item.read && <button className="small-action" onClick={() => markRead(item)}>Mark read</button>}</article>)}</div> : <EmptyState icon={Bell} title="All quiet for now." text="Booking changes and reminders will appear here." />}</div>;
}

function FleetManagement({ cars, onSave, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(null);
  return <div className="feature-page"><PageHeader eyebrow="FLEET MANAGEMENT" title="Every vehicle, in good company." subtitle="Add, edit and manage availability for your fleet." /><form className="content-card add-car-form" onSubmit={onSave}><span className="eyebrow"><Plus size={13} /> ADD A VEHICLE</span><div className="form-three-col"><label>VEHICLE NAME<input name="name" required placeholder="e.g. Honda City" /></label><label>CATEGORY<select name="type"><option>Budget</option><option>City</option><option>Luxury</option><option>Sports</option><option>Adventure</option><option>Electric</option></select></label><label>PRICE PER HOUR (₹)<input name="price" type="number" min="1" required placeholder="1500" /></label><label>PASSENGERS<input name="seats" type="number" min="2" max="9" required placeholder="5" /></label><label>FUEL<select name="fuel"><option>Petrol</option><option>Diesel</option><option>Electric</option><option>Hybrid</option></select></label><label>MILEAGE (KM/L)<input name="mileage" type="number" min="1" placeholder="15" /></label></div><button className="button-primary">Add to fleet <Plus size={14} /></button></form><div className="fleet-management-list">{cars.map((car) => <article className="fleet-management-card" key={car.id}><img src={car.image} alt={car.name} /><div><span className="eyebrow">{car.type} · {car.registration || "Registration pending"}</span><h3>{car.name}</h3><span>{car.seats} seats · {car.fuel} · {money(car.price)}/hour</span></div><span className={`status-pill ${car.available ? "status-confirmed" : "status-progress"}`}><span />{car.available ? "Available" : "Unavailable"}</span><button className="small-action" onClick={() => setEditing(editing === car.id ? null : car.id)}><Settings2 size={13} /> Edit</button><button className="small-action reject" onClick={() => onDelete(car)}>Remove</button>{editing === car.id && <form className="inline-edit" onSubmit={(event) => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget).entries()); onUpdate(car, { price: Number(data.price), available: data.available === "true", odometer: Number(data.odometer) }); setEditing(null); }}><label>HOURLY RATE (₹)<input name="price" type="number" defaultValue={car.price} min="1" /></label><label>ODOMETER (KM)<input name="odometer" type="number" defaultValue={car.odometer || 0} min="0" /></label><label>AVAILABILITY<select name="available" defaultValue={String(car.available)}><option value="true">Available</option><option value="false">Unavailable</option></select></label><button className="button-primary">Save changes</button></form>}</article>)}</div></div>;
}

function MaintenancePage({ items, cars, onSubmit }) {
  const alerts = cars.filter((car) => Number(car.odometer || 0) >= 20000 || (car.lastService && Date.now() - new Date(car.lastService).getTime() > 1000 * 60 * 60 * 24 * 120));
  return <div className="feature-page"><PageHeader eyebrow="PREDICTIVE MAINTENANCE" title="Good care. Great miles." subtitle="Service reminders are suggested from odometer readings and service dates." /><div className="maintenance-alert-strip"><Wrench size={17} /><span><strong>{alerts.length} suggested service reminders</strong><small>Heuristic alerts only. Confirm condition with a qualified technician.</small></span></div><div className="maintenance-grid"><form className="content-card maintenance-form" onSubmit={onSubmit}><span className="eyebrow">SCHEDULE SERVICE</span><label>VEHICLE<select name="car">{cars.map((car) => <option key={car.id}>{car.name}</option>)}</select></label><label>SERVICE TASK<input name="task" required placeholder="Routine service, tire check…" /></label><label>DATE & TIME<input name="date" type="datetime-local" required /></label><label>PRIORITY<select name="priority"><option>Normal</option><option>High</option></select></label><button className="button-primary">Schedule maintenance <Plus size={14} /></button></form><div className="maintenance-list">{items.map((item, index) => <article className="maintenance-card" key={item.id}><div className="maintenance-date-tile"><span>{dateOnly(item.date).slice(3, 5)}</span><strong>{dateOnly(item.date).slice(0, 2)}</strong></div><div className="maintenance-details"><span className="eyebrow">{item.priority} PRIORITY · {item.status}</span><h3>{item.car}</h3><p>{item.task}</p><small><Clock3 size={12} /> {dateTime(item.date)}</small></div>{index === 0 && <Wrench size={16} />}</article>)}</div></div></div>;
}

function DriverManagement({ drivers, cars, onSubmit, onUpdate }) {
  return <div className="feature-page"><PageHeader eyebrow="DRIVER MANAGEMENT" title="The people behind the wheel." subtitle="Register drivers, track verification status and vehicle assignments." /><form className="content-card driver-form" onSubmit={onSubmit}><label>DRIVER NAME<input name="name" required placeholder="Full name" /></label><label>INDIAN MOBILE<input name="phone" type="tel" required placeholder="+91 98765 43210" /></label><label>LICENSE NUMBER<input name="license" required placeholder="MH-DR-1234" /></label><button className="button-primary">Register driver <Plus size={14} /></button></form><div className="driver-list">{drivers.map((driver) => <article className="content-card driver-card" key={driver.id}><div className="profile-big-avatar">{driver.name.split(" ").map((item) => item[0]).slice(0, 2).join("")}</div><div><span className="eyebrow">DRIVER · {driver.id.slice(0, 6)}</span><h3>{driver.name}</h3><p>{driver.phone} · Licence {driver.license}</p><small>Assigned vehicle · {driver.assigned}</small></div><select aria-label={`Assign vehicle to ${driver.name}`} value={driver.assigned} onChange={(event) => onUpdate(driver, { assigned: event.target.value })}><option>Unassigned</option>{cars.map((car) => <option key={car.id}>{car.registration}</option>)}</select><select aria-label={`Set verification status for ${driver.name}`} value={driver.status} onChange={(event) => onUpdate(driver, { status: event.target.value })}><option>Pending verification</option><option>Verified</option><option>Suspended</option></select><span className={`status-pill ${driver.status === "Verified" ? "status-confirmed" : "status-progress"}`}><span />{driver.status}</span></article>)}</div><p className="muted-copy">Driver identity and licence verification must be completed through an authorised verification process before assignment.</p></div>;
}

function Monitoring({ bookings, cars, tracking, onTrack }) {
  const active = bookings.filter((item) => ["Confirmed", "Approved", "Active"].includes(item.status));
  return <div className="feature-page"><PageHeader eyebrow="AUTHORISED FLEET MONITORING" title="The fleet, in motion." subtitle="Tracking below is simulated. A production rollout needs consented GPS from an authorised driver or vehicle device." /><div className="tracking-banner"><span className="tracking-pulse" /> SIMULATED FLEET VIEW · LIVE GPS NOT CONNECTED</div><div className="tracking-layout"><div className="fleet-map map-canvas"><div className="map-water" /><div className="tracking-road road-one" /><div className="tracking-road road-two" /><div className="tracking-road road-three" /><span className="monitor-route" /><span className="monitor-pin pin-one"><CarFront size={15} /></span><span className="monitor-pin pin-two"><CarFront size={15} /></span><span className="monitor-pin pin-three"><CarFront size={15} /></span><span className="map-label label-one">MUMBAI</span><div className="map-compass"><Navigation size={14} /><span>N</span></div></div><section className="content-card tracking-info"><span className="eyebrow">{active.length} AUTHORISED ACTIVE RESERVATIONS</span>{active.length ? active.map((item) => <div className="monitor-booking" key={item.id}><div><strong>{item.car}</strong><span>{item.pickup}, {item.city} · {item.id}</span></div><button className="small-action" onClick={() => onTrack(item)}>View route <ArrowRight size={12} /></button></div>) : <EmptyState icon={LocateFixed} title="No active fleet reservations." text="Eligible bookings will appear here." />}{cars.slice(0, 3).map((car) => <div className="monitor-car" key={car.id}><span className="service-dot" /><span>{car.registration} · {car.name}</span><small>{car.available ? "Available" : "Unavailable"}</small></div>)}{tracking && <div className="tracking-status-foot">Last demo update: {tracking.status} · ETA {tracking.etaMinutes} min</div>}</section></div></div>;
}

function Customers({ items, bookings, onStatus }) {
  const [expanded, setExpanded] = useState("");
  return <div className="feature-page"><PageHeader eyebrow="CUSTOMER MANAGEMENT" title="The people who roam." subtitle="Review account status and booking history. Passwords are never exposed here." />{items.length ? <div className="customer-list">{items.map((item) => {
    const history = bookings.filter((booking) => booking.userId === item.id);
    return <article className="content-card customer-card" key={item.id}><div className="customer-main"><div className="profile-big-avatar">{item.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div><span className="eyebrow">{item.email}</span><h3>{item.name}</h3><span>{item.phone} · {history.length} reservation{history.length === 1 ? "" : "s"}</span></div><span className={`status-pill ${item.status === "active" ? "status-confirmed" : "status-progress"}`}><span />{item.status}</span><button className="small-action" onClick={() => setExpanded(expanded === item.id ? "" : item.id)}>{expanded === item.id ? "Hide history" : "View history"}</button><button className={`small-action ${item.status === "active" ? "reject" : "approve"}`} onClick={() => onStatus(item, item.status === "active" ? "suspended" : "active")}>{item.status === "active" ? "Suspend account" : "Reactivate"}</button></div>{expanded === item.id && <div className="customer-history">{history.length ? history.map((booking) => <div className="activity-row" key={booking.id}><div className="activity-icon"><CarFront size={14} /></div><div><strong>{booking.car} · {booking.id}</strong><span>{dateTime(booking.startAt)} · {booking.status} · payment {booking.paymentStatus}</span></div><b>{money(booking.total)}</b></div>) : <span className="muted-copy">No reservation history yet.</span>}</div>}</article>;
  })}</div> : <EmptyState icon={Users} title="No customer accounts yet." text="New members will appear here after registration." />}</div>;
}

function RevenueAnalytics({ analytics, bookings }) {
  const [period, setPeriod] = useState("Month");
  const now = new Date();
  const series = period === "Day"
    ? Array.from({ length: 24 }, (_item, hour) => ({
      label: `${String(hour).padStart(2, "0")}:00`,
      amount: bookings.filter((item) => {
        const date = new Date(item.createdAt);
        return date.toDateString() === now.toDateString() && date.getHours() === hour;
      }).reduce((sum, item) => sum + item.total, 0)
    }))
    : period === "Week"
      ? Array.from({ length: 7 }, (_item, index) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - index));
        return { label: date.toLocaleDateString("en-IN", { weekday: "short" }), amount: bookings.filter((item) => new Date(item.createdAt).toDateString() === date.toDateString()).reduce((sum, item) => sum + item.total, 0) };
      })
      : period === "Month"
        ? Array.from({ length: 4 }, (_item, index) => {
          const end = new Date(now);
          end.setDate(now.getDate() - (3 - index) * 7);
          const start = new Date(end);
          start.setDate(end.getDate() - 6);
          return { label: `W${index + 1}`, amount: bookings.filter((item) => new Date(item.createdAt) >= start && new Date(item.createdAt) < new Date(end.getTime() + 86400000)).reduce((sum, item) => sum + item.total, 0) };
        })
        : Array.from({ length: 12 }, (_item, index) => {
          const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
          return { label: date.toLocaleDateString("en-IN", { month: "short" }), amount: bookings.filter((item) => {
            const created = new Date(item.createdAt);
            return created.getMonth() === date.getMonth() && created.getFullYear() === date.getFullYear();
          }).reduce((sum, item) => sum + item.total, 0) };
        });
  const peak = Math.max(1, ...series.map((item) => item.amount));
  const maxDaily = Math.max(1, ...bookings.map((item) => item.total));
  return <div className="feature-page"><PageHeader eyebrow="REVENUE ANALYTICS" title="The numbers behind the miles." subtitle="Revenue charts show reservation value only. Demo bookings have not been paid." /><div className="revenue-stats"><Stat label="BOOKED VALUE · ALL TIME" value={money(analytics.revenue)} icon={Wallet} tint="mint" /><Stat label="TODAY'S RESERVATIONS" value={bookings.filter((item) => new Date(item.createdAt).toDateString() === now.toDateString()).length} icon={CalendarDays} tint="gold" /><Stat label="AVERAGE BOOKING" value={money(bookings.length ? Math.round(analytics.revenue / bookings.length) : 0)} icon={Activity} tint="blue" /></div><section className="content-card chart-card"><div className="panel-title"><div><span className="eyebrow">{period.toUpperCase()} · INR</span><h2>Reservation value</h2></div><div className="chart-tools"><select value={period} onChange={(event) => setPeriod(event.target.value)} aria-label="Revenue time range"><option>Day</option><option>Week</option><option>Month</option><option>Year</option></select><span className="status-pill status-demo">NOT CASH RECEIVED</span></div></div><div className="bar-chart">{series.map((item) => <div className="chart-column" key={item.label}><span>{item.amount ? money(item.amount) : "—"}</span><div style={{ height: `${Math.max(4, item.amount / peak * 100)}%` }} /><small>{item.label}</small></div>)}</div></section><section className="content-card daily-revenue"><span className="eyebrow">RESERVATION ACTIVITY</span>{bookings.length ? bookings.slice(0, 7).map((item) => <div className="revenue-row" key={item.id}><span>{dateOnly(item.createdAt)} · {item.car}</span><div><span style={{ width: `${Math.max(3, item.total / maxDaily * 100)}%` }} /></div><strong>{money(item.total)}</strong></div>) : <EmptyState icon={Wallet} title="No revenue data yet." text="Booking value will appear when reservations are created." />}</section></div>;
}

function SecurityPage({ data, reviews }) {
  return <div className="feature-page"><PageHeader eyebrow="SECURITY MONITORING & FEEDBACK" title="Keep a clear view." subtitle="Failed login attempts, booking signals and admin actions. Never record or show passwords." /><div className="security-stats"><Stat label="FAILED SIGN-IN EVENTS" value={data.failedLogins?.length || 0} icon={LockKeyhole} tint="rose" /><Stat label="RECENT SIGNALS" value={data.events?.length || 0} icon={Activity} tint="gold" /><Stat label="ADMIN ACTIONS" value={data.adminActions?.length || 0} icon={ShieldCheck} tint="mint" /></div><div className="admin-content-grid"><SecurityList title="Security events" items={data.events || []} empty="No security events recorded." /><SecurityList title="Administrative actions" items={data.adminActions || []} empty="No admin actions recorded." /></div><section className="content-card security-reviews"><div className="panel-title"><div><span className="eyebrow">CUSTOMER FEEDBACK</span><h2>Recent reviews</h2></div></div>{reviews.length ? reviews.slice(0, 6).map((review) => <div className="activity-row" key={review.id}><div className="activity-icon"><Star size={15} /></div><div><strong>{review.user} · {review.rating}/5</strong><span>{review.comment}</span></div><small>{dateOnly(review.at)}</small></div>) : <EmptyState icon={Star} title="No reviews yet." text="Customer feedback will appear here." />}</section></div>;
}

function SecurityList({ title, items, empty }) {
  return <section className="content-card security-list"><span className="eyebrow">{title.toUpperCase()}</span>{items.length ? items.slice(0, 12).map((item) => <div className="security-row" key={item.id}><span className="security-event-dot" /><div><strong>{item.type || item.action}</strong><span>{item.details || item.email}</span></div><small>{dateTime(item.at)}</small></div>) : <p className="muted-copy">{empty}</p>}</section>;
}

function EmptyState({ icon: Icon, title, text, action, onClick }) {
  return <div className="empty-state"><div><Icon size={21} /></div><h3>{title}</h3><p>{text}</p>{action && <button className="outline-button" onClick={onClick}>{action} <ArrowRight size={13} /></button>}</div>;
}

export default App;
