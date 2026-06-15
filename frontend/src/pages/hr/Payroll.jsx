import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { getPayroll, updateSalary } from "../../api/hr";
import { useAuth } from "../../context/AuthContext";
import { Edit2, Check, X, Info } from "lucide-react";
import LoadingSpinner from "../../components/LoadingSpinner";

const ROLE_COLORS = {
  technician:    "bg-yellow-100 text-yellow-800",
  support_staff: "bg-purple-100 text-purple-700",
};

export default function Payroll() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingSalary, setEditingSalary] = useState(null);
  const [salaryInput, setSalaryInput]     = useState("");
  const [savingSalary, setSavingSalary]   = useState(false);
  const [showHolidays, setShowHolidays]   = useState(false);

  const monthLabel = format(new Date(year, month - 1), "MMMM yyyy");
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: format(new Date(2000, i), "MMMM") }));
  const years  = [now.getFullYear() - 1, now.getFullYear()];

  const load = async () => {
    setLoading(true);
    try { setData(await getPayroll({ month, year })); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [month, year]);

  const rows      = data?.staff || [];
  const holidays  = data?.holidays || [];
  const effectiveDays = data?.effective_days ?? 0;

  const handleSaveSalary = async (userId) => {
    const val = parseInt(salaryInput);
    if (isNaN(val) || val < 0) return;
    setSavingSalary(true);
    try {
      await updateSalary(userId, val);
      setData(d => ({ ...d, staff: d.staff.map(r => r.user_id === userId ? { ...r, monthly_salary: val } : r) }));
      setEditingSalary(null);
    } catch { alert("Failed to update salary"); }
    finally { setSavingSalary(false); }
  };

  const totalPayable = rows.reduce((s, r) => s + r.payable_amount, 0);

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Payroll</h1>
          <p className="text-xs text-gray-500">Present days ÷ Effective days × Monthly salary</p>
        </div>
        <div className="flex gap-2">
          <select value={month} onChange={e => setMonth(Number(e.target.value))}
            className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={year} onChange={e => setYear(Number(e.target.value))}
            className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl shadow-sm border p-3 text-center">
            <p className="text-lg font-bold text-brand-700">₹{totalPayable.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p>
            <p className="text-xs text-gray-400">Total Payable</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-3 text-center">
            <p className="text-lg font-bold text-gray-700">{effectiveDays}</p>
            <p className="text-xs text-gray-400">Effective Days</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-3 text-center">
            <button onClick={() => setShowHolidays(v => !v)} className="w-full">
              <p className="text-lg font-bold text-red-500">{holidays.length}</p>
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                Holidays <Info size={10} />
              </p>
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-3 text-center">
            <p className="text-lg font-bold text-gray-700">{rows.length}</p>
            <p className="text-xs text-gray-400">Employees</p>
          </div>
        </div>
      )}

      {/* Holiday breakdown */}
      {showHolidays && holidays.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-red-600 mb-2">Holidays excluded from {monthLabel}</p>
          <div className="flex flex-wrap gap-2">
            {holidays.map(h => (
              <span key={h.date} className="text-xs bg-white border border-red-200 text-red-700 px-2 py-1 rounded-lg">
                {format(parseISO(h.date), "dd MMM")} — {h.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Calculation note */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-xs text-blue-700">
        <strong>Formula:</strong> Payable = (Present Days ÷ {effectiveDays || "—"} effective days) × Monthly Salary &nbsp;|&nbsp;
        Effective days = Mon–Sat minus {holidays.length} declared holiday{holidays.length !== 1 ? "s" : ""}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {["Employee", "Role", "Salary / mo", "Effective Days", "Present", "Leave", "Absent", "Payable Amount"].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(row => (
                  <tr key={row.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3">
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{row.employee_id}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_COLORS[row.role] || "bg-gray-100 text-gray-600"}`}>
                        {row.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {editingSalary === row.user_id ? (
                        <div className="flex items-center gap-1">
                          <input type="number" value={salaryInput} onChange={e => setSalaryInput(e.target.value)}
                            className="w-24 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500" autoFocus />
                          <button onClick={() => handleSaveSalary(row.user_id)} disabled={savingSalary} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check size={13} /></button>
                          <button onClick={() => setEditingSalary(null)} className="p-1 text-red-400 hover:bg-red-50 rounded"><X size={13} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span>{row.monthly_salary ? `₹${row.monthly_salary.toLocaleString("en-IN")}` : <span className="text-gray-300">—</span>}</span>
                          {isAdmin && (
                            <button onClick={() => { setEditingSalary(row.user_id); setSalaryInput(row.monthly_salary || ""); }}
                              className="p-1 text-gray-400 hover:text-brand-700 hover:bg-gray-100 rounded">
                              <Edit2 size={11} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center font-medium">{effectiveDays}</td>
                    <td className="px-3 py-3 text-center text-green-600 font-medium">{row.present_days}</td>
                    <td className="px-3 py-3 text-center text-blue-500">{row.leave_days}</td>
                    <td className="px-3 py-3 text-center text-red-400">{row.absent_days}</td>
                    <td className="px-3 py-3 font-bold text-brand-700">
                      {row.monthly_salary
                        ? `₹${row.payable_amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
                        : <span className="text-gray-300 font-normal text-xs">Set salary first</span>
                      }
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400 text-sm">No staff records for {monthLabel}</td></tr>
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot className="bg-gray-50 border-t">
                  <tr>
                    <td colSpan={7} className="px-3 py-2.5 text-sm font-semibold text-right text-gray-600">Total Payable</td>
                    <td className="px-3 py-2.5 font-bold text-brand-700">₹{totalPayable.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
