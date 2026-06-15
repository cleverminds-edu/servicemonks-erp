import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { getCustomers } from "../../api/customers";
import { getContracts } from "../../api/services";
import { getJobs } from "../../api/jobs";
import {
  Users, FileText, CheckCircle, TrendingUp,
  IndianRupee, AlertCircle, ChevronDown, ChevronUp, Building2,
} from "lucide-react";
import LoadingSpinner from "../../components/LoadingSpinner";

const SECTOR_COLORS = {
  residential: "bg-blue-100 text-blue-700",
  commercial:  "bg-purple-100 text-purple-700",
  healthcare:  "bg-red-100 text-red-700",
  industrial:  "bg-orange-100 text-orange-700",
};

const RANGES = [
  { key: "month",   label: "This Month" },
  { key: "last",    label: "Last Month" },
  { key: "quarter", label: "This Quarter" },
  { key: "year",    label: "This Year" },
  { key: "all",     label: "All Time" },
];

function dateRange(key) {
  const now = new Date();
  if (key === "month")   return [startOfMonth(now), endOfMonth(now)];
  if (key === "last")    return [startOfMonth(subMonths(now, 1)), endOfMonth(subMonths(now, 1))];
  if (key === "quarter") {
    const q = Math.floor(now.getMonth() / 3);
    return [new Date(now.getFullYear(), q * 3, 1), new Date(now.getFullYear(), q * 3 + 3, 0)];
  }
  if (key === "year") return [startOfYear(now), now];
  return [new Date("2000-01-01"), now];
}

