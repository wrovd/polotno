const { listMovements } = require("../../lib/sheets");
const { requireAuth, requireRole } = require("../../lib/auth");
const { send, methodNotAllowed } = require("../../lib/http");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(req, res, ["GET"]);
  }

  const auth = requireAuth(req);
  const access = requireRole(auth, ["admin"]);
  if (!access.ok) {
    return send(res, access.code, { error: access.error });
  }

  try {
    const userEmail = String(req.query.user_email || "").trim().toLowerCase();
    const limitRaw = Number(req.query.limit || 120);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 500)) : 120;

    let movements = await listMovements(limit * 4);
    if (userEmail) {
      movements = movements.filter((row) => String(row.user_email || "").toLowerCase() === userEmail);
    }

    return send(res, 200, { movements: movements.slice(0, limit) });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to load admin history" });
  }
};
