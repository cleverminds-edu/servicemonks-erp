import { useState, useEffect } from "react";
import { getUsers, createUser, updateUser } from "../../api/users";
import { useAuth } from "../../context/AuthContext";
import { Plus, UserCheck, UserX, Phone, Mail, Shield } from "lucide-react";
import Modal from "../../components/Modal";
import LoadingSpinner from "../../components/LoadingSpinner";

const ROLES = ["technician", "support_staff", "manager", "admin"];

const ROLE_STYLES = {
  admin:         "bg-purple-100 text-purple-700",
  manager:       "bg-blue-100 text-blue-700",
  technician:    "bg-yellow-100 text-yellow-800",
  support_staff: "bg-pink-100 text-pink-700",
};

function UserForm({ onSave, onClose, existing }) {
  const [form, setForm] = useState({
    name: existing?.name || "",
    email: existing?.email || "",
    phone: existing?.phone || "",
    role: existing?.role || "technician",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = existing
        ? { name: form.name, phone: form.phone, role: form.role }
        : {
            name: form.name,
            email: form.email || null,
            phone: form.phone || null,
            role: form.role,
          };
      const data = existing ? await updateUser(existing.id, payload) : await createUser(payload);
      onSave(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Full Name *</label>
        <input required value={form.name} onChange={(e) => set("name", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      {!existing && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      )}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
        <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Role *</label>
        <select value={form.role} onChange={(e) => set("role", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
        </select>
      </div>
      {!existing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
          ℹ️ Employee ID (SMXXX) and password will be auto-generated. Default password = phone number.
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm text-gray-600">Cancel</button>
        <button type="submit" disabled={saving}
          className="flex-1 bg-brand-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60">
          {saving ? "Saving..." : existing ? "Update" : "Add User"}
        </button>
      </div>
    </form>
  );
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [filterRole, setFilterRole] = useState("all");

  const load = () => {
    setLoading(true);
    getUsers().then(setUsers).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (user) => {
    const updated = await updateUser(user.id, { is_active: !user.is_active });
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: updated.is_active } : u));
  };

  const filtered = filterRole === "all" ? users : users.filter((u) => u.role === filterRole);

  const counts = { all: users.length, ...Object.fromEntries(ROLES.map((r) => [r, users.filter((u) => u.role === r).length])) };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Team Management</h1>
        {isAdmin && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 bg-brand-700 text-white px-3 py-2 rounded-lg text-sm font-medium">
            <Plus size={16} /> Add User
          </button>
        )}
      </div>

      {/* Role filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["all", ...ROLES].map((r) => (
          <button key={r} onClick={() => setFilterRole(r)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors
              ${filterRole === r ? "bg-brand-700 text-white" : "bg-gray-100 text-gray-600"}`}>
            {r} ({counts[r] || 0})
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div className="space-y-2">
          {filtered.map((user) => (
            <div key={user.id}
              className={`bg-white rounded-xl p-4 shadow-sm border transition-opacity ${!user.is_active ? "opacity-50" : "border-gray-100"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded">{user.employee_id}</span>
                    <p className="font-semibold text-sm">{user.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${ROLE_STYLES[user.role]}`}>
                      {user.role}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {user.email && <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Mail size={11} /> {user.email}
                    </div>}
                    {user.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Phone size={11} /> {user.phone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setEditUser(user)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <Shield size={15} />
                  </button>
                  <button onClick={() => toggleActive(user)}
                    className={`p-2 rounded-lg transition-colors ${user.is_active ? "hover:bg-red-50 text-red-400" : "hover:bg-yellow-50 text-[#F5C800]"}`}
                    title={user.is_active ? "Deactivate" : "Activate"}>
                    {user.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(showForm || editUser) && (
        <Modal title={editUser ? "Edit User" : "Add User"} onClose={() => { setShowForm(false); setEditUser(null); }}>
          <UserForm
            existing={editUser}
            onSave={(u) => {
              if (editUser) {
                setUsers((prev) => prev.map((x) => x.id === u.id ? u : x));
              } else {
                setUsers((prev) => [...prev, u]);
              }
              setShowForm(false);
              setEditUser(null);
            }}
            onClose={() => { setShowForm(false); setEditUser(null); }}
          />
        </Modal>
      )}
    </div>
  );
}
