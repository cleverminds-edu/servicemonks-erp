import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getCustomers, createCustomer } from "../../api/customers";
import { useAuth } from "../../context/AuthContext";
import { Plus, Search, ChevronRight, Building2, Phone, Mail } from "lucide-react";
import Modal from "../../components/Modal";
import LoadingSpinner from "../../components/LoadingSpinner";

const SECTORS = ["residential", "commercial", "healthcare", "industrial"];
const SECTOR_COLORS = {
  residential: "bg-blue-100 text-blue-700",
  commercial:  "bg-purple-100 text-purple-700",
  healthcare:  "bg-red-100 text-red-700",
  industrial:  "bg-orange-100 text-orange-700",
};

function CustomerForm({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: "", contact_person: "", phone: "", email: "",
    address: "", city: "", pincode: "", sector: "residential", notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      onSave(await createCustomer(form));
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[
          { label: "Company / Customer Name *", key: "name",           required: true,  sm: true },
          { label: "Contact Person",             key: "contact_person", required: false, sm: false },
          { label: "Phone *",                    key: "phone",          required: true,  type: "tel" },
          { label: "Email",                      key: "email",          required: false, type: "email" },
          { label: "City",                       key: "city" },
          { label: "Pincode",                    key: "pincode" },
        ].map(({ label, key, required, type = "text", sm }) => (
          <div key={key} className={sm ? "sm:col-span-2" : ""}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input type={type} required={required} value={form[key]}
              onChange={(e) => set(key, e.target.value)}
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        ))}
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-gray-600 mb-1">Address *</label>
        <input required value={form.address} onChange={(e) => set("address", e.target.value)}
          className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Sector *</label>
        <select value={form.sector} onChange={(e) => set("sector", e.target.value)}
          className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {SECTORS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
          rows={2} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onClose}
          className="flex-1 border rounded-xl py-2.5 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={saving}
          className="flex-1 bg-brand-700 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
          {saving ? "Saving…" : "Save Customer"}
        </button>
      </div>
    </form>
  );
}

export default function Customers() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [customers, setCustomers] = useState([]);
  const [search, setSearch]       = useState("");
  const [sector, setSector]       = useState("");
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getCustomers({ search: search || undefined, sector: sector || undefined })
      .then(setCustomers).finally(() => setLoading(false));
  }, [search, sector]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">{customers.length} total</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="sm:self-start flex items-center gap-2 bg-brand-700 hover:bg-brand-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers…"
            className="w-full border rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white" />
        </div>
        <select value={sector} onChange={(e) => setSector(e.target.value)}
          className="border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white">
          <option value="">All Sectors</option>
          {SECTORS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {loading ? <LoadingSpinner /> : customers.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Building2 size={48} className="mx-auto mb-3 opacity-20" />
          <p className="font-medium">No customers found</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Customer","Contact","Phone","City","Sector",""].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.address}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{c.contact_person || "—"}</td>
                    <td className="px-5 py-3.5">
                      <a href={`tel:${c.phone}`} className="text-brand-700 hover:underline font-mono text-xs">{c.phone}</a>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{c.city || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${SECTOR_COLORS[c.sector]}`}>
                        {c.sector}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link to={`/manager/customers/${c.id}`}
                        className="text-xs font-medium text-brand-700 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        View <ChevronRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {customers.map((c) => (
              <Link key={c.id} to={`/manager/customers/${c.id}`}
                className="flex items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100 gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{c.name}</p>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                    <Phone size={10} /> {c.phone}
                    {c.city && <><span className="text-gray-300">·</span>{c.city}</>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize flex-shrink-0 ${SECTOR_COLORS[c.sector]}`}>
                  {c.sector}
                </span>
                <ChevronRight size={15} className="text-gray-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <Modal title="Add Customer" onClose={() => setShowForm(false)}>
          <CustomerForm
            onSave={(c) => { setCustomers((p) => [c, ...p]); setShowForm(false); }}
            onClose={() => setShowForm(false)}
          />
        </Modal>
      )}
    </div>
  );
}
