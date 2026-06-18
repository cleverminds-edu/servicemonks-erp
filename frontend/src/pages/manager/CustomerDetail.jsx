import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCustomer } from "../../api/customers";
import { getContracts, createContract, getServiceTypes } from "../../api/services";
import { getJobs } from "../../api/jobs";
import { getContract } from "../../api/contracts";
import { format } from "date-fns";
import { ArrowLeft, Plus, Phone, Mail, MapPin, Calendar } from "lucide-react";
import Modal from "../../components/Modal";
import ContractModal from "../../components/ContractModal";
import StatusBadge from "../../components/StatusBadge";
import LoadingSpinner from "../../components/LoadingSpinner";

const FREQUENCIES = ["one_time","weekly","fortnightly","monthly","quarterly","half_yearly","annual"];

function ContractForm({ customerId, serviceTypes, onSave, onClose }) {
  const [form, setForm] = useState({
    customer_id: customerId,
    service_type_id: serviceTypes[0]?.id || "",
    frequency: "monthly",
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: "",
    contract_value: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, contract_value: form.contract_value ? parseInt(form.contract_value) : null, end_date: form.end_date || null };
      const contract = await createContract(data);
      onSave(contract);
    } finally {
      setSaving(false);
    }
  };

  const grouped = serviceTypes.reduce((acc, s) => {
    (acc[s.category] = acc[s.category] || []).push(s);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Service *</label>
        <select value={form.service_type_id} onChange={(e) => set("service_type_id", e.target.value)} required
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {Object.entries(grouped).map(([cat, types]) => (
            <optgroup key={cat} label={cat}>
              {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Frequency *</label>
        <select value={form.frequency} onChange={(e) => set("frequency", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {FREQUENCIES.map((f) => <option key={f} value={f}>{f.replace("_", " ")}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
          <input type="date" required value={form.start_date} onChange={(e) => set("start_date", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Contract Value (₹)</label>
        <input type="number" value={form.contract_value} onChange={(e) => set("contract_value", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Cancel</button>
        <button type="submit" disabled={saving} className="flex-1 bg-brand-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">
          {saving ? "Saving..." : "Save Contract"}
        </button>
      </div>
    </form>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [serviceContract, setServiceContract] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [showContract, setShowContract] = useState(false);
  const [showServiceContract, setShowServiceContract] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCustomer(id),
      getContract(id),
      getContracts(id),
      getJobs({ customer_id: id }),
      getServiceTypes(),
    ]).then(([c, sc, co, j, st]) => {
      setCustomer(c);
      setServiceContract(sc);
      setContracts(co);
      setJobs(j);
      setServiceTypes(st);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!customer) return <div className="p-4">Customer not found</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-bold text-lg">{customer.name}</h1>
          <p className="text-xs text-gray-500 capitalize">{customer.sector}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
        {customer.contact_person && <p className="text-sm font-medium">{customer.contact_person}</p>}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone size={14} /> <a href={`tel:${customer.phone}`}>{customer.phone}</a>
        </div>
        {customer.email && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Mail size={14} /> <a href={`mailto:${customer.email}`}>{customer.email}</a>
          </div>
        )}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin size={14} className="mt-0.5 flex-shrink-0" />
          <span>{customer.address}{customer.city ? `, ${customer.city}` : ""}{customer.pincode ? ` - ${customer.pincode}` : ""}</span>
        </div>
        {customer.notes && <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded">{customer.notes}</p>}
      </div>

      {/* Services Agreement */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Contracted Services</h2>
          <button onClick={() => setShowServiceContract(true)}
            className="flex items-center gap-1 text-sm text-brand-700 font-medium">
            <Plus size={15} /> Manage
          </button>
        </div>
        {serviceContract ? (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-gray-600">
                  {format(new Date(serviceContract.start_date), "dd MMM yyyy")}
                  {serviceContract.end_date && ` - ${format(new Date(serviceContract.end_date), "dd MMM yyyy")}`}
                </span>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                serviceContract.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              }`}>
                {serviceContract.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Services</p>
              <div className="flex flex-wrap gap-2">
                {serviceContract.services.map((service) => (
                  <span key={service.id} className="text-xs bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full">
                    {service.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-sm text-gray-500 mb-2">No services contract defined</p>
            <button onClick={() => setShowServiceContract(true)}
              className="text-xs text-brand-700 font-medium hover:underline">
              Create one now
            </button>
          </div>
        )}
      </div>

      {/* Individual Service Contracts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Service Contracts</h2>
          <button onClick={() => setShowContract(true)}
            className="flex items-center gap-1 text-sm text-brand-700 font-medium">
            <Plus size={15} /> Add
          </button>
        </div>
        {contracts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No contracts yet</p>
        ) : (
          <div className="space-y-2">
            {contracts.map((c) => (
              <div key={c.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{c.service_type.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{c.frequency.replace("_", " ")} · From {format(new Date(c.start_date), "dd MMM yyyy")}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-500"}`}>
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {c.contract_value && <p className="text-xs text-gray-500 mt-1">Value: ₹{c.contract_value.toLocaleString()}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-semibold mb-3">Service History</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No jobs yet</p>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 10).map((j) => (
              <div key={j.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{j.service_type?.name}</p>
                  <p className="text-xs text-gray-500">{format(new Date(j.scheduled_date), "dd MMM yyyy")} · {j.technician?.name || "Unassigned"}</p>
                </div>
                <StatusBadge status={j.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {showContract && (
        <Modal title="Add Contract" onClose={() => setShowContract(false)}>
          <ContractForm
            customerId={parseInt(id)}
            serviceTypes={serviceTypes}
            onSave={(c) => { setContracts((prev) => [c, ...prev]); setShowContract(false); }}
            onClose={() => setShowContract(false)}
          />
        </Modal>
      )}

      {showServiceContract && (
        <ContractModal
          customerId={parseInt(id)}
          onClose={() => setShowServiceContract(false)}
          onSave={async () => {
            const contract = await getContract(parseInt(id));
            setServiceContract(contract);
            setShowServiceContract(false);
          }}
        />
      )}
    </div>
  );
}
