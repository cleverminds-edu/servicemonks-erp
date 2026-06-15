/**
 * Development mock server — simulates the full FastAPI backend.
 * Run: node mock-server.js
 * Serves on :8000  (Vite proxies /api → here)
 */
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// ── Seed data ────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  { id: 1,  name: "Rodent Control",                category: "Rodent & Pest Control" },
  { id: 2,  name: "Cockroach Control",             category: "Rodent & Pest Control" },
  { id: 3,  name: "Spider Control",                category: "Rodent & Pest Control" },
  { id: 4,  name: "Lizard Control",                category: "Rodent & Pest Control" },
  { id: 5,  name: "Ant Control",                   category: "Rodent & Pest Control" },
  { id: 6,  name: "All Crawling & Flying Insects", category: "Rodent & Pest Control" },
  { id: 7,  name: "Mosquito Control",              category: "Vector-Borne Disease Management" },
  { id: 8,  name: "Fly Control",                   category: "Vector-Borne Disease Management" },
  { id: 9,  name: "Bed Bug Control",               category: "Vector-Borne Disease Management" },
  { id: 10, name: "Termite Control",               category: "Structural & Property Protection" },
  { id: 11, name: "Entry Point Closure",           category: "Structural & Property Protection" },
  { id: 12, name: "Snake Prevention",              category: "Structural & Property Protection" },
  { id: 13, name: "Disinfection / Sterifume",      category: "Specialized Treatments" },
  { id: 14, name: "Beehive Removal",               category: "Specialized Treatments" },
  { id: 15, name: "Stored Pest Insects",           category: "Specialized Treatments" },
  { id: 16, name: "Weed Control",                  category: "Specialized Treatments" },
];

let customers = [
  { id: 1, name: "Sunrise Residency",    contact_person: "Mr. Ramesh Patel",   phone: "9876543210", email: "ramesh@sunriseresidency.com", address: "12, Palm Grove, Andheri West", city: "Mumbai", pincode: "400053", sector: "residential", notes: "3 towers, monthly service", is_active: true, created_at: "2024-01-15T00:00:00" },
  { id: 2, name: "Hotel Grand Hyatt",    contact_person: "Ms. Priya Sharma",   phone: "9123456780", email: "priya@grandhyatt.com",         address: "Sahar Rd, Andheri East",       city: "Mumbai", pincode: "400099", sector: "commercial", notes: "Kitchen + rooms treatment",   is_active: true, created_at: "2024-02-01T00:00:00" },
  { id: 3, name: "Fortis Hospital",      contact_person: "Admin Manager",      phone: "9988776655", email: "admin@fortis.com",             address: "Mulund Goregaon Link Rd",      city: "Mumbai", pincode: "400080", sector: "healthcare", notes: "Strict no-chemical zones",    is_active: true, created_at: "2024-02-20T00:00:00" },
  { id: 4, name: "Reliance Warehouse",   contact_person: "Mr. Anil Gupta",     phone: "9870001234", email: "anil@reliancewarehouse.com",   address: "MIDC, Turbhe, Navi Mumbai",    city: "Navi Mumbai", pincode: "400705", sector: "industrial", notes: "Grain storage area",     is_active: true, created_at: "2024-03-10T00:00:00" },
  { id: 5, name: "Skyline Apartments",   contact_person: "Society Secretary",  phone: "9765432100", email: "skyline@gmail.com",            address: "Powai Lake Road, Powai",       city: "Mumbai", pincode: "400076", sector: "residential", notes: "",                            is_active: true, created_at: "2024-03-18T00:00:00" },
  { id: 6, name: "McDonald's Bandra",    contact_person: "Store Manager",      phone: "9654321098", email: "bandra@mcdonalds.com",         address: "Linking Rd, Bandra West",      city: "Mumbai", pincode: "400050", sector: "commercial", notes: "Weekly kitchen inspection",   is_active: true, created_at: "2024-04-01T00:00:00" },
];

