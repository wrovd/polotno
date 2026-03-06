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

module.exports = {
  lowStockTransition,
  notifyLowStockToUser,
};
