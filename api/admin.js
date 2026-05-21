const { listUsers, listMovements, findUserByEmail, updateUserByEmail, deleteUserByEmail } = require("../lib/sheets");
const { requireAuth, requireRole } = require("../lib/auth");
const { sendTelegramMessage } = require("../lib/telegram");
const { send, methodNotAllowed, parseJsonBody } = require("../lib/http");

function actionFromReq(req) {
  return String(req.query?.action || "").trim().toLowerCase();
}

async function requireAdmin(req, res) {
  const auth = requireAuth(req);
  const access = requireRole(auth, ["admin"]);
  if (!access.ok) {
    send(res, access.code, { error: access.error });
    return null;
  }
  const current = await findUserByEmail(access.user.email);
  if (String(current?.role || "staff").toLowerCase() !== "admin") {
    send(res, 403, { error: "Forbidden" });
    return null;
  }
  return { ...access.user, role: "admin" };
}

async function handleUsers(req, res) {
  if (req.method !== "GET") return methodNotAllowed(req, res, ["GET"]);
  if (!(await requireAdmin(req, res))) return;

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
        last_login_at: String(user.last_login_at || ""),
        last_seen_at: String(user.last_seen_at || ""),
      })),
    });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to load users" });
  }
}

async function handleHistory(req, res) {
  if (req.method !== "GET") return methodNotAllowed(req, res, ["GET"]);
  if (!(await requireAdmin(req, res))) return;

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
  if (!(await requireAdmin(req, res))) return;

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

async function handleUserRole(req, res) {
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST"]);
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const body = parseJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const role = String(body.role || "").trim().toLowerCase();
    if (!email) return send(res, 400, { error: "Email is required" });
    if (!["admin", "staff"].includes(role)) return send(res, 400, { error: "Role must be admin or staff" });

    if (email === String(admin.email || "").trim().toLowerCase() && role !== "admin") {
      return send(res, 400, { error: "Нельзя снять роль администратора с текущего аккаунта" });
    }

    if (role === "staff") {
      const users = await listUsers();
      const admins = users.filter((user) => String(user.role || "staff").toLowerCase() === "admin");
      if (admins.length <= 1 && admins.some((user) => String(user.email || "").toLowerCase() === email)) {
        return send(res, 400, { error: "В системе должен остаться хотя бы один администратор" });
      }
    }

    const updated = await updateUserByEmail(email, { role });
    if (!updated) return send(res, 404, { error: "User not found" });
    return send(res, 200, {
      ok: true,
      user: {
        email: updated.email,
        name: updated.name,
        first_name: updated.first_name || "",
        last_name: updated.last_name || "",
        role: updated.role || "staff",
        telegram_chat_id: updated.telegram_chat_id || "",
        low_stock_notifications: String(updated.low_stock_notifications || "1"),
        last_login_at: String(updated.last_login_at || ""),
        last_seen_at: String(updated.last_seen_at || ""),
      },
    });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to update user role" });
  }
}

async function handleUserDelete(req, res) {
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST"]);
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const body = parseJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return send(res, 400, { error: "Email is required" });
    if (email === String(admin.email || "").trim().toLowerCase()) {
      return send(res, 400, { error: "Нельзя удалить текущий аккаунт" });
    }

    const users = await listUsers();
    const target = users.find((user) => String(user.email || "").toLowerCase() === email);
    if (!target) return send(res, 404, { error: "User not found" });

    if (String(target.role || "staff").toLowerCase() === "admin") {
      const admins = users.filter((user) => String(user.role || "staff").toLowerCase() === "admin");
      if (admins.length <= 1) {
        return send(res, 400, { error: "В системе должен остаться хотя бы один администратор" });
      }
    }

    const deleted = await deleteUserByEmail(email);
    if (!deleted) return send(res, 404, { error: "User not found" });
    return send(res, 200, { ok: true, deletedEmail: email });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to delete user" });
  }
}

module.exports = async function handler(req, res) {
  const action = actionFromReq(req);
  if (action === "users") return handleUsers(req, res);
  if (action === "history") return handleHistory(req, res);
  if (action === "announce") return handleAnnounce(req, res);
  if (action === "user-role") return handleUserRole(req, res);
  if (action === "user-delete") return handleUserDelete(req, res);
  return send(res, 404, { error: "Unknown admin action" });
};
