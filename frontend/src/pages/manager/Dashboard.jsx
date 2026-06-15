import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { getJobs } from "../../api/jobs";
import { getCustomers } from "../../api/customers";
import {
  Users, CalendarCheck, Clock, CheckCircle,
  ChevronRight, TrendingUp, ArrowRight,
} from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import LoadingSpinner from "../../components/LoadingSpinner";

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${accent}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 font-medium mt-0.5">{label}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [jobs, setJobs]               = useState([]);
  const [allJobs, setAllJobs]         = useState([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      getJobs({ scheduled_date: today }),
      getJobs(),
      getCustomers(),
    ]).then(([tj, aj, c]) => {
      setJobs(tj);
      setAllJobs(aj);
      setCustomerCount(c.length);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const completed   = jobs.filter((j) => j.status === "completed").length;
  const inProgress  = jobs.filter((j) => j.status === "in_progress").length;
  const scheduled   = jobs.filter((j) => j.status === "scheduled").length;
  const totalDone   = allJobs.filter((j) => j.status === "completed").length;
  const rate        = allJobs.length ? Math.round((totalDone / allJobs.length) * 100) : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {format(new Date(), "EEEE, dd MMMM yyyy")}
          </p>
        </div>
        <Link to="/manager/roster"
          className="hidden sm:flex items-center gap-1.5 bg-brand-700 hover:bg-brand-900 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <CalendarCheck size={15} /> Schedule Job
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={Users}       label="Total Customers" value={customerCount} accent="bg-blue-500"   />
        <StatCard icon={CalendarCheck} label="Today's Jobs"  value={jobs.length}   accent="bg-brand-700"  />
        <StatCard icon={CheckCircle} label="Completed Today" value={completed}      accent="bg-amber-500"  />
        <StatCard icon={TrendingUp}  label="Completion Rate" value={`${rate}%`}     accent="bg-orange-400" />
      </div>

      {/* Today's status breakdown */}
      {jobs.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Scheduled",   count: scheduled,  color: "bg-blue-100 text-blue-700" },
            { label: "In Progress", count: inProgress, color: "bg-yellow-100 text-yellow-700" },
            { label: "Completed",   count: completed,  color: "bg-amber-100 text-amber-800" },
          ].map(({ label, count, color }) => (
            <div key={label} className={`rounded-xl px-4 py-3 text-center ${color}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Today's roster */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Today's Roster</h2>
          <Link to="/manager/roster"
            className="text-sm text-brand-700 font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-gray-200">
            <CalendarCheck size={36} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400 text-sm">No jobs scheduled for today</p>
            <Link to="/manager/roster"
              className="mt-3 inline-flex items-center gap-1 text-brand-700 text-sm font-medium">
              Schedule one <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Customer</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Service</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Technician</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 font-medium">{job.customer?.name}</td>
                      <td className="px-5 py-3.5 text-gray-600">{job.service_type?.name}</td>
                      <td className="px-5 py-3.5 text-gray-600">{job.technician?.name || <span className="text-gray-300">Unassigned</span>}</td>
                      <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">{job.scheduled_time?.slice(0,5) || "—"}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={job.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-2">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm">{job.customer?.name}</p>
                      <p className="text-xs text-gray-500">{job.service_type?.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {job.technician?.name || "Unassigned"}
                        {job.scheduled_time && ` · ${job.scheduled_time.slice(0,5)}`}
                      </p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
