const { listUsers } = require("../../lib/sheets");
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
};
