const { createUser, listUsers } = require("../../lib/sheets");
const { hashPassword, getBearerToken, verifyToken } = require("../../lib/security");
const { send, methodNotAllowed, parseJsonBody } = require("../../lib/http");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(req, res, ["POST"]);
  }

  try {
    const body = parseJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim() || "Сотрудник";
    const adminKey = String(body.adminKey || "");
    const telegramChatId = String(body.telegramChatId || "").trim();

    if (!email || !password) {
      return send(res, 400, { error: "Email and password are required" });
    }

    if (password.length < 6) {
      return send(res, 400, { error: "Password must be at least 6 chars" });
    }

    const users = await listUsers();
    const hasUsers = users.length > 0;
    const token = getBearerToken(req);
    const authUser = verifyToken(token);
    const isAdminByRole = authUser?.role === "admin";
    const isAdminByKey = Boolean(process.env.ADMIN_KEY) && adminKey === process.env.ADMIN_KEY;

    if (hasUsers && !isAdminByRole && !isAdminByKey) {
      return send(res, 403, { error: "Admin access required" });
    }

    if (!hasUsers && !isAdminByKey) {
      return send(res, 403, { error: "Provide valid ADMIN_KEY to create first admin account" });
    }

    const exists = users.some((u) => u.email.toLowerCase() === email);
    if (exists) {
      return send(res, 409, { error: "User already exists" });
    }

    const roleRaw = String(body.role || "staff").toLowerCase();
    const role = hasUsers ? (roleRaw === "admin" ? "admin" : "staff") : "admin";
    const [firstName = "", ...rest] = name.split(/\s+/).filter(Boolean);
    const lastName = rest.join(" ");

    await createUser({
      email,
      name,
      password_hash: hashPassword(password),
      role,
      telegram_chat_id: telegramChatId,
      created_at: new Date().toISOString(),
      first_name: firstName,
      last_name: lastName,
      low_stock_notifications: "1",
      reminder_item_ids: "",
      reminder_interval_minutes: "0",
      reminder_last_sent_at: "",
    });

    return send(res, 201, { ok: true });
  } catch (error) {
    return send(res, 500, { error: error.message || "Create user failed" });
  }
};
