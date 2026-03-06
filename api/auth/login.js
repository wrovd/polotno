const { listUsers } = require("../../lib/sheets");
const { verifyPassword, signToken } = require("../../lib/security");
const { send, methodNotAllowed, parseJsonBody } = require("../../lib/http");

function notificationsEnabled(raw) {
  const value = String(raw ?? "1").trim().toLowerCase();
  return !(value === "0" || value === "false" || value === "off" || value === "no");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(req, res, ["POST"]);
  }

  try {
    const body = parseJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return send(res, 400, { error: "Email and password are required" });
    }

    const users = await listUsers();
    const user = users.find((row) => row.email.toLowerCase() === email);

    if (!user || !verifyPassword(password, user.password_hash)) {
      return send(res, 401, { error: "Invalid credentials" });
    }

    const token = signToken({
      email: user.email,
      name: user.name,
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      role: user.role || "staff",
      telegram_chat_id: user.telegram_chat_id || "",
      low_stock_notifications: user.low_stock_notifications || "1",
    });

    return send(res, 200, {
      token,
      user: {
        email: user.email,
        name: user.name,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        role: user.role || "staff",
        telegram_chat_id: user.telegram_chat_id || "",
        low_stock_notifications: user.low_stock_notifications || "1",
        notifications_enabled: notificationsEnabled(user.low_stock_notifications),
      },
    });
  } catch (error) {
    return send(res, 500, { error: error.message || "Login failed" });
  }
};