let contracts = [
  { id: 1, customer_id: 1, service_type_id: 1,  frequency: "monthly",    start_date: "2024-01-15", end_date: "2025-01-14", contract_value: 18000, notes: "AMC",   is_active: true, created_at: "2024-01-15T00:00:00", service_type: SERVICE_TYPES[0] },
  { id: 2, customer_id: 1, service_type_id: 2,  frequency: "quarterly",  start_date: "2024-01-15", end_date: null,          contract_value: 12000, notes: "",      is_active: true, created_at: "2024-01-15T00:00:00", service_type: SERVICE_TYPES[1] },
  { id: 3, customer_id: 2, service_type_id: 7,  frequency: "fortnightly",start_date: "2024-02-01", end_date: "2025-01-31",  contract_value: 24000, notes: "Lobby", is_active: true, created_at: "2024-02-01T00:00:00", service_type: SERVICE_TYPES[6] },
  { id: 4, customer_id: 3, service_type_id: 13, frequency: "monthly",    start_date: "2024-02-20", end_date: null,          contract_value: 35000, notes: "ICU+OT",is_active: true, created_at: "2024-02-20T00:00:00", service_type: SERVICE_TYPES[12] },
  { id: 5, customer_id: 4, service_type_id: 10, frequency: "quarterly",  start_date: "2024-03-10", end_date: null,          contract_value: 15000, notes: "",      is_active: true, created_at: "2024-03-10T00:00:00", service_type: SERVICE_TYPES[9] },
];

let users = [
  { id: 1, employee_id: "SM001", name: "Admin",           email: "admin@servicemonks.com",   phone: "9000000001", role: "admin",         is_active: true, monthly_salary: null,  created_at: "2024-01-01T00:00:00" },
  { id: 2, employee_id: "SM002", name: "Ravi Sharma",     email: "manager@servicemonks.com", phone: "9000000002", role: "manager",       is_active: true, monthly_salary: null,  created_at: "2024-01-01T00:00:00" },
  { id: 3, employee_id: "SM003", name: "Suresh Patil",    email: "suresh@servicemonks.com",  phone: "9111111111", role: "technician",    is_active: true, monthly_salary: 28000, created_at: "2024-01-05T00:00:00" },
  { id: 4, employee_id: "SM004", name: "Deepak Kumar",    email: "deepak@servicemonks.com",  phone: "9222222222", role: "technician",    is_active: true, monthly_salary: 25000, created_at: "2024-01-05T00:00:00" },
  { id: 5, employee_id: "SM005", name: "Manoj Singh",     email: "manoj@servicemonks.com",   phone: "9333333333", role: "technician",    is_active: true, monthly_salary: 26000, created_at: "2024-01-10T00:00:00" },
  { id: 6, employee_id: "SM006", name: "Priya Desai",     email: "priya.d@servicemonks.com", phone: "9444444444", role: "support_staff", is_active: true, monthly_salary: 22000, created_at: "2024-02-01T00:00:00" },
  { id: 7, employee_id: "SM007", name: "Arun Nair",       email: "arun@servicemonks.com",    phone: "9555555555", role: "support_staff", is_active: true, monthly_salary: 20000, created_at: "2024-02-01T00:00:00" },
];

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
const tomorrow  = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const dayAfter  = new Date(Date.now() + 172800000).toISOString().slice(0, 10);

