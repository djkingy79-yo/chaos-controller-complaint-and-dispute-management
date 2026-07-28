import { base44 } from "@/api/base44Client";

export async function invokeBase44Function(name, payload = {}, { requireSuccess = false } = {}) {
  const response = await base44.functions.invoke(name, payload);
  const data = response?.data ?? response;

  if (!data) {
    throw new Error(`Empty response from ${name}`);
  }

  if (data.error) {
    throw new Error(data.error);
  }

  if (requireSuccess && data.success !== true) {
    throw new Error(data.error || `${name} failed`);
  }

  return data;
}
