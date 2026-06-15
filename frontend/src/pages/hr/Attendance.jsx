import { useState, useEffect, useRef } from "react";
import { format, getDaysInMonth, parseISO } from "date-fns";
import { getUsers } from "../../api/users";
import { getAttendance, markAttendance, getHolidays, createHoliday, deleteHoliday } from "../../api/hr";
import { useAuth } from "../../context/AuthContext";
import { ChevronLeft, ChevronRight, Plus, Trash2, CalendarOff } from "lucide-react";
import LoadingSpinner from "../../components/LoadingSpinner";

const STATUS = {
  present: { label: "P", full: "Present", cell: "bg-green-500 text-white", btn: "bg-green-500 text-white border-green-500", ghost: "border-gray-200 text-gray-400 hover:border-green-400 hover:text-green-600" },
  leave:   { label: "L", full: "Leave",   cell: "bg-blue-400 text-white",  btn: "bg-blue-400 text-white border-blue-400",  ghost: "border-gray-200 text-gray-400 hover:border-blue-400 hover:text-blue-600" },
  absent:  { label: "A", full: "Absent",  cell: "bg-red-400 text-white",   btn: "bg-red-400 text-white border-red-400",   ghost: "border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-500" },
};

const ATTENDANCE_ROLES = ["technician", "support_staff"];

