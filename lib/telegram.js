async function sendTelegramMessage(chatId, text, options = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is required");
  }

  const payload = {
    chat_id: chatId,
    text,
  };

  if (options.parse_mode) {
    payload.parse_mode = options.parse_mode;
  }

  if (Object.prototype.hasOwnProperty.call(options, "disable_web_page_preview")) {
    payload.disable_web_page_preview = Boolean(options.disable_web_page_preview);
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram API error: ${body}`);
  }

  return response.json();
}

function mimeByFilePath(filePath = "") {
  const p = String(filePath).toLowerCase();
  if (p.endsWith(".png")) return "image/png";
  if (p.endsWith(".webp")) return "image/webp";
  if (p.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

async function getTelegramProfilePhotoDataUrl(chatId) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is required");
  }

  const normalizedChatId = String(chatId || "").trim();
  if (!normalizedChatId) return "";

  const photosRes = await fetch(`https://api.telegram.org/bot${token}/getUserProfilePhotos?chat_id=${encodeURIComponent(normalizedChatId)}&limit=1`);
  if (!photosRes.ok) return "";
  const photosJson = await photosRes.json().catch(() => null);
  if (!photosJson?.ok) return "";

  const list = photosJson?.result?.photos;
  if (!Array.isArray(list) || !list.length || !Array.isArray(list[0]) || !list[0].length) {
    return "";
  }

  const bestSize = list[0][list[0].length - 1];
  const fileId = String(bestSize?.file_id || "").trim();
  if (!fileId) return "";

  const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`);
  if (!fileRes.ok) return "";
  const fileJson = await fileRes.json().catch(() => null);
  if (!fileJson?.ok) return "";

  const filePath = String(fileJson?.result?.file_path || "").trim();
  if (!filePath) return "";

  const imageRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  if (!imageRes.ok) return "";
  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  const mime = mimeByFilePath(filePath);
  return `data:${mime};base64,${imageBuffer.toString("base64")}`;
}

module.exports = {
  sendTelegramMessage,
  getTelegramProfilePhotoDataUrl,
};
