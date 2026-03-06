const { listItems, findUserByEmail } = require("../../lib/sheets");
const { requireAuth } = require("../../lib/auth");
const { sendTelegramMessage } = require("../../lib/telegram");
const { send, methodNotAllowed } = require("../../lib/http");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(req, res, ["POST"]);
  }

  const auth = requireAuth(req);
  if (!auth.ok) {
    return send(res, 401, { error: auth.error });
  }

  try {
    const items = await listItems();
    const low = items.filter((item) => Number(item.qty) <= Number(item.threshold));

    if (!low.length) {
      return send(res, 200, { ok: true, sent: 0 });
    }

    const actor = await findUserByEmail(auth.user.email);
    const notifyOnLow = String(actor?.low_stock_notifications ?? "1") !== "0";
    if (!notifyOnLow) {
      return send(res, 200, { ok: true, sent: 0, disabled: true });
    }

    const chatId = actor?.telegram_chat_id || auth.user.telegram_chat_id || process.env.TELEGRAM_DEFAULT_CHAT_ID;
    if (!chatId) {
      return send(res, 400, { error: "No personal chat id configured" });
    }

    const lines = low.map((item) => `• ${item.name}: ${item.qty} (лимит ${item.threshold})`).join("\n");
    const text = `Низкий остаток расходников:\n${lines}`;

    await sendTelegramMessage(chatId, text);

    return send(res, 200, { ok: true, sent: low.length });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to send notifications" });
  }
};
