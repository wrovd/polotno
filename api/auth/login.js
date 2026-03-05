const { listUsers } = require("../../lib/sheets");
const { verifyPassword, signToken } = require("../../lib/security");
const { send, methodNotAllowed, parseJsonBody } = require("../../lib/http");

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
      role: user.role || "staff",
      telegram_chat_id: user.telegram_chat_id || "",
    });

    return send(res, 200, {
      token,
      user: {
        email: user.email,
        name: user.name,
        role: user.role || "staff",
        telegram_chat_id: user.telegram_chat_id || "",
      },
    });
  } catch (error) {
    return send(res, 500, { error: error.message || "Login failed" });
  }
};