let jobs = [
  { id: 1, contract_id: 1, customer_id: 1, service_type_id: 1,  assigned_to: 3, scheduled_date: today,     scheduled_time: "09:30:00", status: "completed",   notes: "", created_by: 2, created_at: "2024-04-20T00:00:00" },
  { id: 2, contract_id: 3, customer_id: 2, service_type_id: 7,  assigned_to: 4, scheduled_date: today,     scheduled_time: "11:00:00", status: "in_progress", notes: "", created_by: 2, created_at: "2024-04-20T00:00:00" },
  { id: 3, contract_id: 4, customer_id: 3, service_type_id: 13, assigned_to: 3, scheduled_date: today,     scheduled_time: "14:00:00", status: "scheduled",   notes: "Wear PPE kit", created_by: 2, created_at: "2024-04-20T00:00:00" },
  { id: 4, contract_id: 5, customer_id: 4, service_type_id: 10, assigned_to: 5, scheduled_date: today,     scheduled_time: "16:30:00", status: "scheduled",   notes: "", created_by: 2, created_at: "2024-04-20T00:00:00" },
  { id: 5, contract_id: 2, customer_id: 1, service_type_id: 2,  assigned_to: 4, scheduled_date: tomorrow,  scheduled_time: "10:00:00", status: "scheduled",   notes: "", created_by: 2, created_at: "2024-04-21T00:00:00" },
  { id: 6, contract_id: 3, customer_id: 2, service_type_id: 7,  assigned_to: 3, scheduled_date: dayAfter,  scheduled_time: "09:00:00", status: "scheduled",   notes: "", created_by: 2, created_at: "2024-04-21T00:00:00" },
  { id: 7, contract_id: 1, customer_id: 1, service_type_id: 1,  assigned_to: 4, scheduled_date: yesterday, scheduled_time: "10:00:00", status: "completed",   notes: "", created_by: 2, created_at: "2024-04-19T00:00:00" },
];

let jobExecutions = [
  { id: 1, job_id: 1, technician_id: 3, checkin_time: `${today}T09:32:00`, checkout_time: `${today}T11:15:00`, products_used: "Gel Bait, Glue Traps", remarks: "Moderate infestation in kitchen. Applied gel bait near sinks and cabinets.", signature_path: null, pdf_path: "/uploads/pdfs/job_1.pdf", email_sent: true, submitted_at: `${today}T11:16:00` },
];

let conveyanceClaims = [
  { id: 1, technician_id: 3, job_id: 1, date: today,     distance_km: 12.5, rate_per_km: 5, amount: 62.5,  notes: "Andheri to Sunrise Residency",    status: "pending",  submitted_at: `${today}T11:17:00`,     technician: users[2] },
  { id: 2, technician_id: 4, job_id: 7, date: yesterday, distance_km: 18.0, rate_per_km: 5, amount: 90.0,  notes: "Office to Andheri and return",    status: "approved", submitted_at: `${yesterday}T14:00:00`, technician: users[3] },
  { id: 3, technician_id: 5, job_id: 4, date: today,     distance_km: 24.0, rate_per_km: 5, amount: 120.0, notes: "Thane to Navi Mumbai warehouse",  status: "pending",  submitted_at: `${today}T10:00:00`,     technician: users[4] },
];

// ── Attendance + Holiday seed ─────────────────────────────────────────────────
const ATTENDANCE_ROLES = ["technician", "support_staff"];
let attendanceRecords = [];
let nextAttendanceId = 1;
let holidays = [];
let nextHolidayId = 1;

// Seed declared holidays for current month
const seedNow = new Date();
const seedYr  = seedNow.getFullYear();
const seedMo  = String(seedNow.getMonth() + 1).padStart(2, "0");
holidays.push({ id: nextHolidayId++, date: `${seedYr}-${seedMo}-01`, name: "May Day", created_by: 1, created_at: new Date().toISOString() });

// Seed past attendance for current month (no half_day — only present/leave/absent)
for (let day = 1; day < seedNow.getDate(); day++) {
  const dateStr = `${seedYr}-${seedMo}-${String(day).padStart(2, "0")}`;
  const dow = new Date(dateStr).getDay();
  if (dow === 0) continue; // skip Sunday
  if (holidays.some(h => h.date === dateStr)) continue; // skip holidays
  for (const u of users.filter(u => ATTENDANCE_ROLES.includes(u.role))) {
    const roll = Math.random();
    const status = roll < 0.78 ? "present" : roll < 0.90 ? "leave" : "absent";
    attendanceRecords.push({ id: nextAttendanceId++, user_id: u.id, date: dateStr, status, marked_by: 2, notes: null, created_at: new Date().toISOString(), user_name: u.name, user_employee_id: u.employee_id });
  }
}

let nextJobId = 8;
let nextCustomerId = 7;
let nextContractId = 6;
let nextClaimId = 4;

