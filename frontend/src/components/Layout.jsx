import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Users, MapPin, Calendar, ClipboardList, LogOut,
  LayoutDashboard, Menu, X, UserCog, BarChart2, CalendarCheck, Banknote, PieChart,
} from "lucide-react";
import { useState } from "react";

const MANAGER_NAV = [
  { to: "/manager/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/manager/customers", icon: Users,           label: "Customers" },
  { to: "/manager/roster",    icon: Calendar,        label: "Roster" },
  { to: "/manager/map",       icon: MapPin,          label: "Live Map" },
  { to: "/manager/users",          icon: UserCog,        label: "Team" },
  { to: "/manager/hr/attendance",  icon: CalendarCheck,  label: "Attendance" },
  { to: "/manager/hr/payroll",     icon: Banknote,       label: "Payroll" },
  { to: "/manager/mis",            icon: PieChart,       label: "MIS" },
  { to: "/manager/reports",        icon: BarChart2,      label: "Reports" },
];

const TECH_NAV = [
  { to: "/technician/jobs", icon: ClipboardList, label: "My Jobs" },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();
  const [open, setOpen]  = useState(false);
  const isTech           = user?.role === "technician";
  const nav              = isTech ? TECH_NAV : MANAGER_NAV;

  const handleLogout = () => { logout(); navigate("/login"); };

  const isActive = (to) => location.pathname.startsWith(to);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ── Top bar ────────────────────────────────────────────────── */}
      <header className="bg-brand-700 text-white h-14 flex items-center px-4 sticky top-0 z-40 shadow-lg">
        {!isTech && (
          <button onClick={() => setOpen(!open)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 mr-2">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        <Link to={isTech ? "/technician/jobs" : "/manager/dashboard"}
          className="flex items-center gap-2.5 flex-1">
          <img src="/logo.png" alt="SM" className="h-11 w-11 object-contain" />
          <div className="hidden sm:block">
            <p className="text-sm font-bold leading-tight">Service Monks</p>
            <p className="text-[10px] text-brand-500 leading-tight">Integrated Solutions Private Limited</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-semibold text-white">{user?.name}</p>
            <p className="text-[10px] text-brand-500 font-mono">{user?.employee_id}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center text-brand-700 font-bold text-sm">
            {user?.name?.[0]}
          </div>
          <button onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-300 hover:text-white"
            title="Sign out">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Sidebar ───────────────────────────────────────────────── */}
        {!isTech && (
          <>
            {/* Mobile overlay */}
            {open && (
              <div className="fixed inset-0 bg-black/40 z-30 lg:hidden"
                onClick={() => setOpen(false)} />
            )}

            <aside className={`
              fixed top-14 left-0 bottom-0 z-30 w-60 bg-white border-r border-gray-100
              flex flex-col transition-transform duration-200 shadow-xl lg:shadow-none
              lg:static lg:translate-x-0 lg:flex
              ${open ? "translate-x-0" : "-translate-x-full"}
            `}>
              <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                {nav.map(({ to, icon: Icon, label }) => (
                  <Link key={to} to={to}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-150 group
                      ${isActive(to)
                        ? "bg-brand-700 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-brand-700"
                      }`}>
                    <Icon size={17} className={isActive(to) ? "text-brand-500" : "text-gray-400 group-hover:text-brand-500"} />
                    {label}
                    {isActive(to) && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500" />
                    )}
                  </Link>
                ))}
              </nav>

              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {user?.name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{user?.employee_id} · {user?.role}</p>
                  </div>
                </div>
              </div>
            </aside>
          </>
        )}

        {/* ── Main content ──────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto min-w-0 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* ── Bottom nav — technician mobile ────────────────────────── */}
      {isTech && (
        <nav className="fixed bottom-0 left-0 right-0 bg-brand-700 safe-bottom z-40 flex">
          {TECH_NAV.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to}
              className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors
                ${isActive(to) ? "text-brand-500" : "text-gray-400"}`}>
              <Icon size={22} />
              {label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
