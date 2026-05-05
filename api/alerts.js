const { listItems, listUsers } = require("../lib/sheets");
const { requireAuth } = require("../lib/auth");
const { sendTelegramMessage } = require("../lib/telegram");
const { send, methodNotAllowed, parseJsonBody } = require("../lib/http");

function actionFromReq(req) {
  return String(req.query?.action || "").trim().toLowerCase();
}

function setTildaCorsHeaders(req, res) {
  const allowedOrigin = String(process.env.TILDA_ALLOWED_ORIGIN || "*").trim();
  const requestOrigin = String(req.headers.origin || "").trim();
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin === "*" ? "*" : requestOrigin || allowedOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Polotno-Tilda-Secret");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cleanText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function firstNonEmpty(...values) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }
  return "";
}

function getField(fields, names) {
  const source = fields && typeof fields === "object" ? fields : {};
  const entries = Object.entries(source);
  for (const name of names) {
    const exact = source[name];
    if (cleanText(exact)) return cleanText(exact);
    const found = entries.find(([key]) => String(key).trim().toLowerCase() === String(name).trim().toLowerCase());
    if (found && cleanText(found[1])) return cleanText(found[1]);
  }
  return "";
}

function normalizeProducts(products) {
  if (!Array.isArray(products)) return [];
  return products
    .map((product) => ({
      name: firstNonEmpty(product?.name, product?.title, product?.product),
      quantity: firstNonEmpty(product?.quantity, product?.qty, product?.amount, 1),
      price: firstNonEmpty(product?.price, product?.sum, product?.total),
      sku: firstNonEmpty(product?.sku, product?.code, product?.barcode),
    }))
    .filter((product) => product.name);
}

function formatProductLine(product, index) {
  const name = escapeHtml(product.name);
  const price = cleanText(product.price);
  const quantity = cleanText(product.quantity || 1);
  const pricePart = price ? `: ${escapeHtml(price)}` : "";
  const qtyPart = quantity ? ` (${escapeHtml(quantity)} x ${escapeHtml(price || quantity)})` : "";
  return `${index + 1}. <i>${name}${pricePart}${qtyPart}</i>`;
}

function appendItalicLine(lines, label, value) {
  const text = cleanText(value);
  if (!text) return;
  lines.push(`<i>${escapeHtml(label)}: ${escapeHtml(text)}</i>`);
}

