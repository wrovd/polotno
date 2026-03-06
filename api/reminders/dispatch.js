const { listItems, listUsers, updateUserByEmail } = require("../../lib/sheets");
const { getBearerToken } = require("../../lib/security");
const { send, methodNotAllowed } = require("../../lib/http");
const { sendTelegramMessage } = require("../../lib/telegram");

function hasCronAccess(req) {
  const secret = process.env.REMINDERS_CRON_SECRET || process.env.CRON_SECRET || "";
  if (!secret) return true;
  const token = getBearerToken(req);
  return token === secret;
}

function parseReminderIds(raw) {
  return [...new Set(String(raw || "").split(",").map((x) => x.trim()).filter(Boolean))];
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(req, res, ["POST"]);
  }

  if (!hasCronAccess(req)) {
    return send(res, 401, { error: "Unauthorized" });
  }

  try {
    const [users, items] = await Promise.all([listUsers(), listItems()]);
    const byId = new Map(items.map((item) => [String(item.id), item]));
    const now = Date.now();
    let processed = 0;
    let sent = 0;

    for (const user of users) {
      const chatId = String(user.telegram_chat_id || "").trim();
      if (!chatId) continue;
      const intervalMinutes = Number(user.reminder_interval_minutes || 0);
      if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) continue;
      const ids = parseReminderIds(user.reminder_item_ids);
      if (!ids.length) continue;

      const lastAt = Date.parse(String(user.reminder_last_sent_at || ""));
      const dueAt = Number.isNaN(lastAt) ? 0 : lastAt + intervalMinutes * 60 * 1000;
      if (dueAt > now) continue;

      const selectedItems = ids.map((id) => byId.get(id)).filter(Boolean);
      if (!selectedItems.length) continue;

      const lines = selectedItems
        .map((item) => `• ${item.name} (${item.id}): ${item.qty} шт, лимит ${item.threshold}`)
        .join("\n");
      const text = `Напоминание по расходникам:\n${lines}`;

      try {
        await sendTelegramMessage(chatId, text);
        sent += 1;
        await updateUserByEmail(user.email, {
          reminder_last_sent_at: new Date(now).toISOString(),
        });
      } catch {
        // continue with next user
      }
      processed += 1;
    }

    return send(res, 200, { ok: true, processed, sent });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to dispatch reminders" });
  }
};
