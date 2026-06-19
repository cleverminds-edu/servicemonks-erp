import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { getJobs, createJob, updateJob } from "../../api/jobs";
import { getCustomers } from "../../api/customers";
import { getServiceTypes } from "../../api/services";
import { getUsers } from "../../api/users";
import { getContract } from "../../api/contracts";
import { ChevronLeft, ChevronRight, Plus, Pencil, Calendar, AlertCircle } from "lucide-react";
import Modal from "../../components/Modal";
import StatusBadge from "../../components/StatusBadge";
import LoadingSpinner from "../../components/LoadingSpinner";

const FREQUENCIES = ["one_time","weekly","fortnightly","monthly","quarterly","half_yearly","annual"];

function JobForm({ date, customers, serviceTypes, technicians, onSave, onClose, existing }) {
  const [form, setForm] = useState({
    customer_id:     existing?.customer_id     || "",
    service_type_id: existing?.service_type_id || "",
    assigned_to:     existing?.assigned_to     || "",
    scheduled_date:  existing?.scheduled_date  || date,
    scheduled_time:  existing?.scheduled_time  || "",
    notes:           existing?.notes           || "",
  });
  const [saving, setSaving] = useState(false);
  const [customerContract, setCustomerContract] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleCustomerChange = async (customerId) => {
    set("customer_id", customerId);
    set("service_type_id", ""); // Reset service when customer changes

    if (customerId) {
      const contract = await getContract(parseInt(customerId));
      setCustomerContract(contract);
    } else {
      setCustomerContract(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = {
        ...form,
        customer_id:     parseInt(form.customer_id),
        service_type_id: parseInt(form.service_type_id),
        assigned_to:     form.assigned_to ? parseInt(form.assigned_to) : null,
        scheduled_time:  form.scheduled_time || null,
      };
      onSave(existing ? await updateJob(existing.id, data) : await createJob(data));
    } finally {
      setSaving(false);
    }
  };

  // Show contracted services if contract exists, otherwise show all services
  const availableServices = customerContract
    ? serviceTypes.filter((st) => customerContract.services.some((cs) => cs.id === st.id))
    : serviceTypes;

  const grouped = availableServices.reduce((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Customer *</label>
        <select value={form.customer_id} onChange={(e) => handleCustomerChange(e.target.value)} required
          className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Select customer…</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Service *</label>
        <select
          value={form.service_type_id}
          onChange={(e) => set("service_type_id", e.target.value)}
          required
          disabled={!form.customer_id}
          className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-100 disabled:cursor-not-allowed">
          <option value="">{form.customer_id ? "Select service…" : "Select customer first…"}</option>
          {Object.entries(grouped).map(([cat, types]) => (
            <optgroup key={cat} label={cat}>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Assign Technician</label>
        <select value={form.assigned_to} onChange={(e) => set("assigned_to", e.target.value)}
          className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          <option value="">Unassigned</option>
          {technicians.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.employee_id})</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
          <input type="date" required value={form.scheduled_date} onChange={(e) => set("scheduled_date", e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
          <input type="time" value={form.scheduled_time} onChange={(e) => set("scheduled_time", e.target.value)}
            className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes for Technician</label>
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
          className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 border rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={saving}
          className="flex-1 bg-brand-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
          {saving ? "Saving…" : existing ? "Update" : "Schedule Job"}
        </button>
      </div>
    </form>
  );
}

export default function Roster() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [jobs, setJobs]                 = useState([]);
  const [customers, setCustomers]       = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [technicians, setTechnicians]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showForm, setShowForm]         = useState(false);
  const [editJob, setEditJob]           = useState(null);

  useEffect(() => {
    Promise.all([getCustomers(), getServiceTypes(), getUsers("technician")])
      .then(([c, st, t]) => { setCustomers(c); setServiceTypes(st); setTechnicians(t); });
  }, []);

  const loadJobs = () => {
    setLoading(true);
    getJobs({ scheduled_date: selectedDate }).then(setJobs).finally(() => setLoading(false));
  };
  useEffect(() => { loadJobs(); }, [selectedDate]);

  const changeDate = (days) => setSelectedDate(format(addDays(new Date(selectedDate), days), "yyyy-MM-dd"));
  const isToday = selectedDate === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roster</h1>
          <p className="text-sm text-gray-500">{jobs.length} job{jobs.length !== 1 ? "s" : ""} scheduled</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="sm:self-start flex items-center gap-2 bg-brand-700 hover:bg-brand-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> Schedule Job
        </button>
      </div>

      {/* Date navigator */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
        <button onClick={() => changeDate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-3">
          <Calendar size={16} className="text-brand-500" />
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm font-semibold text-center border-0 focus:outline-none cursor-pointer" />
          <span className="text-sm text-gray-400">{format(new Date(selectedDate), "EEEE")}</span>
          {isToday && <span className="text-xs bg-brand-500 text-brand-700 font-bold px-2 py-0.5 rounded-full">Today</span>}
        </div>
        <button onClick={() => changeDate(1)} className="p-2 rounded-xl hover:bg-gray-100">
          <ChevronRight size={18} />
        </button>
      </div>

      {loading ? <LoadingSpinner /> : jobs.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
          <Calendar size={40} className="mx-auto mb-2 opacity-20" />
          <p className="font-medium">No jobs for this date</p>
          <button onClick={() => setShowForm(true)} className="mt-2 text-brand-700 text-sm font-medium">
            + Schedule one
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Customer","Address","Service","Technician","Time","Status",""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 group">
                    <td className="px-5 py-3.5 font-semibold">{job.customer?.name}</td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs max-w-[180px] truncate">{job.customer?.address}</td>
                    <td className="px-5 py-3.5 text-gray-600">{job.service_type?.name}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {job.technician ? (
                        <span>{job.technician.name}
                          <span className="text-xs text-gray-400 ml-1 font-mono">({job.technician.employee_id})</span>
                        </span>
                      ) : <span className="text-gray-300">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{job.scheduled_time?.slice(0,5) || "—"}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={job.status} /></td>
                    <td className="px-5 py-3.5">
                      {job.status === "scheduled" && (
                        <button onClick={() => setEditJob(job)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-gray-100">
                          <Pencil size={14} className="text-gray-400" />
                        </button>
                      )}
                    </td>
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
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm">{job.customer?.name}</p>
                    <p className="text-xs text-gray-500">{job.service_type?.name}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {job.technician?.name || "Unassigned"}
                      {job.scheduled_time && ` · ${job.scheduled_time.slice(0,5)}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={job.status} />
                    {job.status === "scheduled" && (
                      <button onClick={() => setEditJob(job)} className="p-1 rounded hover:bg-gray-100">
                        <Pencil size={13} className="text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {(showForm || editJob) && (
        <Modal title={editJob ? "Edit Job" : "Schedule Job"}
          onClose={() => { setShowForm(false); setEditJob(null); }}>
          <JobForm date={selectedDate} customers={customers} serviceTypes={serviceTypes}
            technicians={technicians} existing={editJob}
            onSave={() => { loadJobs(); setShowForm(false); setEditJob(null); }}
            onClose={() => { setShowForm(false); setEditJob(null); }} />
        </Modal>
      )}
    </div>
  );
}
