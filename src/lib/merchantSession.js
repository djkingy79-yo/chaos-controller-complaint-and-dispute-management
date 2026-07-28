const MERCHANT_SESSION_KEY = "merchant_session";

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function readMerchantSession() {
  if (!canUseSessionStorage()) {
    return null;
  }

  const raw = window.sessionStorage.getItem(MERCHANT_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.sessionToken !== "string") {
      clearMerchantSession();
      return null;
    }
    return parsed;
  } catch {
    clearMerchantSession();
    return null;
  }
}

export function writeMerchantSession(session) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(MERCHANT_SESSION_KEY, JSON.stringify(session));
}

export function clearMerchantSession() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(MERCHANT_SESSION_KEY);
}
