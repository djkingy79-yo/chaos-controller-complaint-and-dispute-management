// ─── Chaos Controller — Directory Data Index ─────────────────────────────────
// All provider data and category hubs live in lib/providersData.js.
// This file re-exports everything so legacy imports continue to work.
export { providers, CATEGORY_HUBS } from "@/lib/providersData";

// Legacy shape exports — kept so older imports don't break
export const escalationBodies = [];
export const contactDirectory = [];