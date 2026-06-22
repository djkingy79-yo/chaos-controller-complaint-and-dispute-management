/**
 * PDF DIAGNOSTICS — shared state + helpers for all PDF buttons.
 * Provides: toast feedback on start/success/fail, console logging, debug panel state.
 */

import { toast } from "sonner";

// Global debug state — simple object, not React state (no circular deps)
export const pdfDebugState = {
  lastButton: null,
  lastStatus: null,
  lastError: null,
  lastBlobSize: null,
  lastWarning: null,
  listeners: [],
};

function notifyListeners() {
  pdfDebugState.listeners.forEach(fn => fn({ ...pdfDebugState }));
}

export function pdfDiagStart({ tab, action, caseId, hasCase, hasData }) {
  const entry = { tab, action, caseId, hasCase, hasData, timestamp: new Date().toISOString() };
  console.log("PDF ACTION STARTED", entry);
  pdfDebugState.lastButton = `${tab} → ${action}`;
  pdfDebugState.lastStatus = "started";
  pdfDebugState.lastError = null;
  pdfDebugState.lastBlobSize = null;
  pdfDebugState.lastWarning = null;
  notifyListeners();
  toast.info(`PDF action started: ${tab} — ${action}`, { duration: 2000 });
}

export function pdfDiagBlobCreated({ tab, action, blob }) {
  const entry = { tab, action, size: blob?.size, type: blob?.type, warnings: blob?._warnings };
  console.log("PDF BLOB CREATED", entry);
  pdfDebugState.lastBlobSize = blob?.size ?? null;
  pdfDebugState.lastWarning = blob?._warnings?.length ? blob._warnings.join('; ') : null;
  notifyListeners();
}

export function pdfDiagSuccess({ tab, action }) {
  console.log("PDF ACTION SUCCESS", { tab, action });
  pdfDebugState.lastStatus = "success";
  notifyListeners();
  toast.success(`PDF ready: ${tab} — ${action}`);
}

export function pdfDiagFail({ tab, action, error }) {
  console.error("PDF ACTION FAILED", { tab, action, error, stack: error?.stack });
  pdfDebugState.lastStatus = "failed";
  pdfDebugState.lastError = error?.message ?? String(error);
  notifyListeners();
  toast.error(`PDF failed: ${error?.message ?? String(error)}`);
}

export function pdfDiagMissingData({ tab, action, dataName }) {
  const msg = `Cannot generate PDF: missing ${dataName}`;
  console.warn("PDF MISSING DATA", { tab, action, dataName });
  pdfDebugState.lastStatus = "missing_data";
  pdfDebugState.lastError = msg;
  notifyListeners();
  toast.warning(msg);
}