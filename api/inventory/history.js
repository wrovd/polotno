const { listMovements } = require("../../lib/sheets");
const { requireAuth } = require("../../lib/auth");
const { send, methodNotAllowed } = require("../../lib/http");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(req, res, ["GET"]);
  }

  const auth = requireAuth(req);
  if (!auth.ok) {
    return send(res, 401, { error: auth.error });
  }

  try {
    const limitRaw = Number(req.query.limit || 100);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 300)) : 100;
    const userEmail = String(req.query.user_email || "").trim().toLowerCase();
    const itemId = String(req.query.item_id || "").trim().toUpperCase();
    const reason = String(req.query.reason || "").trim().toLowerCase();
    const dateFrom = String(req.query.date_from || "").trim();
    const dateTo = String(req.query.date_to || "").trim();

    let movements = await listMovements(limit * 3);

    if (userEmail) {
      movements = movements.filter((row) => String(row.user_email || "").toLowerCase().includes(userEmail));
    }

    if (itemId) {
      movements = movements.filter((row) => String(row.item_id || "").toUpperCase().includes(itemId));
    }

    if (reason) {
      movements = movements.filter((row) => String(row.reason || "").toLowerCase() === reason);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (!Number.isNaN(fromDate.getTime())) {
        movements = movements.filter((row) => {
          const dt = new Date(row.created_at || "");
          return !Number.isNaN(dt.getTime()) && dt >= fromDate;
        });
      }
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      if (!Number.isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        movements = movements.filter((row) => {
          const dt = new Date(row.created_at || "");
          return !Number.isNaN(dt.getTime()) && dt <= toDate;
        });
      }
    }

    return send(res, 200, { movements: movements.slice(0, limit) });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to load history" });
  }
};