function buildTildaOrderMessage(body) {
  const fields = body.fields && typeof body.fields === "object" ? body.fields : {};
  const meta = body.meta && typeof body.meta === "object" ? body.meta : {};
  const products = normalizeProducts(body.products);
  const orderId = firstNonEmpty(
    body.orderId,
    body.order_id,
    getField(fields, ["orderid", "Order ID", "Код платежа", "payment_id"]),
    Date.now()
  );
  const amount = firstNonEmpty(body.amount, getField(fields, ["amount", "Сумма платежа", "payment_amount"]));
  const currency = firstNonEmpty(body.currency, getField(fields, ["currency"]), "RUB");
  const customerName = firstNonEmpty(body.customerName, getField(fields, ["Name", "name", "Имя", "ФИО"]));
  const email = firstNonEmpty(body.email, getField(fields, ["Email", "email", "E-mail", "ma_email"]));
  const phone = firstNonEmpty(body.phone, getField(fields, ["Phone", "phone", "Телефон"]));
  const delivery = firstNonEmpty(body.delivery, getField(fields, ["Delivery", "delivery", "Способ доставки"]));
  const deliveryAddress = firstNonEmpty(body.deliveryAddress, getField(fields, ["Address", "address", "Адрес доставки"]));
  const comment = firstNonEmpty(body.comment, getField(fields, ["Comment", "comment", "Комментарий"]));
  const paymentProvider = firstNonEmpty(body.paymentProvider, getField(fields, ["paymentProvider", "payment_system", "payment"]), "Tilda");
  const paymentCode = firstNonEmpty(body.paymentCode, getField(fields, ["payment_id", "paymentid", "Код платежа"]), orderId);
  const paidStatus = firstNonEmpty(body.paymentStatus, getField(fields, ["paymentStatus", "payment_status"]));
  const requestId = firstNonEmpty(body.requestId, meta.requestId, getField(fields, ["tildaspec-formid", "formid", "Код заявки"]));
  const blockId = firstNonEmpty(body.blockId, meta.blockId, getField(fields, ["tildaspec-recid", "recid", "Код блока"]));
  const formName = firstNonEmpty(body.formName, meta.formName, getField(fields, ["formname", "Form"]), "Cart");
  const pageUrl = firstNonEmpty(body.pageUrl, meta.pageUrl);

  const lines = [`<b>Заказ №${escapeHtml(orderId)}</b>`];
  if (products.length) {
    products.forEach((product, index) => lines.push(formatProductLine(product, index)));
  } else {
    lines.push("<i>Состав заказа не передан.</i>");
  }

  const isPaid = /paid|оплачен|success|yes|true/i.test(paidStatus);
  lines.push(`<i>${isPaid ? "Заказ оплачен." : "Новый заказ. Оплата пока не подтверждена."}</i>`);
  if (delivery) lines.push(`<i>${escapeHtml(delivery)}</i>`);
  appendItalicLine(lines, "Адрес доставки", deliveryAddress);
  appendItalicLine(lines, "ФИО", customerName);
  appendItalicLine(lines, "Комментарий", comment);
  if (amount) appendItalicLine(lines, "Сумма платежа", `${amount} ${currency}`);
  if (paymentCode) appendItalicLine(lines, "Код платежа", `${paymentProvider}: ${paymentCode}`);

  lines.push("");
  lines.push("<b>Информация о покупателе:</b>");
  lines.push(`Name: ${escapeHtml(customerName || getField(fields, ["ma_name"]) || "—")}`);
  lines.push(`Email: ${escapeHtml(email || "—")}`);
  lines.push(`Phone: ${escapeHtml(phone || "—")}`);

  const preferredFieldNames = ["Checkbox", "ma_name", "ma_email", "ma_id"];
  for (const name of preferredFieldNames) {
    const value = getField(fields, [name]);
    if (value) lines.push(`${escapeHtml(name)}: ${escapeHtml(value)}`);
  }

  lines.push("");
  lines.push("<b>Дополнительная информация:</b>");
  if (requestId) lines.push(`<i>Код заявки: ${escapeHtml(requestId)}</i>`);
  if (blockId) lines.push(`<i>Код блока: ${escapeHtml(blockId)}</i>`);
  lines.push(`<i>Форма: ${escapeHtml(formName)}</i>`);
  if (pageUrl) lines.push(escapeHtml(pageUrl));
  lines.push("----");

  return lines.join("\n");
}

async function handleTildaOrder(req, res) {
  setTildaCorsHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST", "OPTIONS"]);

  const body = parseJsonBody(req);
  const expectedSecret = String(process.env.TILDA_ORDER_WEBHOOK_SECRET || "").trim();
  const actualSecret = String(req.headers["x-polotno-tilda-secret"] || body._polotnoSecret || "").trim();
  if (!expectedSecret) return send(res, 500, { error: "TILDA_ORDER_WEBHOOK_SECRET is required" });
  if (!actualSecret || actualSecret !== expectedSecret) return send(res, 401, { error: "Invalid Tilda webhook secret" });

  const chatId = String(process.env.TILDA_ORDER_CHAT_ID || "").trim();
  if (!chatId) return send(res, 500, { error: "TILDA_ORDER_CHAT_ID is required" });

  try {
    const text = buildTildaOrderMessage(body);
    await sendTelegramMessage(chatId, text, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
    return send(res, 200, { ok: true });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to send Tilda order notification" });
  }
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
  if (action === "tilda-order") return handleTildaOrder(req, res);
  return send(res, 404, { error: "Unknown alerts action" });
};
