const SHARE_TOKEN_EXPIRY_HOURS = 72;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type MerchantSessionPayload = {
  email: string;
  shareIds: string[];
  issuedAt: string;
  expiresAt: string;
};

const encoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array) {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function getSigningKey() {
  const secret = Deno.env.get('BASE44_SERVICE_ROLE_KEY') || Deno.env.get('BASE44_APP_ID');
  if (!secret) {
    throw new Error('Merchant session signing secret is not configured');
  }

  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signValue(value: string) {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return base64UrlEncode(new Uint8Array(signature));
}

export function isShareExpired(share: { created_date?: string }) {
  if (!share?.created_date) {
    return false;
  }

  const created = new Date(share.created_date);
  const ageMs = Date.now() - created.getTime();
  return ageMs > SHARE_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
}

export async function createMerchantSession(email: string, shareIds: string[]) {
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const payload: MerchantSessionPayload = {
    email: email.toLowerCase(),
    shareIds: [...new Set(shareIds)],
    issuedAt,
    expiresAt,
  };

  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const signature = await signValue(encodedPayload);

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt,
  };
}

export async function verifyMerchantSession(token: string) {
  if (!token) {
    throw new Error('Merchant session token is required');
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    throw new Error('Invalid merchant session token');
  }

  const expectedSignature = await signValue(encodedPayload);
  if (signature !== expectedSignature) {
    throw new Error('Invalid merchant session signature');
  }

  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(encodedPayload))) as MerchantSessionPayload;
  if (!payload?.email || !Array.isArray(payload.shareIds) || !payload.expiresAt) {
    throw new Error('Invalid merchant session payload');
  }

  if (new Date(payload.expiresAt).getTime() <= Date.now()) {
    throw new Error('Merchant session has expired');
  }

  return payload;
}
