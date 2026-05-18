const { getBearerToken, verifyToken } = require("./security");
const { touchUserActivity } = require("./sheets");

const activityTouchCache = new Map();

function touchAuthenticatedUser(email) {
  const needle = String(email || "").trim().toLowerCase();
  if (!needle) return;
  const now = Date.now();
  const prev = Number(activityTouchCache.get(needle) || 0);
  if (now - prev < 60 * 1000) return;
  activityTouchCache.set(needle, now);
  touchUserActivity(needle).catch(() => {});
}

function requireAuth(req) {
  const token = getBearerToken(req);
  const payload = verifyToken(token);
  if (!payload) {
    return { ok: false, error: "Unauthorized" };
  }
  touchAuthenticatedUser(payload.email);
  return { ok: true, user: payload };
}

function requireRole(auth, roles) {
  if (!auth?.ok) {
    return { ok: false, error: auth?.error || "Unauthorized", code: 401 };
  }

  const role = String(auth.user?.role || "staff").toLowerCase();
  const allow = roles.map((r) => String(r).toLowerCase());
  if (!allow.includes(role)) {
    return { ok: false, error: "Forbidden", code: 403 };
  }

  return { ok: true, user: auth.user };
}

module.exports = {
  requireAuth,
  requireRole,
};