function HeroCard({ icon: Icon, label, value, sub, color = "text-brand-700", bg = "bg-brand-50" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`${bg} rounded-xl p-3 flex-shrink-0`}>
        <Icon size={22} className={color} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function MIS() {
  const [customers, setCustomers]   = useState([]);
  const [contracts, setContracts]   = useState([]);
  const [jobs, setJobs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [range, setRange]           = useState("month");
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy, setSortBy]         = useState("value"); // "value" | "jobs" | "name"

  useEffect(() => {
    Promise.all([getCustomers(), getContracts(), getJobs()])
      .then(([c, ct, j]) => { setCustomers(c); setContracts(ct); setJobs(j); })
      .finally(() => setLoading(false));
  }, []);

  const [from, to] = dateRange(range);

  const filteredJobs = jobs.filter(j => {
    const d = new Date(j.scheduled_date);
    return d >= from && d <= to;
  });

  // ── Hero metrics ─────────────────────────────────────────────────────────────
  const activeCustomers   = customers.filter(c => c.is_active).length;
  const activeContracts   = contracts.filter(c => c.is_active);
  const totalContractValue = activeContracts.reduce((s, c) => s + (c.contract_value || 0), 0);
  const completedJobs     = filteredJobs.filter(j => j.status === "completed");
  const pendingJobs       = filteredJobs.filter(j => ["scheduled", "in_progress"].includes(j.status));
  const completionRate    = filteredJobs.length
    ? Math.round((completedJobs.length / filteredJobs.length) * 100) : 0;
  const avgJobsPerCustomer = activeCustomers
    ? (filteredJobs.length / activeCustomers).toFixed(1) : 0;

  // ── Customer-wise data ────────────────────────────────────────────────────────
  const customerRows = customers
    .filter(c => c.is_active)
    .map(c => {
      const cContracts  = contracts.filter(ct => ct.customer_id === c.id && ct.is_active);
      const cJobs       = filteredJobs.filter(j => j.customer_id === c.id);
      const cCompleted  = cJobs.filter(j => j.status === "completed");
      const cPending    = cJobs.filter(j => ["scheduled", "in_progress"].includes(j.status));
      const contractVal = cContracts.reduce((s, ct) => s + (ct.contract_value || 0), 0);
      const lastJob     = [...cJobs].filter(j => j.status === "completed")
        .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))[0];
      const techs = [...new Set(cJobs.map(j => j.technician?.name).filter(Boolean))];
      const services = [...new Set(cContracts.map(ct => ct.service_type?.name).filter(Boolean))];
      const rate = cJobs.length ? Math.round((cCompleted.length / cJobs.length) * 100) : null;

      return {
        ...c,
        contracts:    cContracts,
        contractVal,
        totalJobs:    cJobs.length,
        completed:    cCompleted.length,
        pending:      cPending.length,
        rate,
        lastService:  lastJob ? lastJob.scheduled_date : null,
        technicians:  techs,
        services,
      };
    })
    .sort((a, b) => {
      if (sortBy === "value") return b.contractVal - a.contractVal;
      if (sortBy === "jobs")  return b.totalJobs - a.totalJobs;
      return a.name.localeCompare(b.name);
    });

  const maxVal = Math.max(...customerRows.map(r => r.contractVal), 1);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">MIS Reports</h1>
          <p className="text-sm text-gray-400">Management Information Summary</p>
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
          {RANGES.map(r => (
            <button key={r.key} onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${range === r.key ? "bg-white shadow text-brand-700" : "text-gray-500 hover:text-gray-700"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <HeroCard
          icon={Users} label="Active Customers" value={activeCustomers}
          sub={`${activeContracts.length} active contracts`}
          color="text-brand-700" bg="bg-brand-50"
        />
        <HeroCard
          icon={IndianRupee} label="Total Contract Value"
          value={`₹${(totalContractValue / 1000).toFixed(0)}K`}
          sub="across all active contracts"
          color="text-green-700" bg="bg-green-50"
        />
        <HeroCard
          icon={CheckCircle} label="Jobs Completed"
          value={completedJobs.length}
          sub={`${completionRate}% completion rate`}
          color="text-emerald-600" bg="bg-emerald-50"
        />
        <HeroCard
          icon={AlertCircle} label="Pending Jobs"
          value={pendingJobs.length}
          sub="scheduled + in progress"
          color="text-orange-600" bg="bg-orange-50"
        />
        <HeroCard
          icon={TrendingUp} label="Total Jobs"
          value={filteredJobs.length}
          sub={`~${avgJobsPerCustomer} per customer`}
          color="text-purple-600" bg="bg-purple-50"
        />
        <HeroCard
          icon={FileText} label="Active Contracts"
          value={activeContracts.length}
          sub={`${customers.length} total customers`}
          color="text-blue-600" bg="bg-blue-50"
        />
      </div>

      {/* Customer-wise section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-gray-400" />
            <h2 className="font-bold text-sm">Customer-wise Breakdown</h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{customerRows.length}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Sort by</span>
            {[["value", "Contract Value"], ["jobs", "Jobs"], ["name", "Name"]].map(([k, l]) => (
              <button key={k} onClick={() => setSortBy(k)}
                className={`px-2.5 py-1 rounded-lg border transition-all
                  ${sortBy === k ? "bg-brand-700 text-white border-brand-700" : "border-gray-200 hover:border-gray-300"}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {customerRows.map(row => (
            <div key={row.id}>
              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setExpandedId(expandedId === row.id ? null : row.id)}
              >
                {/* Customer info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm truncate">{row.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize flex-shrink-0 ${SECTOR_COLORS[row.sector] || "bg-gray-100 text-gray-600"}`}>
                      {row.sector}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{row.city} · {row.contact_person}</p>
                </div>

                {/* Contract value bar */}
                <div className="hidden sm:block w-32">
                  <p className="text-xs font-bold text-green-700 mb-1">
                    ₹{(row.contractVal / 1000).toFixed(0)}K
                  </p>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full"
                      style={{ width: `${(row.contractVal / maxVal) * 100}%` }} />
                  </div>
                </div>

                {/* Stats chips */}
                <div className="flex gap-2 flex-shrink-0">
                  <div className="text-center min-w-[36px]">
                    <p className="text-sm font-bold text-green-600">{row.completed}</p>
                    <p className="text-[10px] text-gray-400">Done</p>
                  </div>
                  <div className="text-center min-w-[36px]">
                    <p className="text-sm font-bold text-orange-500">{row.pending}</p>
                    <p className="text-[10px] text-gray-400">Pending</p>
                  </div>
                  <div className="text-center min-w-[36px]">
                    <p className="text-sm font-bold text-brand-700">
                      {row.rate !== null ? `${row.rate}%` : "—"}
                    </p>
                    <p className="text-[10px] text-gray-400">Rate</p>
                  </div>
                </div>

                <div className="text-gray-300 flex-shrink-0">
                  {expandedId === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Expanded detail */}
              {expandedId === row.id && (
                <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">

                    {/* Contracts */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Active Contracts</p>
                      {row.contracts.length === 0 ? (
                        <p className="text-xs text-gray-400">No active contracts</p>
                      ) : (
                        <div className="space-y-1.5">
                          {row.contracts.map(ct => (
                            <div key={ct.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border text-xs">
                              <div>
                                <p className="font-medium">{ct.service_type?.name}</p>
                                <p className="text-gray-400 capitalize">{ct.frequency}</p>
                              </div>
                              <p className="font-bold text-green-700">₹{ct.contract_value?.toLocaleString("en-IN")}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Technicians */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Technicians Assigned</p>
                      {row.technicians.length === 0 ? (
                        <p className="text-xs text-gray-400">None in this period</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {row.technicians.map(t => (
                            <span key={t} className="text-xs bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Summary stats */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Summary</p>
                      <div className="space-y-2 text-xs">
                        {[
                          ["Total Jobs", row.totalJobs],
                          ["Completed", row.completed],
                          ["Pending", row.pending],
                          ["Last Service", row.lastService ? format(new Date(row.lastService), "dd MMM yyyy") : "—"],
                          ["Contract Value", row.contractVal ? `₹${row.contractVal.toLocaleString("en-IN")}` : "—"],
                        ].map(([l, v]) => (
                          <div key={l} className="flex items-center justify-between">
                            <span className="text-gray-400">{l}</span>
                            <span className="font-semibold text-gray-700">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {customerRows.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-10">No customer data available</p>
          )}
        </div>
      </div>

      {/* Service category breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-bold text-sm mb-4">Revenue by Sector</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(
            contracts.filter(c => c.is_active).reduce((acc, c) => {
              const cust = customers.find(cu => cu.id === c.customer_id);
              const sector = cust?.sector || "other";
              acc[sector] = (acc[sector] || 0) + (c.contract_value || 0);
              return acc;
            }, {})
          ).sort((a, b) => b[1] - a[1]).map(([sector, val]) => (
            <div key={sector} className="bg-gray-50 rounded-xl p-4 text-center border">
              <p className="text-lg font-bold text-brand-700">₹{(val / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500 capitalize mt-1">{sector}</p>
              <div className="mt-2 h-1 bg-gray-200 rounded-full">
                <div className="h-full bg-brand-600 rounded-full"
                  style={{ width: `${(val / totalContractValue) * 100}%` }} />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">{Math.round((val / totalContractValue) * 100)}%</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
