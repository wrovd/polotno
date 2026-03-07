const { listItems, listUsers } = require("../lib/sheets");
const { requireAuth } = require("../lib/auth");
const { sendTelegramMessage } = require("../lib/telegram");
const { send, methodNotAllowed } = require("../lib/http");

function actionFromReq(req) {
  return String(req.query?.action || "").trim().toLowerCase();
}

async function handleLowStock(req, res) {
  if (req.method !== "GET") return methodNotAllowed(req, res, ["GET"]);
  const auth = requireAuth(req);
  if (!auth.ok) return send(res, 401, { error: auth.error });

  try {
    const items = await listItems();
    const low = items.filter((item) => Number(item.qty) <= Number(item.threshold));
    return send(res, 200, { items: low });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to check low stock" });
  }
}

async function handleNotify(req, res) {
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST"]);
  const auth = requireAuth(req);
  if (!auth.ok) return send(res, 401, { error: auth.error });

  try {
    const items = await listItems();
    const low = items.filter((item) => Number(item.qty) <= Number(item.threshold));
    if (!low.length) return send(res, 200, { ok: true, sent: 0 });

    const lines = low.map((item) => `• ${item.name}: ${item.qty} (лимит ${item.threshold})`).join("\n");
    const text = `Низкий остаток расходников:\n${lines}`;

    const users = await listUsers();
    let sent = 0;
    for (const user of users) {
      const enabled = String(user?.low_stock_notifications ?? "1") !== "0";
      if (!enabled) continue;
      const chatId = String(user?.telegram_chat_id || "").trim();
      if (!chatId) continue;
      try {
        await sendTelegramMessage(chatId, text);
        sent += 1;
      } catch {
        // continue
      }
    }

    return send(res, 200, { ok: true, sent, recipients: sent });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to send notifications" });
  }
}

module.exports = async function handler(req, res) {
  const action = actionFromReq(req);
  if (action === "low-stock") return handleLowStock(req, res);
  if (action === "notify") return handleNotify(req, res);
  return send(res, 404, { error: "Unknown alerts action" });
};
