// Subscription helper — checks if the current user has an active subscription
// Admin (djkingy79@gmail.com) always gets full Command-level access for free

export const ADMIN_EMAIL = "djkingy79@gmail.com";

export function isAdminUser(user) {
  return user?.email === ADMIN_EMAIL || user?.role === "admin";
}

export function getAdminSubscription(user) {
  if (!isAdminUser(user)) return null;
  return {
    plan_name: "Command",
    subscription_active: true,
    isAdmin: true,
    subscription_expiry: "9999-12-31"
  };
}

// Returns the active subscription for a user from their payment records
// Pass in the array of their PaymentRequests
export function getActiveSubscription(user, payments = []) {
  if (isAdminUser(user)) return getAdminSubscription(user);
  const active = payments
    .filter(p => p.subscription_active && p.status === "verified")
    .sort((a, b) => new Date(b.verified_date) - new Date(a.verified_date));
  return active[0] || null;
}

export const PLAN_LEVELS = { Starter: 1, Pro: 2, Command: 3 };
export const PLAN_PRICES = { Starter: 25, Pro: 35, Command: 49 };

export function hasPlanAccess(subscription, requiredPlan) {
  if (!subscription?.subscription_active) return false;
  const userLevel = PLAN_LEVELS[subscription.plan_name] || 0;
  const requiredLevel = PLAN_LEVELS[requiredPlan] || 0;
  return userLevel >= requiredLevel;
}

// Calculate upgrade price - only pay the difference
export function getUpgradePrice(currentPlan, targetPlan) {
  if (!currentPlan || !targetPlan) return null;
  const currentLevel = PLAN_LEVELS[currentPlan];
  const targetLevel = PLAN_LEVELS[targetPlan];
  if (!currentLevel || !targetLevel || targetLevel <= currentLevel) return null;
  
  const currentPrice = PLAN_PRICES[currentPlan];
  const targetPrice = PLAN_PRICES[targetPlan];
  const priceDifference = targetPrice - currentPrice;
  
  return {
    from_plan: currentPlan,
    to_plan: targetPlan,
    original_price: targetPrice,
    upgrade_price: priceDifference,
    savings: currentPrice
  };
}