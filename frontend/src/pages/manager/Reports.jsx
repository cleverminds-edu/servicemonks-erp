import { useState, useEffect } from "react";
import { getJobs } from "../../api/jobs";
import { getCustomers } from "../../api/customers";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { BarChart2, TrendingUp, CheckCircle, Clock, XCircle, Download } from "lucide-react";
import LoadingSpinner from "../../components/LoadingSpinner";
import StatusBadge from "../../components/StatusBadge";

const CATEGORY_COLORS = {
  "Rodent & Pest Control": "bg-orange-400",
  "Vector-Borne Disease Management": "bg-blue-400",
  "Structural & Property Protection": "bg-purple-400",
  "Specialized Treatments": "bg-amber-400",
};

export default function Reports() {
  const [jobs, setJobs] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");

  useEffect(() => {
    Promise.all([getJobs(), getCustomers()])
      .then(([j, c]) => { setJobs(j); setCustomers(c); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const now = new Date();
  const filtered = jobs.filter((j) => {
    const d = new Date(j.scheduled_date);
    if (range === "week")  return d >= subDays(now, 7);
    if (range === "month") return d >= startOfMonth(now) && d <= endOfMonth(now);
    return true;
  });

  const byStatus = {
    completed:   filtered.filter((j) => j.status === "completed").length,
    in_progress: filtered.filter((j) => j.status === "in_progress").length,
    scheduled:   filtered.filter((j) => j.status === "scheduled").length,
    cancelled:   filtered.filter((j) => j.status === "cancelled").length,
  };

  const byService = filtered.reduce((acc, j) => {
    const name = j.service_type?.name || "Unknown";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const bySector = customers.reduce((acc, c) => {
    acc[c.sector] = (acc[c.sector] || 0) + 1;
    return acc;
  }, {});

  const completionRate = filtered.length
    ? Math.round((byStatus.completed / filtered.length) * 100)
    : 0;

  const topServices = Object.entries(byService).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxCount = topServices[0]?.[1] || 1;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Reports</h1>
        <div className="flex bg-gray-100 rounded-lg p-0.5">
          {["week","month","all"].map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors
                ${range === r ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
              {r === "all" ? "All Time" : `This ${r}`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <BarChart2 size={16} className="text-brand-600" />
            <p className="text-xs text-gray-500">Total Jobs</p>
          </div>
          <p className="text-3xl font-bold">{filtered.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-[#F5C800]" />
            <p className="text-xs text-gray-500">Completion Rate</p>
          </div>
          <p className="text-3xl font-bold text-[#1a1a1a]">{completionRate}%</p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-sm mb-3">Job Status Breakdown</h2>
        <div className="space-y-2.5">
          {[
            { key: "completed",   label: "Completed",   icon: CheckCircle, color: "bg-amber-400" },
            { key: "in_progress", label: "In Progress", icon: Clock,       color: "bg-yellow-400" },
            { key: "scheduled",   label: "Scheduled",   icon: Clock,       color: "bg-blue-400" },
            { key: "cancelled",   label: "Cancelled",   icon: XCircle,     color: "bg-red-400" },
          ].map(({ key, label, color }) => {
            const count = byStatus[key];
            const pct = filtered.length ? Math.round((count / filtered.length) * 100) : 0;
            return (
              <div key={key}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{label}</span>
                  <span className="font-semibold">{count} ({pct}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top services */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-sm mb-3">Services Performed</h2>
        <div className="space-y-2">
          {topServices.map(([name, count]) => (
            <div key={name}>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span className="truncate pr-2">{name}</span>
                <span className="font-semibold flex-shrink-0">{count}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-brand-600 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Customer sectors */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-sm mb-3">Customer Sectors ({customers.length} total)</h2>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(bySector).map(([sector, count]) => (
            <div key={sector} className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-brand-700">{count}</p>
              <p className="text-xs text-gray-500 capitalize mt-1">{sector}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent completed jobs */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <h2 className="font-semibold text-sm mb-3">Recent Completed Jobs</h2>
        <div className="space-y-2">
          {filtered.filter(j => j.status === "completed").slice(0, 5).map((job) => (
            <div key={job.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{job.customer?.name}</p>
                <p className="text-xs text-gray-400">{job.service_type?.name} · {job.technician?.name}</p>
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                {format(new Date(job.scheduled_date), "dd MMM")}
              </p>
            </div>
          ))}
          {filtered.filter(j => j.status === "completed").length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No completed jobs in this period</p>
          )}
        </div>
      </div>
    </div>
  );
}
