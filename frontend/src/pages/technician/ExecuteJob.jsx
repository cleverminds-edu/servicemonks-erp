import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJob, submitJob } from "../../api/jobs";
import { format } from "date-fns";
import { ArrowLeft, Trash2, CheckCircle } from "lucide-react";
import LoadingSpinner from "../../components/LoadingSpinner";

// ── Signature Canvas ─────────────────────────────────────────────────────────
function SignatureCanvas({ onCapture }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);
  const hasStrokes = useRef(false);

  // Scale canvas for device pixel ratio so lines are crisp on retina screens
  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    hasStrokes.current = true;
  };

  const end = (e) => {
    e.preventDefault();
    drawing.current = false;
    if (hasStrokes.current) {
      onCapture(canvasRef.current.toDataURL("image/png"));
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    hasStrokes.current = false;
    onCapture(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Customer Signature *</p>
        <button type="button" onClick={clear} className="flex items-center gap-1 text-xs text-red-500">
          <Trash2 size={13} /> Clear
        </button>
      </div>
      <div className="border-2 border-dashed border-gray-300 rounded-xl bg-white overflow-hidden relative">
        <canvas
          ref={canvasRef}
          className="w-full touch-none cursor-crosshair block"
          style={{ height: "200px" }}
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={end}
        />
        <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-gray-300 pointer-events-none select-none">
          Sign above
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const PRODUCTS = [
  "Gel Bait", "Spray Treatment", "Fumigation", "Dust Treatment",
  "Glue Traps", "Rodenticide", "Larvicide", "Fogging",
  "Herbal Spray", "UV Light Trap",
];

export default function ExecuteJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [otherProducts, setOtherProducts] = useState("");
  const [remarks, setRemarks] = useState("");
  const [signatureData, setSignatureData] = useState(null);

  const [checkoutPos, setCheckoutPos] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    getJob(id).then(setJob).finally(() => setLoading(false));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => setCheckoutPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => {}
      );
    }
  }, [id]);

  const toggleProduct = (p) =>
    setSelectedProducts((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const allProducts = [
    ...selectedProducts,
    ...(otherProducts.trim() ? [otherProducts.trim()] : []),
  ].join(", ");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signatureData) return alert("Please capture customer signature before submitting");
    setSubmitting(true);

    try {
      console.log("Submitting job...");
      const response = await submitJob(id, {
        checkout_lat: checkoutPos.lat,
        checkout_lng: checkoutPos.lng,
        products_used: allProducts,
        remarks,
        signature_data: signatureData,
      });
      console.log("Job submitted successfully:", response);
      setDone(true);
    } catch (err) {
      console.error("Submission error:", err);
      alert(err.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!job) return <div className="p-4">Job not found</div>;

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-brand-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full space-y-4">
          <div className="flex justify-center">
            <CheckCircle size={64} className="text-brand-600" />
          </div>
          <h2 className="text-xl font-bold text-brand-800">Service Completed!</h2>
          <p className="text-sm text-gray-500">
            A completion certificate has been generated and emailed to the customer.
          </p>
          <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
            <p className="font-medium">{job.customer?.name}</p>
            <p>{job.service_type?.name}</p>
            <p>{format(new Date(), "dd MMM yyyy HH:mm")}</p>
          </div>
          <button onClick={() => navigate("/technician/jobs")}
            className="w-full bg-brand-700 text-white font-semibold py-3 rounded-xl">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="sticky top-0 bg-white border-b z-10 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="font-bold text-sm">{job.customer?.name}</p>
          <p className="text-xs text-gray-500">{job.service_type?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 pb-24">

        {/* Products Used */}
        <div>
          <p className="text-sm font-semibold mb-3">Products / Chemicals Used</p>
          <div className="flex flex-wrap gap-2">
            {PRODUCTS.map((p) => (
              <button
                key={p} type="button"
                onClick={() => toggleProduct(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                  ${selectedProducts.includes(p)
                    ? "bg-brand-700 text-white border-brand-700"
                    : "bg-white text-gray-600 border-gray-200"
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={otherProducts}
            onChange={(e) => setOtherProducts(e.target.value)}
            placeholder="Other products (comma separated)"
            className="w-full mt-3 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-semibold mb-2">Observations & Remarks</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={4}
            placeholder="Describe the infestation level, areas treated, recommendations..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
          />
        </div>

        {/* Signature */}
        <SignatureCanvas onCapture={setSignatureData} />

        {/* Submit Section */}
        <div className="space-y-3 mt-6 mb-6">
          {!signatureData && (
            <p className="text-center text-sm text-red-600 bg-red-50 rounded-lg p-3 font-medium">
              ⚠️ Draw your signature above to enable submit
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || !signatureData}
            className="w-full bg-brand-700 hover:bg-brand-800 text-white font-bold py-4 rounded-xl text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </span>
            ) : (
              "✓ Submit & Complete Service"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
