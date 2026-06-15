const STATUS_STYLES = {
  scheduled:   "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed:   "bg-amber-100 text-amber-800",
  cancelled:   "bg-red-100 text-red-700",
  pending:     "bg-orange-100 text-orange-700",
  approved:    "bg-amber-100 text-amber-800",
  rejected:    "bg-red-100 text-red-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize
      ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}
