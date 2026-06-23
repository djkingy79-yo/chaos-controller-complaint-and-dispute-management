// ─── Chaos Controller — Directory Data Index ─────────────────────────────────
// All provider data lives in lib/providersData.js.
// This file re-exports for any legacy imports still using directoriesData.
export { providers, CATEGORY_HUBS } from "@/lib/providersData";

// Legacy shape exports (kept so old imports don't break)
export const escalationBodies = [];
export const contactDirectory = [];