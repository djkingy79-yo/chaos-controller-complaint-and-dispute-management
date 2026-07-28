export const ADMIN_EMAIL = 'djkingy79@gmail.com';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function isAdminUser(user: { email?: string; role?: string } | null | undefined) {
  return !!user && (user.role === 'admin' || user.email === ADMIN_EMAIL);
}

export async function requireAdmin(base44: any) {
  const user = await base44.auth.me();
  if (!isAdminUser(user)) {
    throw new HttpError(403, 'Unauthorized - admin access required');
  }
  return user;
}

export function jsonError(error: unknown) {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : 'Internal server error';
  return Response.json({ error: message }, { status: 500 });
}
