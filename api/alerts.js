const crypto = require("crypto");
const { sql } = require("@vercel/postgres");
const { listItems, listUsers } = require("../lib/sheets");
const { requireAuth } = require("../lib/auth");
const {
  sendTelegramMessage,
  answerCallbackQuery,
  editTelegramMessageReplyMarkup,
} = require("../lib/telegram");
const { send, methodNotAllowed } = require("../lib/http");

let tildaOrderSchemaReady = false;
let tildaOrderSchemaPromise = null;

function actionFromReq(req) {
  return String(req.query?.action || "").trim().toLowerCase();
}

function queryValue(req, key) {
  const direct = req.query?.[key];
  if (direct) return Array.isArray(direct) ? direct[0] : direct;
  try {
    const url = new URL(req.url || "", "http://localhost");
    return url.searchParams.get(key) || "";
  } catch {
    return "";
  }
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

function parseMaybeJson(value) {
  if (typeof value !== "string") return value;
  const textValue = value.trim();
  if (!textValue) return "";
  if (!/^[\[{]/.test(textValue)) return value;
  try {
    return JSON.parse(textValue);
  } catch {
    return value;
  }
}

function parseUrlEncoded(value) {
  const params = new URLSearchParams(value);
  const result = {};
  for (const [key, itemValue] of params.entries()) {
    if (!Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = parseMaybeJson(itemValue);
    } else if (Array.isArray(result[key])) {
      result[key].push(parseMaybeJson(itemValue));
    } else {
      result[key] = [result[key], parseMaybeJson(itemValue)];
    }
  }
  return result;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1024 * 1024) {
        reject(new Error("Request body is too large"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

async function parseTildaBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    const contentType = String(req.headers["content-type"] || "").toLowerCase();
    if (contentType.includes("application/x-www-form-urlencoded")) return parseUrlEncoded(req.body);
    const parsed = parseMaybeJson(req.body);
    return parsed && typeof parsed === "object" ? parsed : parseUrlEncoded(req.body);
  }

  const raw = await readRawBody(req);
  if (!raw) return {};
  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  const parsed = parseMaybeJson(raw);
  if (parsed && typeof parsed === "object") return parsed;
  if (contentType.includes("application/json")) return {};
  return parseUrlEncoded(raw);
}

function normalizeBodyFields(body) {
  const fields = body.fields && typeof body.fields === "object" && !Array.isArray(body.fields) ? body.fields : {};
  const ignored = new Set(["fields", "meta", "products"]);
  const result = { ...fields };
  for (const [key, value] of Object.entries(body || {})) {
    if (ignored.has(key)) continue;
    if (value == null || typeof value === "object") continue;
    if (!Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = value;
    }
  }
  return result;
}

function normalizeProducts(products) {
  const parsedProducts = parseMaybeJson(products);
  if (typeof parsedProducts === "string" && parsedProducts.trim()) {
    return parsedProducts
      .split(/\n|;/)
      .map((line) => ({ name: cleanText(line), quantity: 1, price: "" }))
      .filter((product) => product.name);
  }
  if (!Array.isArray(parsedProducts)) return [];
  return parsedProducts
    .map((product) => ({
      name: firstNonEmpty(product?.name, product?.title, product?.product),
      quantity: firstNonEmpty(product?.quantity, product?.qty, product?.amount, 1),
      price: firstNonEmpty(product?.price, product?.sum, product?.total),
      sku: firstNonEmpty(product?.sku, product?.code, product?.barcode),
    }))
    .filter((product) => product.name);
}

async function ensureTildaOrderSchema() {
  if (tildaOrderSchemaReady) return;
  if (tildaOrderSchemaPromise) return tildaOrderSchemaPromise;

  tildaOrderSchemaPromise = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS tilda_order_calls (
        order_key TEXT PRIMARY KEY,
        order_id TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'new',
        updated_by TEXT NOT NULL DEFAULT '',
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS tilda_order_messages (
        order_key TEXT NOT NULL REFERENCES tilda_order_calls(order_key) ON DELETE CASCADE,
        chat_id TEXT NOT NULL,
        message_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (order_key, chat_id, message_id)
      )
    `;
    tildaOrderSchemaReady = true;
  })();

  try {
    await tildaOrderSchemaPromise;
  } finally {
    tildaOrderSchemaPromise = null;
  }
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
  const fields = normalizeBodyFields(body);
  const meta = body.meta && typeof body.meta === "object" ? body.meta : {};
  const productsSource = Array.isArray(body.products) || (body.products && typeof body.products === "object")
    ? body.products
    : firstNonEmpty(body.products, getField(fields, ["products", "Products", "Товары", "order"]));
  const products = normalizeProducts(productsSource);
  const orderId = firstNonEmpty(
    body.orderId,
    body.order_id,
    getField(fields, ["orderid", "Order ID", "Код платежа", "payment_id", "tranid", "requestid"]),
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

function getTildaOrderMeta(body) {
  const fields = normalizeBodyFields(body);
  const meta = body.meta && typeof body.meta === "object" ? body.meta : {};
  const productsSource = Array.isArray(body.products) || (body.products && typeof body.products === "object")
    ? body.products
    : firstNonEmpty(body.products, getField(fields, ["products", "Products", "Товары", "order"]));
  const products = normalizeProducts(productsSource)
    .map((product) => [product.name, product.quantity, product.price, product.sku].join(":"))
    .join("|");
  const orderId = firstNonEmpty(
    body.orderId,
    body.order_id,
    getField(fields, ["orderid", "Order ID", "Код платежа", "payment_id", "tranid", "requestid"]),
    body.clientEventId
  );
  const phone = firstNonEmpty(body.phone, getField(fields, ["Phone", "phone", "Телефон"]));
  const email = firstNonEmpty(body.email, getField(fields, ["Email", "email", "E-mail", "ma_email"]));
  const amount = firstNonEmpty(body.amount, getField(fields, ["amount", "Сумма платежа", "payment_amount"]));
  const requestId = firstNonEmpty(body.requestId, meta.requestId, getField(fields, ["tildaspec-formid", "formid", "Код заявки"]));
  const rawKey = firstNonEmpty(orderId, requestId, [phone, email, amount, products].join("::"), body.clientEventId, Date.now());
  const orderKey = crypto.createHash("sha256").update(String(rawKey)).digest("hex").slice(0, 24);
  return { orderKey, orderId, phone };
}

function normalizePhoneForTel(phone) {
  const raw = cleanText(phone);
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (raw.startsWith("+")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("8")) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith("7")) return `+${digits}`;
  return digits.length >= 10 ? `+${digits}` : digits;
}

function buildTildaOrderKeyboard(meta, status = "new") {
  const rows = [];
  const phone = normalizePhoneForTel(meta.phone);
  if (phone) {
    rows.push([{ text: "Позвонить", url: `tel:${phone}` }]);
  }
  rows.push([{
    text: status === "called" ? "Уже обзвонили" : "Новый",
    callback_data: `tilda_called:${meta.orderKey}`,
  }]);
  return { inline_keyboard: rows };
}

async function upsertTildaOrderCall(meta) {
  await ensureTildaOrderSchema();
  await sql`
    INSERT INTO tilda_order_calls (order_key, order_id, phone, status)
    VALUES (${meta.orderKey}, ${meta.orderId || ""}, ${meta.phone || ""}, 'new')
    ON CONFLICT (order_key) DO UPDATE SET
      order_id = COALESCE(NULLIF(EXCLUDED.order_id, ''), tilda_order_calls.order_id),
      phone = COALESCE(NULLIF(EXCLUDED.phone, ''), tilda_order_calls.phone)
  `;
  const { rows } = await sql`
    SELECT status
    FROM tilda_order_calls
    WHERE order_key = ${meta.orderKey}
    LIMIT 1
  `;
  return rows[0]?.status || "new";
}

async function saveTildaOrderMessage(orderKey, chatId, messageId) {
  if (!orderKey || !chatId || !messageId) return;
  await sql`
    INSERT INTO tilda_order_messages (order_key, chat_id, message_id)
    VALUES (${orderKey}, ${String(chatId)}, ${String(messageId)})
    ON CONFLICT DO NOTHING
  `;
}

const recentTildaOrderFingerprints = new Map();

function tildaOrderFingerprint(body) {
  const fields = normalizeBodyFields(body);
  const productsSource = Array.isArray(body.products) || (body.products && typeof body.products === "object")
    ? body.products
    : firstNonEmpty(body.products, getField(fields, ["products", "Products", "Товары", "order"]));
  const products = normalizeProducts(productsSource)
    .map((product) => [product.name, product.quantity, product.price].join(":"))
    .join("|");

  const stableKey = [
    firstNonEmpty(body.orderId, body.order_id),
    firstNonEmpty(body.email, getField(fields, ["Email", "email", "E-mail", "ma_email"])),
    firstNonEmpty(body.phone, getField(fields, ["Phone", "phone", "Телефон"])),
    firstNonEmpty(body.amount, getField(fields, ["amount", "Сумма платежа", "payment_amount"])),
    products,
  ].join("::");
  if (cleanText(stableKey).replace(/:+/g, "")) return stableKey;
  return firstNonEmpty(body.clientEventId);
}

function isRecentTildaDuplicate(body) {
  const ttlMs = 10000;
  const now = Date.now();
  for (const [key, timestamp] of recentTildaOrderFingerprints.entries()) {
    if (now - timestamp > ttlMs) recentTildaOrderFingerprints.delete(key);
  }

  const key = tildaOrderFingerprint(body);
  if (!cleanText(key).replace(/:+/g, "")) return false;
  if (recentTildaOrderFingerprints.has(key)) return true;
  recentTildaOrderFingerprints.set(key, now);
  return false;
}

async function handleTildaOrder(req, res) {
  setTildaCorsHeaders(req, res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST", "OPTIONS"]);

  const body = await parseTildaBody(req);
  const expectedSecret = String(process.env.TILDA_ORDER_WEBHOOK_SECRET || "").trim();
  const actualSecret = String(req.headers["x-polotno-tilda-secret"] || body._polotnoSecret || body.secret || queryValue(req, "secret")).trim();
  if (!expectedSecret) return send(res, 500, { error: "TILDA_ORDER_WEBHOOK_SECRET is required" });
  if (!actualSecret || actualSecret !== expectedSecret) return send(res, 401, { error: "Invalid Tilda webhook secret" });
  if (isRecentTildaDuplicate(body)) return send(res, 200, { ok: true, duplicate: true, sent: 0 });

  const chatIds = String(process.env.TILDA_ORDER_CHAT_ID || "")
    .split(/[,\s;]+/)
    .map((chatId) => chatId.trim())
    .filter(Boolean);
  if (!chatIds.length) return send(res, 500, { error: "TILDA_ORDER_CHAT_ID is required" });

  try {
    const text = buildTildaOrderMessage(body);
    const meta = getTildaOrderMeta(body);
    const status = await upsertTildaOrderCall(meta);
    const replyMarkup = buildTildaOrderKeyboard(meta, status);
    const results = await Promise.allSettled(chatIds.map(async (chatId) => {
      const result = await sendTelegramMessage(chatId, text, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: replyMarkup,
      });
      const messageId = result?.result?.message_id;
      await saveTildaOrderMessage(meta.orderKey, chatId, messageId);
      return result;
    }));
    const sent = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.length - sent;
    if (!sent) {
      const firstError = results.find((result) => result.status === "rejected")?.reason;
      throw firstError || new Error("Telegram delivery failed");
    }
    return send(res, 200, { ok: true, sent, failed });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to send Tilda order notification" });
  }
}

function telegramCallbackSenderName(callbackQuery) {
  const from = callbackQuery?.from || {};
  const fullName = [from.first_name, from.last_name].map(cleanText).filter(Boolean).join(" ");
  return firstNonEmpty(fullName, from.username ? `@${from.username}` : "", from.id);
}

async function handleTelegramCallback(req, res) {
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST"]);

  const body = await parseTildaBody(req);
  const expectedSecret = String(process.env.TELEGRAM_CALLBACK_SECRET || process.env.TILDA_ORDER_WEBHOOK_SECRET || "").trim();
  const actualSecret = String(body.secret || queryValue(req, "secret")).trim();
  if (!expectedSecret) return send(res, 500, { error: "TELEGRAM_CALLBACK_SECRET or TILDA_ORDER_WEBHOOK_SECRET is required" });
  if (!actualSecret || actualSecret !== expectedSecret) return send(res, 401, { error: "Invalid Telegram callback secret" });

  const callbackQuery = body.callback_query;
  const callbackId = callbackQuery?.id;
  const data = String(callbackQuery?.data || "");
  if (!data.startsWith("tilda_called:")) {
    await answerCallbackQuery(callbackId, "Действие не поддерживается").catch(() => null);
    return send(res, 200, { ok: true, ignored: true });
  }

  const orderKey = data.replace("tilda_called:", "").trim();
  if (!orderKey) {
    await answerCallbackQuery(callbackId, "Заказ не найден").catch(() => null);
    return send(res, 200, { ok: false, error: "Missing order key" });
  }

  try {
    await ensureTildaOrderSchema();
    const updatedBy = telegramCallbackSenderName(callbackQuery);
    const { rows: orderRows } = await sql`
      UPDATE tilda_order_calls
      SET status = 'called', updated_by = ${updatedBy}, updated_at = NOW()
      WHERE order_key = ${orderKey}
      RETURNING order_key, phone, status
    `;

    const order = orderRows[0];
    if (!order) {
      await answerCallbackQuery(callbackId, "Заказ не найден").catch(() => null);
      return send(res, 200, { ok: false, error: "Order not found" });
    }

    const replyMarkup = buildTildaOrderKeyboard(order, "called");
    const { rows: messageRows } = await sql`
      SELECT chat_id, message_id
      FROM tilda_order_messages
      WHERE order_key = ${orderKey}
    `;
    await Promise.allSettled(messageRows.map((message) => (
      editTelegramMessageReplyMarkup(message.chat_id, message.message_id, replyMarkup)
    )));
    await answerCallbackQuery(callbackId, "Статус обновлен: уже обзвонили").catch(() => null);
    return send(res, 200, { ok: true, updated: messageRows.length });
  } catch (error) {
    await answerCallbackQuery(callbackId, "Не получилось обновить статус").catch(() => null);
    return send(res, 500, { error: error.message || "Failed to process Telegram callback" });
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
  if (action === "telegram-callback") return handleTelegramCallback(req, res);
  return send(res, 404, { error: "Unknown alerts action" });
};