// Enrich helpers
function enrichJob(job) {
  const customer    = customers.find(c => c.id === job.customer_id) || null;
  const technician  = users.find(u => u.id === job.assigned_to)    || null;
  const service_type = SERVICE_TYPES.find(s => s.id === job.service_type_id) || null;
  const execution   = jobExecutions.find(e => e.job_id === job.id) || null;
  return { ...job, customer, technician, service_type, execution };
}

// ── AUTH ─────────────────────────────────────────────────────────────────────
app.post("/api/auth/login", (req, res) => {
  const { employee_id, password } = req.body;
  const user = users.find(u => u.employee_id === (employee_id || "").toUpperCase() && u.is_active);
  if (!user) return res.status(401).json({ detail: "Invalid Employee ID or password" });
  // Accept any password in mock
  res.json({ access_token: `mock_token_${user.id}`, token_type: "bearer", user_id: user.id, employee_id: user.employee_id, name: user.name, role: user.role, email: user.email });
});

app.get("/api/auth/me", (req, res) => {
  const auth = req.headers.authorization || "";
  const uid = parseInt(auth.replace("Bearer mock_token_", "")) || 2;
  const user = users.find(u => u.id === uid) || users[1];
  res.json({ id: user.id, employee_id: user.employee_id, name: user.name, email: user.email, role: user.role, phone: user.phone });
});

// ── USERS ─────────────────────────────────────────────────────────────────────
app.get("/api/users", (req, res) => {
  const { role } = req.query;
  let list = users.filter(u => u.is_active);
  if (role) list = list.filter(u => u.role === role);
  res.json(list);
});

app.post("/api/users", (req, res) => {
  const user = { id: users.length + 1, ...req.body, password_hash: "hashed", is_active: true, created_at: new Date().toISOString() };
  users.push(user);
  res.json(user);
});

app.put("/api/users/:id", (req, res) => {
  const idx = users.findIndex(u => u.id === parseInt(req.params.id));
  if (idx < 0) return res.status(404).json({ detail: "Not found" });
  users[idx] = { ...users[idx], ...req.body };
  res.json(users[idx]);
});

// ── CUSTOMERS ─────────────────────────────────────────────────────────────────
app.get("/api/customers", (req, res) => {
  const { search, sector } = req.query;
  let list = customers.filter(c => c.is_active);
  if (search) list = list.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  if (sector) list = list.filter(c => c.sector === sector);
  res.json(list);
});

app.post("/api/customers", (req, res) => {
  const c = { id: nextCustomerId++, ...req.body, is_active: true, created_at: new Date().toISOString() };
  customers.push(c);
  res.json(c);
});

app.get("/api/customers/:id", (req, res) => {
  const c = customers.find(c => c.id === parseInt(req.params.id));
  if (!c) return res.status(404).json({ detail: "Not found" });
  res.json(c);
});

app.put("/api/customers/:id", (req, res) => {
  const idx = customers.findIndex(c => c.id === parseInt(req.params.id));
  if (idx < 0) return res.status(404).json({ detail: "Not found" });
  customers[idx] = { ...customers[idx], ...req.body };
  res.json(customers[idx]);
});

// ── SERVICES ─────────────────────────────────────────────────────────────────
app.get("/api/services/types", (req, res) => res.json(SERVICE_TYPES));

app.get("/api/services/contracts", (req, res) => {
  const { customer_id } = req.query;
  let list = contracts;
  if (customer_id) list = list.filter(c => c.customer_id === parseInt(customer_id));
  res.json(list);
});

app.post("/api/services/contracts", (req, res) => {
  const st = SERVICE_TYPES.find(s => s.id === parseInt(req.body.service_type_id));
  const c = { id: nextContractId++, ...req.body, service_type_id: parseInt(req.body.service_type_id), customer_id: parseInt(req.body.customer_id), is_active: true, created_at: new Date().toISOString(), service_type: st };
  contracts.push(c);
  res.json(c);
});

app.put("/api/services/contracts/:id", (req, res) => {
  const idx = contracts.findIndex(c => c.id === parseInt(req.params.id));
  if (idx < 0) return res.status(404).json({ detail: "Not found" });
  contracts[idx] = { ...contracts[idx], ...req.body };
  res.json(contracts[idx]);
});