export default function Attendance() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());
  const [tab, setTab]     = useState("today"); // "today" | "monthly"

  const [staff, setStaff]     = useState([]);
  const [records, setRecords] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState({});

  // holiday form
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [hDate, setHDate] = useState(format(now, "yyyy-MM-dd"));
  const [hName, setHName] = useState("");
  const [savingHoliday, setSavingHoliday] = useState(false);

  // monthly grid: active cell picker
  const [activePicker, setActivePicker] = useState(null); // "userId-day"
  const pickerRef = useRef(null);

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const today = format(now, "yyyy-MM-dd");
  const isCurrentMonth = month === now.getMonth() + 1 && year === now.getFullYear();

  const holidayDates = new Set(holidays.map(h => h.date));

  const load = async () => {
    setLoading(true);
    try {
      const [allUsers, attRecords, hols] = await Promise.all([
        getUsers(),
        getAttendance({ month, year }),
        getHolidays({ month, year }),
      ]);
      setStaff(allUsers.filter(u => ATTENDANCE_ROLES.includes(u.role) && u.is_active));
      setRecords(attRecords);
      setHolidays(hols);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year]);

  // Close picker when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setActivePicker(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getRecord = (userId, dateStr) => records.find(r => r.user_id === userId && r.date === dateStr);

  const handleMark = async (staffMember, dateStr, status) => {
    const key = `${staffMember.id}-${dateStr}`;
    setSaving(s => ({ ...s, [key]: true }));
    setActivePicker(null);
    try {
      const rec = await markAttendance({ user_id: staffMember.id, date: dateStr, status });
      setRecords(prev => {
        const idx = prev.findIndex(r => r.user_id === staffMember.id && r.date === dateStr);
        if (idx >= 0) { const u = [...prev]; u[idx] = rec; return u; }
        return [...prev, rec];
      });
    } catch { alert("Failed to mark attendance"); }
    finally { setSaving(s => ({ ...s, [key]: false })); }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!hName.trim()) return;
    setSavingHoliday(true);
    try {
      const h = await createHoliday({ date: hDate, name: hName.trim() });
      setHolidays(prev => [...prev, h].sort((a, b) => a.date.localeCompare(b.date)));
      setHName(""); setShowHolidayForm(false);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to add holiday");
    } finally { setSavingHoliday(false); }
  };

  const handleDeleteHoliday = async (id) => {
    await deleteHoliday(id);
    setHolidays(prev => prev.filter(h => h.id !== id));
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const monthLabel = format(new Date(year, month - 1), "MMMM yyyy");

  const summaryFor = (userId) => {
    const ur = records.filter(r => r.user_id === userId);
    return { present: ur.filter(r => r.status === "present").length, leave: ur.filter(r => r.status === "leave").length, absent: ur.filter(r => r.status === "absent").length };
  };

  // Effective working days = Mon–Sat minus holidays
  const effectiveDays = (() => {
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dow = new Date(ds).getDay();
      if (dow !== 0 && !holidayDates.has(ds)) count++;
    }
    return count;
  })();

  // ── Today Tab ────────────────────────────────────────────────────────────────
  const TodayView = () => (
    <div className="space-y-3">
      {staff.length === 0 && (
        <div className="bg-white rounded-xl p-8 text-center text-gray-400 text-sm border">No staff found.</div>
      )}
      {staff.map(member => {
        const rec = getRecord(member.id, today);
        const key = `${member.id}-${today}`;
        const isSaving = saving[key];
        return (
          <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {member.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm">{member.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{member.employee_id} · <span className="capitalize">{member.role.replace("_", " ")}</span></p>
                </div>
              </div>
              {rec && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS[rec.status].btn}`}>
                  {STATUS[rec.status].full}
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(STATUS).map(([s, cfg]) => (
                <button
                  key={s}
                  disabled={isSaving}
                  onClick={() => handleMark(member, today, s)}
                  className={`py-2 rounded-xl text-xs font-bold border-2 transition-all disabled:opacity-40
                    ${rec?.status === s ? cfg.btn : cfg.ghost}`}
                >
                  {cfg.full}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ── Monthly Tab ───────────────────────────────────────────────────────────────
  const MonthlyView = () => (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="bg-white rounded-xl border p-3 flex gap-4 text-xs">
        <div><span className="font-bold text-gray-700">{daysInMonth}</span> <span className="text-gray-400">calendar days</span></div>
        <div><span className="font-bold text-red-400">{holidays.length}</span> <span className="text-gray-400">holiday{holidays.length !== 1 ? "s" : ""}</span></div>
        <div><span className="font-bold text-brand-700">{effectiveDays}</span> <span className="text-gray-400">effective days</span></div>
      </div>

      {staff.map(member => {
        const summary = summaryFor(member.id);
        return (
          <div key={member.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-xs">{member.name[0]}</div>
                <div>
                  <p className="text-sm font-semibold">{member.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{member.employee_id}</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs">
                {[["P", summary.present, "text-green-600"], ["L", summary.leave, "text-blue-500"], ["A", summary.absent, "text-red-400"]].map(([l, v, c]) => (
                  <div key={l} className="text-center">
                    <p className={`font-bold ${c}`}>{v}</p>
                    <p className="text-gray-400">{l}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 flex flex-wrap gap-1">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const ds = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dow = new Date(ds).getDay();
                const isSunday = dow === 0;
                const isHoliday = holidayDates.has(ds);
                const isFuture = ds > today;
                const rec = getRecord(member.id, ds);
                const key = `${member.id}-${ds}`;
                const pickerKey = `${member.id}-${day}`;
                const isSaving = saving[key];
                const canEdit = !isSunday && !isHoliday && !isFuture && !isSaving;

                return (
                  <div key={day} className="relative flex flex-col items-center" style={{ width: 28 }}>
                    <span className={`text-[9px] mb-0.5 ${ds === today ? "font-bold text-brand-700" : "text-gray-300"}`}>{day}</span>
                    <button
                      disabled={!canEdit}
                      onClick={() => canEdit && setActivePicker(activePicker === pickerKey ? null : pickerKey)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center border transition-all
                        ${isSunday || isHoliday ? "bg-gray-100 text-gray-300 border-transparent cursor-default" :
                          isFuture ? "border-transparent cursor-default" :
                          rec ? `${STATUS[rec.status].cell} border-transparent` :
                          "border-gray-200 text-gray-300 hover:border-gray-400"}
                        ${isSaving ? "opacity-40" : ""}
                      `}
                    >
                      {isSunday ? "—" : isHoliday ? "H" : rec ? STATUS[rec.status].label : isFuture ? "" : "·"}
                    </button>

                    {activePicker === pickerKey && (
                      <div ref={pickerRef} className="absolute z-30 top-full mt-1 left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-xl border overflow-hidden" style={{ minWidth: 110 }}>
                        {Object.entries(STATUS).map(([s, cfg]) => (
                          <button key={s} onClick={() => handleMark(member, ds, s)}
                            className={`w-full px-3 py-2 text-xs text-left flex items-center gap-2 hover:bg-gray-50 ${rec?.status === s ? "font-bold" : ""}`}>
                            <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${cfg.cell}`}>{cfg.label}</span>
                            {cfg.full}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="flex gap-4 flex-wrap text-xs text-gray-400 pt-1 px-1">
        {Object.entries(STATUS).map(([, c]) => (
          <span key={c.full} className="flex items-center gap-1">
            <span className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center ${c.cell}`}>{c.label}</span>{c.full}
          </span>
        ))}
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gray-100 text-gray-300 text-[9px] font-bold flex items-center justify-center">H</span>Holiday</span>
        <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gray-100 text-gray-300 text-[9px] font-bold flex items-center justify-center">—</span>Sunday</span>
        <span className="text-gray-300">· = unmarked &nbsp;|&nbsp; click to mark</span>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-bold">Attendance</h1>
          <p className="text-xs text-gray-500">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 border rounded-lg hover:bg-gray-50"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold w-28 text-center">{monthLabel}</span>
          <button onClick={nextMonth} disabled={isCurrentMonth} className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[["today", "Today"], ["monthly", "Monthly"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === v ? "bg-white shadow text-brand-700" : "text-gray-500 hover:text-gray-700"}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Holidays section */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <CalendarOff size={16} className="text-gray-400" />
            <span className="text-sm font-semibold">Declared Holidays</span>
            {holidays.length > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{holidays.length}</span>}
          </div>
          <button onClick={() => setShowHolidayForm(v => !v)}
            className="flex items-center gap-1 text-xs text-brand-700 font-medium hover:bg-brand-50 px-2 py-1 rounded-lg">
            <Plus size={13} /> Add Holiday
          </button>
        </div>

        {showHolidayForm && (
          <form onSubmit={handleAddHoliday} className="px-4 py-3 bg-gray-50 border-b flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input type="date" value={hDate} onChange={e => setHDate(e.target.value)} required
                className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-gray-500 mb-1">Holiday Name</label>
              <input type="text" value={hName} onChange={e => setHName(e.target.value)} placeholder="e.g. Diwali" required
                className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
            <button type="submit" disabled={savingHoliday}
              className="bg-brand-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-60">
              {savingHoliday ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setShowHolidayForm(false)} className="px-3 py-1.5 border rounded-lg text-sm text-gray-500">Cancel</button>
          </form>
        )}

        {holidays.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-400">No holidays declared for {monthLabel}</p>
        ) : (
          <div className="divide-y">
            {holidays.map(h => (
              <div key={h.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-500">
                    {format(parseISO(h.date), "dd MMM")}
                  </span>
                  <span className="text-sm font-medium">{h.name}</span>
                  <span className="text-xs text-gray-400 capitalize">{format(parseISO(h.date), "EEEE")}</span>
                </div>
                <button onClick={() => handleDeleteHoliday(h.id)}
                  className="p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? <LoadingSpinner /> : tab === "today" ? <TodayView /> : <MonthlyView />}
    </div>
  );
}
