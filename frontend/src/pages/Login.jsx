import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IdCard, Lock, ArrowRight } from "lucide-react";

const QUICK_LOGINS = [
  { label: "Admin",               empId: "SM001", role: "admin" },
  { label: "Manager",             empId: "SM002", role: "manager" },
  { label: "Technician — Suresh", empId: "SM003", role: "technician" },
];

const ROLE_PILL = {
  admin:      "bg-purple-100 text-purple-700",
  manager:    "bg-blue-100 text-blue-700",
  technician: "bg-yellow-100 text-yellow-800",
};

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [empId, setEmpId]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(empId, password);
      navigate(u.role === "technician" ? "/technician/jobs" : "/manager/dashboard");
    } catch {
      setError("Invalid Employee ID or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans">

      {/* ── Left branding panel ─────────────────────────────────── */}
      <div className="relative bg-[#1a1a1a] md:w-[46%] flex flex-col items-center justify-center
                      px-10 py-14 overflow-hidden select-none">

        {/* Yellow top stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#F5C800]" />

        {/* Decorative rings */}
        <div className="absolute -top-28 -right-28 w-72 h-72 rounded-full border-[32px] border-white/5" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full border-[24px] border-white/5" />
        <div className="absolute top-1/3 right-0 w-40 h-40 rounded-full border-[16px] border-[#F5C800]/10" />

        {/* Logo — transparent PNG on black background */}
        <div className="relative z-10 mb-8">
          <img src="/logo.png" alt="Service Monks"
            className="w-36 h-36 md:w-44 md:h-44 object-contain drop-shadow-2xl" />
        </div>

        {/* Company name */}
        <div className="relative z-10 text-center">
          <h1 className="text-white text-2xl md:text-3xl font-extrabold tracking-tight leading-snug">
            Service Monks
          </h1>
          <p className="text-[#F5C800] text-sm font-semibold tracking-wide mt-0.5">
            Integrated Solutions Private Limited
          </p>
          <div className="mt-3 w-12 h-0.5 bg-[#F5C800] mx-auto rounded-full" />
          <p className="text-gray-400 text-xs mt-3 leading-relaxed max-w-xs">
            Your Pest Management Partner
          </p>
        </div>

        {/* Feature bullets — desktop only */}
        <ul className="relative z-10 mt-10 space-y-3 hidden md:block">
          {[
            "Customer & Contract Management",
            "Service Roster & Scheduling",
            "Digital Completion Certificates",
            "Live Field Tracking",
            "Conveyance Management",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-gray-300 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F5C800] flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        {/* Bottom yellow stripe */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#F5C800]/30" />
      </div>

      {/* ── Right login panel ───────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 md:p-12">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-[#1a1a1a] tracking-tight">
              Sign In
            </h2>
            <p className="text-gray-500 text-sm mt-1.5">
              Enter your Employee ID to access the ERP
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Employee ID */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Employee ID
              </label>
              <div className="relative">
                <IdCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value.toUpperCase())}
                  placeholder="e.g. SM001"
                  autoComplete="username"
                  className="w-full border-2 border-gray-200 rounded-2xl pl-11 pr-4 py-3.5
                    text-sm font-mono tracking-widest uppercase bg-white
                    focus:outline-none focus:border-[#F5C800] focus:ring-4 focus:ring-[#F5C800]/20
                    transition-all placeholder:normal-case placeholder:tracking-normal placeholder:font-sans"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full border-2 border-gray-200 rounded-2xl pl-11 pr-4 py-3.5
                    text-sm bg-white
                    focus:outline-none focus:border-[#F5C800] focus:ring-4 focus:ring-[#F5C800]/20
                    transition-all"
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200
                rounded-2xl px-4 py-3 text-sm text-red-700">
                <span className="mt-0.5">⚠</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1a1a1a] hover:bg-[#F5C800] hover:text-[#1a1a1a]
                text-white font-bold py-4 rounded-2xl text-sm
                transition-all duration-200 flex items-center justify-center gap-2
                disabled:opacity-50 group shadow-lg shadow-black/10"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" /></>
              )}
            </button>
          </form>

          {/* Quick logins (dev/demo) */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
              Demo accounts
            </p>
            <div className="space-y-2">
              {QUICK_LOGINS.map(({ label, empId: id, role }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setEmpId(id); setPassword("demo"); }}
                  className="w-full flex items-center justify-between px-4 py-3 border-2 border-gray-100
                    rounded-2xl hover:border-[#F5C800] hover:bg-[#F5C800]/5
                    transition-all group cursor-pointer"
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-[#1a1a1a]">
                      {label}
                    </p>
                    <p className="text-xs font-mono text-gray-400">{id}</p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${ROLE_PILL[role]}`}>
                    {role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} Service Monks Integrated Solutions Private Limited
          </p>
        </div>
      </div>
    </div>
  );
}