// ── JOBS ─────────────────────────────────────────────────────────────────────
app.get("/api/jobs", (req, res) => {
  const { scheduled_date, status, technician_id, customer_id } = req.query;
  const auth = req.headers.authorization || "";
  const uid = parseInt(auth.replace("Bearer mock_token_", "")) || 2;
  const me = users.find(u => u.id === uid) || users[1];

  let list = jobs;
  if (me.role === "technician") list = list.filter(j => j.assigned_to === me.id);
  if (technician_id) list = list.filter(j => j.assigned_to === parseInt(technician_id));
  if (customer_id)   list = list.filter(j => j.customer_id === parseInt(customer_id));
  if (scheduled_date) list = list.filter(j => j.scheduled_date === scheduled_date);
  if (status) list = list.filter(j => j.status === status);

  res.json(list.map(enrichJob));
});

app.post("/api/jobs", (req, res) => {
  const auth = req.headers.authorization || "";
  const uid = parseInt(auth.replace("Bearer mock_token_", "")) || 2;
  const job = { id: nextJobId++, ...req.body, customer_id: parseInt(req.body.customer_id), service_type_id: parseInt(req.body.service_type_id), assigned_to: req.body.assigned_to ? parseInt(req.body.assigned_to) : null, status: "scheduled", created_by: uid, created_at: new Date().toISOString() };
  jobs.push(job);
  res.json(enrichJob(job));
});

app.get("/api/jobs/:id", (req, res) => {
  const job = jobs.find(j => j.id === parseInt(req.params.id));
  if (!job) return res.status(404).json({ detail: "Not found" });
  res.json(enrichJob(job));
});

app.put("/api/jobs/:id", (req, res) => {
  const idx = jobs.findIndex(j => j.id === parseInt(req.params.id));
  if (idx < 0) return res.status(404).json({ detail: "Not found" });
  jobs[idx] = { ...jobs[idx], ...req.body };
  res.json(enrichJob(jobs[idx]));
});

app.post("/api/jobs/:id/checkin", (req, res) => {
  const idx = jobs.findIndex(j => j.id === parseInt(req.params.id));
  if (idx < 0) return res.status(404).json({ detail: "Not found" });
  jobs[idx].status = "in_progress";
  const auth = req.headers.authorization || "";
  const uid = parseInt(auth.replace("Bearer mock_token_", "")) || 3;
  if (!jobExecutions.find(e => e.job_id === jobs[idx].id)) {
    jobExecutions.push({ id: jobExecutions.length + 1, job_id: jobs[idx].id, technician_id: uid, checkin_time: new Date().toISOString(), checkout_time: null, products_used: null, remarks: null, signature_path: null, pdf_path: null, email_sent: false, submitted_at: null });
  }
  res.json({ status: "checked_in" });
});

app.post("/api/jobs/:id/submit", (req, res) => {
  const idx = jobs.findIndex(j => j.id === parseInt(req.params.id));
  if (idx < 0) return res.status(404).json({ detail: "Not found" });
  jobs[idx].status = "completed";
  const exIdx = jobExecutions.findIndex(e => e.job_id === jobs[idx].id);
  const now = new Date().toISOString();
  const execData = { ...req.body, checkout_time: now, submitted_at: now, pdf_path: `/uploads/pdfs/job_${jobs[idx].id}.pdf`, email_sent: true };
  if (exIdx >= 0) {
    jobExecutions[exIdx] = { ...jobExecutions[exIdx], ...execData };
  } else {
    const auth = req.headers.authorization || "";
    const uid = parseInt(auth.replace("Bearer mock_token_", "")) || 3;
    jobExecutions.push({ id: jobExecutions.length + 1, job_id: jobs[idx].id, technician_id: uid, checkin_time: now, ...execData });
  }
  res.json({ status: "completed", pdf_path: `/uploads/pdfs/job_${jobs[idx].id}.pdf` });
});

