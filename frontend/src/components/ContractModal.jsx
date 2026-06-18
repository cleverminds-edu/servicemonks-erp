import { useState, useEffect } from "react";
import { format } from "date-fns";
import { X, Plus, Trash2 } from "lucide-react";
import { getServiceTypes } from "../api/services";
import { getContract, createOrUpdateContract } from "../api/contracts";
import Modal from "./Modal";

export default function ContractModal({ customerId, onClose, onSave }) {
  const [contract, setContract] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [contractData, servicesData] = await Promise.all([
        getContract(customerId),
        getServiceTypes(),
      ]);

      setServices(servicesData || []);

      if (contractData) {
        setContract(contractData);
        setStartDate(contractData.start_date);
        setEndDate(contractData.end_date || "");
        setIsActive(contractData.is_active);
        setSelectedServices(contractData.services.map((s) => s.id));
      } else {
        setStartDate(new Date().toISOString().split("T")[0]);
        setEndDate("");
        setSelectedServices([]);
      }
    } catch (err) {
      setError("Failed to load contract data");
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSave = async () => {
    if (!startDate) {
      setError("Start date is required");
      return;
    }
    if (selectedServices.length === 0) {
      setError("Select at least one service");
      return;
    }

    setSaving(true);
    try {
      await createOrUpdateContract(customerId, {
        start_date: startDate,
        end_date: endDate || null,
        is_active: isActive,
        service_ids: selectedServices,
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save contract");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Modal title="Manage Services" onClose={onClose}><p className="text-center py-8">Loading...</p></Modal>;

  return (
    <Modal title="Manage Services Contract" onClose={onClose}>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="rounded"
          />
          <span className="text-gray-700">Active Contract</span>
        </label>

        {/* Services */}
        <div>
          <p className="text-sm font-semibold mb-2">Select Services *</p>
          <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
            {services.length === 0 ? (
              <p className="text-xs text-gray-500">No services available</p>
            ) : (
              services.map((service) => (
                <label key={service.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    className="rounded"
                  />
                  <span className="text-gray-700">{service.name}</span>
                  <span className="text-xs text-gray-500">({service.category})</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Selected count */}
        <div className="text-xs text-gray-500 bg-blue-50 px-3 py-2 rounded-lg">
          {selectedServices.length} service{selectedServices.length !== 1 ? "s" : ""} selected
        </div>

        {/* Error */}
        {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-brand-700 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Contract"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
