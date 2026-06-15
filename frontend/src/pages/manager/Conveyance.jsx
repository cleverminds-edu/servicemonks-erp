import { useState, useEffect } from "react";
import { getClaims, approveClaim, rejectClaim } from "../../api/conveyance";
import { format } from "date-fns";
import { CheckCircle, XCircle, Truck, IndianRupee } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import LoadingSpinner from "../../components/LoadingSpinner";

const TABS = ["pending", "approved", "rejected"];

export default function Conveyance() {
  const [tab, setTab]       = useState("pending");
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);

  const load = () => {
    setLoading(true);
    getClaims({ status: tab }).then(setClaims).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [tab]);

  const handle = async (id, action) => {
    setActing(id);
    await (action === "approve" ? approveClaim(id) : rejectClaim(id));
    load();
    setActing(null);
  };

  const totalAmount = claims.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conveyance Claims</h1>
          {claims.length > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {claims.length} claim{claims.length !== 1 ? "s" : ""} · Total ₹{totalAmount.toFixed(0)}
            </p>
          )}
        </div>
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-colors
                ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingSpinner /> : claims.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          <Truck size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No {tab} claims</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Technician","Job","Date","Distance","Rate","Amount","Notes","Status", tab === "pending" ? "Actions" : ""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-semibold">
                      {claim.technician?.name}
                      <p className="text-xs text-gray-400 font-mono font-normal">{claim.technician?.employee_id}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 font-mono text-xs">#JOB-{String(claim.job_id).padStart(4,"0")}</td>
                    <td className="px-5 py-3.5 text-gray-600">{format(new Date(claim.date), "dd MMM yyyy")}</td>
                    <td className="px-5 py-3.5 text-gray-600">{claim.distance_km} km</td>
                    <td className="px-5 py-3.5 text-gray-600">₹{claim.rate_per_km}/km</td>
                    <td className="px-5 py-3.5 font-bold text-brand-700">₹{claim.amount}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs max-w-[160px] truncate">{claim.notes || "—"}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={claim.status} /></td>
                    {claim.status === "pending" && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handle(claim.id, "reject")} disabled={acting === claim.id}
                            className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50">
                            <XCircle size={15} />
                          </button>
                          <button onClick={() => handle(claim.id, "approve")} disabled={acting === claim.id}
                            className="p-1.5 rounded-lg bg-brand-700 text-white hover:bg-brand-900 disabled:opacity-50">
                            <CheckCircle size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                    {claim.status !== "pending" && <td />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {claims.map((claim) => (
              <div key={claim.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold text-sm">{claim.technician?.name}
                      <span className="text-xs text-gray-400 font-mono ml-1">({claim.technician?.employee_id})</span>
                    </p>
                    <p className="text-xs text-gray-500">Job #{claim.job_id} · {format(new Date(claim.date), "dd MMM yyyy")}</p>
                  </div>
                  <StatusBadge status={claim.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Distance</p>
                    <p className="font-bold text-sm">{claim.distance_km} km</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Rate</p>
                    <p className="font-bold text-sm">₹{claim.rate_per_km}/km</p>
                  </div>
                  <div className="bg-brand-50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">Amount</p>
                    <p className="font-bold text-sm text-brand-700">₹{claim.amount}</p>
                  </div>
                </div>
                {claim.notes && <p className="text-xs text-gray-500 mb-3 bg-gray-50 px-3 py-2 rounded-lg">{claim.notes}</p>}
                {claim.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => handle(claim.id, "reject")} disabled={acting === claim.id}
                      className="flex-1 flex items-center justify-center gap-1.5 border border-red-200 text-red-600 rounded-xl py-2 text-sm font-semibold disabled:opacity-50">
                      <XCircle size={14} /> Reject
                    </button>
                    <button onClick={() => handle(claim.id, "approve")} disabled={acting === claim.id}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-brand-700 text-white rounded-xl py-2 text-sm font-semibold disabled:opacity-50">
                      <CheckCircle size={14} /> Approve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
