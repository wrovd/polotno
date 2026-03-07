const { listUsers, listMovements } = require("../lib/sheets");
const { requireAuth, requireRole } = require("../lib/auth");
const { sendTelegramMessage } = require("../lib/telegram");
const { send, methodNotAllowed, parseJsonBody } = require("../lib/http");

function actionFromReq(req) {
  return String(req.query?.action || "").trim().toLowerCase();
}

function requireAdmin(req, res) {
  const auth = requireAuth(req);
  const access = requireRole(auth, ["admin"]);
  if (!access.ok) {
    send(res, access.code, { error: access.error });
    return null;
  }
  return access.user;
}

async function handleUsers(req, res) {
  if (req.method !== "GET") return methodNotAllowed(req, res, ["GET"]);
  if (!requireAdmin(req, res)) return;

  try {
    const users = await listUsers();
    return send(res, 200, {
      users: users.map((user) => ({
        email: user.email,
        name: user.name,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        role: user.role || "staff",
        telegram_chat_id: user.telegram_chat_id || "",
        low_stock_notifications: String(user.low_stock_notifications || "1"),
      })),
    });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to load users" });
  }
}

async function handleHistory(req, res) {
  if (req.method !== "GET") return methodNotAllowed(req, res, ["GET"]);
  if (!requireAdmin(req, res)) return;

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
}

async function handleAnnounce(req, res) {
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST"]);
  if (!requireAdmin(req, res)) return;

  try {
    const body = parseJsonBody(req);
    const message = String(body.message || "").trim();
    const role = String(body.role || "all").trim().toLowerCase();

    if (!message) return send(res, 400, { error: "Message is required" });

    const users = await listUsers();
    const recipients = users.filter((u) => {
      if (!String(u.telegram_chat_id || "").trim()) return false;
      if (role === "all") return true;
      return String(u.role || "staff").toLowerCase() === role;
    });

    let sent = 0;
    const text = `Анонс от админки Polotno:\n${message}`;
    for (const user of recipients) {
      try {
        await sendTelegramMessage(user.telegram_chat_id, text);
        sent += 1;
      } catch {
        // continue
      }
    }

    return send(res, 200, { ok: true, sent, total: recipients.length });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to send announcement" });
  }
}

module.exports = async function handler(req, res) {
  const action = actionFromReq(req);
  if (action === "users") return handleUsers(req, res);
  if (action === "history") return handleHistory(req, res);
  if (action === "announce") return handleAnnounce(req, res);
  return send(res, 404, { error: "Unknown admin action" });
};
