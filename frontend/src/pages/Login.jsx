import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { IdCard, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import Modal from "../components/Modal";
import { changePassword, markAttendance } from "../api/auth";
import client from "../api/client";

function PasswordChangeModal({ user, onSuccess }) {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const captureLocation = async () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await client.post("/hr/attendance/location", {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            } catch {
              // Silent fail for location update
            }
            resolve();
          },
          () => resolve() // Silent fail for geolocation error
        );
      } else {
        resolve();
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPass !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (newPass.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await changePassword(current, newPass);

      // Mark attendance and capture location in background
      markAttendance();
      captureLocation();

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Change Your Password" onClose={() => {}}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-sm text-gray-600 mb-4">
          Welcome {user.name}! Please change your password before continuing.
        </p>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
          <input type="password" required value={current} onChange={(e) => setCurrent(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
          <input type="password" required value={newPass} onChange={(e) => setNewPass(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-brand-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">
          {loading ? "Changing..." : "Change Password"}
        </button>
      </form>
    </Modal>
  );
}

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [empId, setEmpId]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [loginUser, setLoginUser] = useState(null);

  const captureLocation = async () => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              await client.post("/hr/attendance/location", {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            } catch {
              // Silent fail for location update
            }
            resolve();
          },
          () => resolve() // Silent fail for geolocation error
        );
      } else {
        resolve();
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    console.log("Login attempt:", empId);
    try {
      console.log("Calling login API...");
      const u = await login(empId, password);
      console.log("Login successful:", u);

      // Mark attendance and capture location in background
      markAttendance().catch(err => console.log("Attendance error:", err));
      captureLocation().catch(err => console.log("Location error:", err));

      if (!u.password_changed) {
        setLoginUser(u);
        setNeedsPasswordChange(true);
      } else {
        const dashboardUrl = u.role === "technician" ? "/technician/jobs" : "/manager/dashboard";
        navigate(dashboardUrl);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.detail || err.message || "Invalid Employee ID or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (needsPasswordChange && loginUser) {
    return (
      <PasswordChangeModal
        user={loginUser}
        onSuccess={() => {
          const updated = { ...loginUser, password_changed: true };
          localStorage.setItem("user", JSON.stringify(updated));
          navigate(loginUser.role === "technician" ? "/technician/jobs" : "/manager/dashboard");
        }}
      />
    );
  }

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
                  placeholder="e.g. SM000"
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
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full border-2 border-gray-200 rounded-2xl pl-11 pr-11 py-3.5
                    text-sm bg-white
                    focus:outline-none focus:border-[#F5C800] focus:ring-4 focus:ring-[#F5C800]/20
                    transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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

          <p className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} Service Monks Integrated Solutions Private Limited
          </p>
        </div>
      </div>
    </div>
  );
}
