const { listUsers } = require("../../lib/sheets");
const { requireAuth, requireRole } = require("../../lib/auth");
const { send, methodNotAllowed, parseJsonBody } = require("../../lib/http");
const { sendTelegramMessage } = require("../../lib/telegram");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(req, res, ["POST"]);
  }

  const auth = requireAuth(req);
  const access = requireRole(auth, ["admin"]);
  if (!access.ok) {
    return send(res, access.code, { error: access.error });
  }

  try {
    const body = parseJsonBody(req);
    const message = String(body.message || "").trim();
    const role = String(body.role || "all").trim().toLowerCase();

    if (!message) {
      return send(res, 400, { error: "Message is required" });
    }

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
};