// ── TRACKING ─────────────────────────────────────────────────────────────────
const liveLocations = {
  3: { technician_id: 3, name: "Suresh Patil",  lat: 19.1197, lng: 72.8468, job_id: 2 },
  4: { technician_id: 4, name: "Deepak Kumar",  lat: 19.0760, lng: 72.8777, job_id: 5 },
  5: { technician_id: 5, name: "Manoj Singh",   lat: 19.0330, lng: 73.0297, job_id: 4 },
};
app.post("/api/tracking/location", (req, res) => {
  const auth = req.headers.authorization || "";
  const uid = parseInt(auth.replace("Bearer mock_token_", "")) || 3;
  const user = users.find(u => u.id === uid);
  liveLocations[uid] = { technician_id: uid, name: user?.name || "Unknown", lat: req.body.latitude, lng: req.body.longitude, job_id: req.body.job_id || null };
  res.json({ status: "ok" });
});
app.get("/api/tracking/live", (req, res) => res.json(Object.values(liveLocations)));

// ── CONVEYANCE ────────────────────────────────────────────────────────────────
app.get("/api/conveyance", (req, res) => {
  const { status } = req.query;
  const auth = req.headers.authorization || "";
  const uid = parseInt(auth.replace("Bearer mock_token_", "")) || 2;
  const me = users.find(u => u.id === uid) || users[1];
  let list = conveyanceClaims;
  if (me.role === "technician") list = list.filter(c => c.technician_id === me.id);
  if (status) list = list.filter(c => c.status === status);
  res.json(list);
});

app.post("/api/conveyance", (req, res) => {
  const auth = req.headers.authorization || "";
  const uid = parseInt(auth.replace("Bearer mock_token_", "")) || 3;
  const tech = users.find(u => u.id === uid);
  const claim = { id: nextClaimId++, technician_id: uid, ...req.body, job_id: parseInt(req.body.job_id), amount: parseFloat(req.body.distance_km) * parseFloat(req.body.rate_per_km || 5), status: "pending", submitted_at: new Date().toISOString(), technician: tech };
  conveyanceClaims.push(claim);
  res.json(claim);
});

app.put("/api/conveyance/:id/approve", (req, res) => {
  const idx = conveyanceClaims.findIndex(c => c.id === parseInt(req.params.id));
  if (idx < 0) return res.status(404).json({ detail: "Not found" });
  conveyanceClaims[idx].status = "approved";
  res.json(conveyanceClaims[idx]);
});

app.put("/api/conveyance/:id/reject", (req, res) => {
  const idx = conveyanceClaims.findIndex(c => c.id === parseInt(req.params.id));
  if (idx < 0) return res.status(404).json({ detail: "Not found" });
  conveyanceClaims[idx].status = "rejected";
  res.json(conveyanceClaims[idx]);
});

// ── HR: Attendance ────────────────────────────────────────────────────────────
app.post("/api/hr/attendance", (req, res) => {
  const auth = req.headers.authorization || "";
  const uid = parseInt(auth.replace("Bearer mock_token_", "")) || 2;
  const { user_id, date, status, notes } = req.body;
  const targetId = user_id || uid;
  const existing = attendanceRecords.findIndex(r => r.user_id === targetId && r.date === date);
  const target = users.find(u => u.id === targetId);
  const rec = { id: existing >= 0 ? attendanceRecords[existing].id : nextAttendanceId++, user_id: targetId, date, status, marked_by: uid, notes: notes || null, created_at: new Date().toISOString(), user_name: target?.name, user_employee_id: target?.employee_id };
  if (existing >= 0) attendanceRecords[existing] = rec;
  else attendanceRecords.push(rec);
  res.json(rec);
});

app.get("/api/hr/attendance/today", (req, res) => {
  const auth = req.headers.authorization || "";
  const uid = parseInt(auth.replace("Bearer mock_token_", "")) || 3;
  const today = new Date().toISOString().slice(0, 10);
  const rec = attendanceRecords.find(r => r.user_id === uid && r.date === today);
  res.json({ status: rec?.status || null, date: today });
});

