import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJob, checkinJob } from "../../api/jobs";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Phone, Calendar, Wrench, Navigation } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    getJob(id).then(setJob).finally(() => setLoading(false));
  }, [id]);

  const handleCheckin = () => {
    setCheckingIn(true);
    const doCheckin = (lat, lng) => {
      checkinJob(id, lat, lng).then(() => {
        setJob((j) => ({ ...j, status: "in_progress" }));
        navigate(`/technician/jobs/${id}/execute`);
      }).finally(() => setCheckingIn(false));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => doCheckin(pos.coords.latitude, pos.coords.longitude),
        () => doCheckin(0, 0)
      );
    } else {
      doCheckin(0, 0);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!job) return <div className="p-4">Job not found</div>;

  const canStart = job.status === "scheduled";
  const canExecute = job.status === "in_progress";
  const isCompleted = job.status === "completed";

  const openMaps = () => {
    const addr = encodeURIComponent(job.customer?.address || "");
    window.open(`https://maps.google.com/?q=${addr}`, "_blank");
  };

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-bold">Job #{String(job.id).padStart(4, "0")}</h1>
          <StatusBadge status={job.status} />
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center gap-2">
          <Wrench size={16} className="text-brand-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Service</p>
            <p className="font-semibold text-sm">{job.service_type?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-brand-600 flex-shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Scheduled</p>
            <p className="font-semibold text-sm">
              {format(new Date(job.scheduled_date), "dd MMMM yyyy")}
              {job.scheduled_time && ` at ${job.scheduled_time.slice(0, 5)}`}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
        <p className="font-semibold text-sm">{job.customer?.name}</p>
        {job.customer?.contact_person && (
          <p className="text-sm text-gray-600">{job.customer.contact_person}</p>
        )}
        {job.customer?.phone && (
          <a href={`tel:${job.customer.phone}`}
            className="flex items-center gap-2 text-sm text-brand-700">
            <Phone size={14} /> {job.customer.phone}
          </a>
        )}
        <button onClick={openMaps}
          className="flex items-center gap-2 text-sm text-blue-600 w-full">
          <MapPin size={14} />
          <span className="text-left">{job.customer?.address}</span>
          <Navigation size={12} className="ml-auto flex-shrink-0" />
        </button>
      </div>

      {job.notes && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
          <p className="text-xs font-semibold text-yellow-700 mb-1">Notes from Manager</p>
          <p className="text-sm text-yellow-800">{job.notes}</p>
        </div>
      )}

      {isCompleted && job.execution && (
        <div className="bg-[#fefce8] border border-[#F5C800] rounded-xl p-4 space-y-1">
          <p className="text-sm font-semibold text-[#1a1a1a]">Service Completed</p>
          {job.execution.submitted_at && (
            <p className="text-xs text-gray-600">
              Submitted: {format(new Date(job.execution.submitted_at), "dd MMM yyyy HH:mm")}
            </p>
          )}
          {job.execution.email_sent && (
            <p className="text-xs text-gray-600">Certificate emailed to customer</p>
          )}
        </div>
      )}

      {canStart && (
        <button onClick={handleCheckin} disabled={checkingIn}
          className="w-full bg-brand-700 text-white font-semibold py-4 rounded-xl text-base disabled:opacity-60">
          {checkingIn ? "Checking in..." : "Start Service"}
        </button>
      )}

      {canExecute && (
        <button onClick={() => navigate(`/technician/jobs/${id}/execute`)}
          className="w-full bg-brand-700 text-white font-semibold py-4 rounded-xl text-base">
          Continue Service →
        </button>
      )}
    </div>
  );
}
