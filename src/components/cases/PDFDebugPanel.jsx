import { useState, useEffect } from "react";
import { pdfDebugState } from "@/lib/pdfDiagnostics";
import { useAuth } from "@/lib/AuthContext";

export default function PDFDebugPanel() {
  const { user } = useAuth();
  const [state, setState] = useState({ ...pdfDebugState });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const listener = (s) => setState({ ...s });
    pdfDebugState.listeners.push(listener);
    return () => {
      pdfDebugState.listeners = pdfDebugState.listeners.filter(l => l !== listener);
    };
  }, []);

  // Only visible for admin users
  if (!user || user.role !== "admin") return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-slate-900 text-green-400 text-xs font-mono px-3 py-1.5 rounded-full border border-green-500/40 shadow-lg hover:bg-slate-800"
      >
        🔧 PDF Debug {state.lastStatus === "failed" ? "❌" : state.lastStatus === "success" ? "✅" : ""}
      </button>
      {open && (
        <div className="mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 text-xs font-mono text-green-300 space-y-2">
          <p className="text-green-400 font-bold text-sm mb-1">PDF Debug Panel</p>
          <Row label="Last Button" value={state.lastButton} />
          <Row label="Last Status" value={state.lastStatus} color={
            state.lastStatus === "failed" ? "text-red-400"
            : state.lastStatus === "success" ? "text-green-400"
            : "text-yellow-300"
          } />
          <Row label="Blob Size" value={state.lastBlobSize != null ? `${state.lastBlobSize} bytes` : "—"} />
          <Row label="Warning" value={state.lastWarning ?? "—"} color="text-yellow-300" />
          {state.lastError && (
            <div className="bg-red-900/40 border border-red-500/40 rounded p-2">
              <p className="text-red-400 font-bold mb-0.5">Error:</p>
              <p className="text-red-300 break-words">{state.lastError}</p>
            </div>
          )}
          <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 text-xs mt-1">Close</button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, color = "text-green-300" }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-500 shrink-0 w-24">{label}:</span>
      <span className={`${color} break-words`}>{value ?? "—"}</span>
    </div>
  );
}