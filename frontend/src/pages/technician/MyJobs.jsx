import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { getJobs } from "../../api/jobs";
import { pushLocation } from "../../api/tracking";
import { getTodayAttendance, markAttendance } from "../../api/hr";
import { ClipboardList, MapPin, ChevronRight, CalendarCheck } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import LoadingSpinner from "../../components/LoadingSpinner";

export default function MyJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [attendance, setAttendance] = useState(null);
  const [markingAtt, setMarkingAtt] = useState(false);
  const watchRef = useRef(null);

  const startTracking = () => {
    if (!navigator.geolocation || watchRef.current !== null) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        pushLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }).catch(() => {});
      },
      (err) => console.warn("GPS error:", err),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 }
    );
    setTracking(true);
  };

  const stopTracking = () => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setTracking(false);
  };

  useEffect(() => {
    getJobs().then(setJobs).finally(() => setLoading(false));
    getTodayAttendance().then(r => {
      setAttendance(r.status);
      if (r.status === "present") startTracking();
    }).catch(() => {});
  }, []);

  useEffect(() => () => stopTracking(), []);

  const handleMarkAttendance = async () => {
    setMarkingAtt(true);
    try {
      await markAttendance({ date: format(new Date(), "yyyy-MM-dd"), status: "present" });
      setAttendance("present");
      startTracking();
    } catch {
      alert("Failed to mark attendance");
    } finally {
      setMarkingAtt(false);
    }
  };

  const today = format(new Date(), "yyyy-MM-dd");
  const todayJobs = jobs.filter((j) => j.scheduled_date === today);
  const upcomingJobs = jobs.filter((j) => j.scheduled_date > today);

  const JobCard = ({ job }) => (
    <Link to={`/technician/jobs/${job.id}`}
      className="flex items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100 gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{job.customer?.name}</p>
        <p className="text-xs text-gray-500">{job.service_type?.name}</p>
        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
          <MapPin size={11} />
          <span className="truncate">{job.customer?.address}</span>
        </div>
        {job.scheduled_time && (
          <p className="text-xs text-gray-400">{job.scheduled_time.slice(0, 5)}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatusBadge status={job.status} />
        <ChevronRight size={16} className="text-gray-300" />
      </div>
    </Link>
  );

  return (
    <div className="p-4 space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Jobs</h1>
          <p className="text-sm text-gray-500">{format(new Date(), "EEE, dd MMM")}</p>
        </div>
      </div>

      {/* Attendance + tracking status */}
      {attendance === "present" ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck size={16} /> Attendance marked for today
          </div>
          {tracking && (
            <div className="flex items-center gap-1.5 text-xs text-[#b8960a]">
              <div className="w-2 h-2 bg-[#F5C800] rounded-full animate-pulse" />
              Location sharing ON
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={handleMarkAttendance}
          disabled={markingAtt}
          className="w-full flex items-center justify-center gap-2 bg-brand-700 text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
        >
          <CalendarCheck size={16} />
          {markingAtt ? "Marking..." : "Mark Attendance"}
        </button>
      )}

      {loading ? <LoadingSpinner /> : (
        <>
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-2">TODAY</h2>
            {todayJobs.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">No jobs for today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayJobs.map((j) => <JobCard key={j.id} job={j} />)}
              </div>
            )}
          </section>

          {upcomingJobs.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-500 mb-2">UPCOMING</h2>
              <div className="space-y-2">
                {upcomingJobs.slice(0, 5).map((j) => <JobCard key={j.id} job={j} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