app.get("/api/hr/attendance", (req, res) => {
  const auth = req.headers.authorization || "";
  const uid = parseInt(auth.replace("Bearer mock_token_", "")) || 2;
  const me = users.find(u => u.id === uid) || users[1];
  const { user_id, month, year } = req.query;
  const m = parseInt(month) || (new Date().getMonth() + 1);
  const y = parseInt(year) || new Date().getFullYear();
  let list = attendanceRecords.filter(r => {
    const d = new Date(r.date);
    return d.getMonth() + 1 === m && d.getFullYear() === y;
  });
  if (me.role === "technician") list = list.filter(r => r.user_id === uid);
  else if (user_id) list = list.filter(r => r.user_id === parseInt(user_id));
  res.json(list);
});

// ── HR: Holidays ──────────────────────────────────────────────────────────────
app.get("/api/hr/holidays", (req, res) => {
  const { year, month } = req.query;
  let list = holidays;
  if (year)  list = list.filter(h => h.date.startsWith(year));
  if (month) list = list.filter(h => parseInt(h.date.split("-")[1]) === parseInt(month));
  res.json(list.sort((a, b) => a.date.localeCompare(b.date)));
});

app.post("/api/hr/holidays", (req, res) => {
  const { date, name } = req.body;
  if (holidays.find(h => h.date === date)) return res.status(400).json({ detail: "Holiday already declared for this date" });
  const auth = req.headers.authorization || "";
  const uid = parseInt(auth.replace("Bearer mock_token_", "")) || 1;
  const h = { id: nextHolidayId++, date, name, created_by: uid, created_at: new Date().toISOString() };
  holidays.push(h);
  res.json(h);
});

app.delete("/api/hr/holidays/:id", (req, res) => {
  const idx = holidays.findIndex(h => h.id === parseInt(req.params.id));
  if (idx < 0) return res.status(404).json({ detail: "Not found" });
  holidays.splice(idx, 1);
  res.json({ detail: "deleted" });
});

// ── HR: Payroll ───────────────────────────────────────────────────────────────
app.get("/api/hr/payroll", (req, res) => {
  const { month, year } = req.query;
  const m = parseInt(month) || (new Date().getMonth() + 1);
  const y = parseInt(year) || new Date().getFullYear();
  const daysInMonth = new Date(y, m, 0).getDate();
  const monthHolidays = holidays.filter(h => parseInt(h.date.split("-")[1]) === m && h.date.startsWith(String(y)));
  const holidayDates = new Set(monthHolidays.map(h => h.date));

  let effectiveDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = new Date(ds).getDay();
    if (dow !== 0 && !holidayDates.has(ds)) effectiveDays++;
  }

  const staff = users.filter(u => ATTENDANCE_ROLES.includes(u.role) && u.is_active);
  const result = staff.map(u => {
    const recs = attendanceRecords.filter(r => {
      const d = new Date(r.date);
      return r.user_id === u.id && d.getMonth() + 1 === m && d.getFullYear() === y;
    });
    const present = recs.filter(r => r.status === "present").length;
    const leave   = recs.filter(r => r.status === "leave").length;
    const absent  = recs.filter(r => r.status === "absent").length;
    const salary  = u.monthly_salary || 0;
    const payable = effectiveDays > 0 ? Math.round((present / effectiveDays) * salary) : 0;
    return { user_id: u.id, employee_id: u.employee_id, name: u.name, role: u.role, monthly_salary: salary, effective_days: effectiveDays, present_days: present, leave_days: leave, absent_days: absent, payable_amount: payable };
  });

  res.json({ effective_days: effectiveDays, holidays: monthHolidays.map(h => ({ date: h.date, name: h.name })), staff: result });
});

app.put("/api/hr/payroll/:id/salary", (req, res) => {
  const idx = users.findIndex(u => u.id === parseInt(req.params.id));
  if (idx < 0) return res.status(404).json({ detail: "Not found" });
  users[idx].monthly_salary = req.body.monthly_salary;
  res.json({ user_id: users[idx].id, monthly_salary: users[idx].monthly_salary });
});

// ── Uploads stub ──────────────────────────────────────────────────────────────
app.get("/uploads/*path", (req, res) => res.json({ message: "PDF would be served here" }));

app.listen(8000, () => console.log("🐛 Mock API running on http://localhost:8000"));
