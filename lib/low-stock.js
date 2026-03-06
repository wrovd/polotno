const { sendTelegramMessage } = require("./telegram");

function lowStockTransition(prevFlag, qty, threshold) {
  const isLow = Number(qty) <= Number(threshold);

  if (isLow) {
    if (String(prevFlag || "0") === "1") {
      return { notify: false, nextFlag: "1" };
    }
    return { notify: true, nextFlag: "1" };
  }

  return { notify: false, nextFlag: "0" };
}

async function notifyLowStockToUser({ chatId, itemName, itemId, qty, threshold }) {
  if (!chatId) return { sent: false, reason: "missing_chat_id" };

  const text = [
    "Низкий остаток расходника",
    `• ${itemName} (${itemId})`,
    `• Остаток: ${qty}`,
    `• Лимит: ${threshold}`,
    "Нужно заказать или пополнить запас.",
  ].join("\n");

  await sendTelegramMessage(chatId, text);
  return { sent: true };
}

async function notifyLowStockToUsers({ users, itemName, itemId, qty, threshold }) {
  const list = Array.isArray(users) ? users : [];
  let sent = 0;
  for (const user of list) {
    const enabled = String(user?.low_stock_notifications ?? "1") !== "0";
    if (!enabled) continue;
    const chatId = String(user?.telegram_chat_id || "").trim();
    if (!chatId) continue;
    try {
      const result = await notifyLowStockToUser({ chatId, itemName, itemId, qty, threshold });
      if (result.sent) sent += 1;
    } catch {
      // continue notifying next users
    }
  }
  return sent;
}

module.exports = {
  lowStockTransition,
  notifyLowStockToUser,
  notifyLowStockToUsers,
};
