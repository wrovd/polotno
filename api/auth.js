const crypto = require("node:crypto");
const {
  createUser,
  findUserByEmail,
  listUsers,
  updateUserByEmail,
  createQrLoginSession,
  findQrLoginSessionByPollKey,
  findQrLoginSessionByCode,
  confirmQrLoginSession,
  consumeQrLoginSessionByPollKey,
} = require("../lib/sheets");
const { getBearerToken, hashPassword, signToken, verifyPassword, verifyToken } = require("../lib/security");
const { send, methodNotAllowed, parseJsonBody } = require("../lib/http");
const { getTelegramProfilePhotoDataUrl } = require("../lib/telegram");

function actionFromReq(req) {
  return String(req.query?.action || "").trim().toLowerCase();
}

function notificationsEnabled(raw) {
  const value = String(raw ?? "1").trim().toLowerCase();
  return !(value === "0" || value === "false" || value === "off" || value === "no");
}

function normalizeToggle(raw, fallback = "1") {
  if (raw === undefined || raw === null || raw === "") return String(fallback);
  if (typeof raw === "boolean") return raw ? "1" : "0";
  const value = String(raw).trim().toLowerCase();
  if (value === "1" || value === "true" || value === "on" || value === "yes") return "1";
  if (value === "0" || value === "false" || value === "off" || value === "no") return "0";
  return String(fallback);
}

function normalizeReminderInterval(raw, fallback = "0") {
  const value = Number(raw ?? fallback ?? 0);
  if (!Number.isFinite(value) || value < 0) return "0";
  return String(Math.round(value));
}

function normalizeReminderItemIds(raw) {
  const array = Array.isArray(raw) ? raw : String(raw || "").split(",");
  return [...new Set(array.map((x) => String(x || "").trim()).filter(Boolean))];
}

function publicUser(user) {
  return {
    email: user.email,
    name: user.name,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    role: user.role || "staff",
    telegram_chat_id: user.telegram_chat_id || "",
    low_stock_notifications: normalizeToggle(user.low_stock_notifications, "1"),
    notifications_enabled: notificationsEnabled(user.low_stock_notifications),
    reminder_item_ids: normalizeReminderItemIds(user.reminder_item_ids || ""),
    reminder_interval_minutes: normalizeReminderInterval(user.reminder_interval_minutes, "0"),
    reminder_last_sent_at: String(user.reminder_last_sent_at || ""),
  };
}

function tokenForUser(user) {
  return signToken({
    email: user.email,
    name: user.name,
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    role: user.role || "staff",
    telegram_chat_id: user.telegram_chat_id || "",
    low_stock_notifications: normalizeToggle(user.low_stock_notifications, "1"),
    reminder_item_ids: String(user.reminder_item_ids || ""),
    reminder_interval_minutes: normalizeReminderInterval(user.reminder_interval_minutes, "0"),
  });
}

function randomToken(size = 24) {
  return crypto.randomBytes(size).toString("base64url");
}

function firstHeaderValue(req, names) {
  for (const name of names) {
    const value = req.headers?.[name];
    if (Array.isArray(value) && value.length) return String(value[0] || "").trim();
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function clientIpFromReq(req) {
  const forwarded = firstHeaderValue(req, ["x-forwarded-for", "x-real-ip", "client-ip"]);
  const ip = forwarded.split(",").map((part) => part.trim()).find(Boolean) || "";
  return ip || String(req.socket?.remoteAddress || "").replace(/^::ffff:/, "").trim();
}

function countryFromReq(req) {
  const code = firstHeaderValue(req, ["x-vercel-ip-country", "cf-ipcountry", "x-country-code"]);
  if (!code || code.toUpperCase() === "XX") return "Страна неизвестна";
  try {
    return new Intl.DisplayNames(["ru"], { type: "region" }).of(code.toUpperCase()) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function cleanClientHint(value) {
  return String(value || "").replace(/^"|"$/g, "").trim();
}

function deviceFromReq(req) {
  const platformHint = cleanClientHint(firstHeaderValue(req, ["sec-ch-ua-platform"]));
  const platformVersion = cleanClientHint(firstHeaderValue(req, ["sec-ch-ua-platform-version"]));
  if (/Windows/i.test(platformHint)) {
    const major = Number(platformVersion.split(".")[0] || 0);
    if (major >= 13) return "Windows 11";
    return "Windows";
  }
  if (/macOS/i.test(platformHint)) return "macOS";
  if (/iOS/i.test(platformHint)) return "iOS";
  if (/Android/i.test(platformHint)) return "Android";
  if (/Linux/i.test(platformHint)) return "Linux";

  return deviceFromUserAgent(firstHeaderValue(req, ["user-agent"]));
}

function deviceFromUserAgent(userAgent) {
  const ua = String(userAgent || "");
  if (/Windows NT 10\.0/i.test(ua)) return "Windows";
  if (/Windows NT 6\.3/i.test(ua)) return "Windows 8.1";
  if (/Windows NT 6\.2/i.test(ua)) return "Windows 8";
  if (/Windows NT 6\.1/i.test(ua)) return "Windows 7";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return /Mobile/i.test(ua) ? "Android" : "Android-планшет";
  if (/Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Устройство неизвестно";
}

function qrClientMetaFromReq(req) {
  const device = deviceFromReq(req);
  const country = countryFromReq(req);
  const ip = clientIpFromReq(req);
  return {
    device,
    country,
    deviceLabel: `${device}, ${country}`,
    ip: ip || "IP не определен",
  };
}

function qrPayloadByCode(code, clientMeta = {}) {
  return JSON.stringify({
    type: "polotno_qr_login",
    v: 1,
    code,
    device: clientMeta.deviceLabel || clientMeta.device || "Устройство неизвестно",
    country: clientMeta.country || "Страна неизвестна",
    ip: clientMeta.ip || "IP не определен",
  });
}

async function handleLogin(req, res) {
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST"]);
  try {
    const body = parseJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) return send(res, 400, { error: "Email and password are required" });

    const user = await findUserByEmail(email);
    if (!user) {
      const users = await listUsers();
      if (!users.length) {
        return send(res, 401, { error: "Нет пользователей в базе. Создайте первого админа через вкладку 'Админ' с ADMIN_KEY" });
      }
      return send(res, 401, { error: "Invalid credentials" });
    }

    if (!verifyPassword(password, user.password_hash)) {
      return send(res, 401, { error: "Invalid credentials" });
    }

    return send(res, 200, {
      token: tokenForUser(user),
      user: publicUser(user),
    });
  } catch (error) {
    return send(res, 500, { error: error.message || "Login failed" });
  }
}

async function handleCreateUser(req, res) {
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST"]);
  try {
    const body = parseJsonBody(req);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const name = String(body.name || "").trim() || "Сотрудник";
    const adminKey = String(body.adminKey || "");
    const telegramChatId = String(body.telegramChatId || "").trim();

    if (!email || !password) return send(res, 400, { error: "Email and password are required" });
    if (password.length < 6) return send(res, 400, { error: "Password must be at least 6 chars" });

    const users = await listUsers();
    const hasUsers = users.length > 0;
    const token = getBearerToken(req);
    const authUser = verifyToken(token);
    const isAdminByRole = authUser?.role === "admin";
    const isAdminByKey = Boolean(process.env.ADMIN_KEY) && adminKey === process.env.ADMIN_KEY;

    if (hasUsers && !isAdminByRole && !isAdminByKey) {
      return send(res, 403, { error: "Admin access required" });
    }
    if (!hasUsers && !isAdminByKey) {
      return send(res, 403, { error: "Provide valid ADMIN_KEY to create first admin account" });
    }

    const exists = users.some((u) => String(u.email || "").toLowerCase() === email);
    if (exists) return send(res, 409, { error: "User already exists" });

    const roleRaw = String(body.role || "staff").toLowerCase();
    const role = hasUsers ? (roleRaw === "admin" ? "admin" : "staff") : "admin";
    const [firstName = "", ...rest] = name.split(/\s+/).filter(Boolean);
    const lastName = rest.join(" ");

    await createUser({
      email,
      name,
      password_hash: hashPassword(password),
      role,
      telegram_chat_id: telegramChatId,
      created_at: new Date().toISOString(),
      first_name: firstName,
      last_name: lastName,
      low_stock_notifications: "1",
      reminder_item_ids: "",
      reminder_interval_minutes: "0",
      reminder_last_sent_at: "",
    });

    return send(res, 201, { ok: true });
  } catch (error) {
    return send(res, 500, { error: error.message || "Create user failed" });
  }
}

async function handleProfile(req, res) {
  if (req.method !== "GET" && req.method !== "PATCH") {
    return methodNotAllowed(req, res, ["GET", "PATCH"]);
  }

  const token = getBearerToken(req);
  const auth = verifyToken(token);
  if (!auth?.email) return send(res, 401, { error: "Unauthorized" });

  try {
    const current = await findUserByEmail(auth.email);
    if (!current) return send(res, 401, { error: "Unauthorized" });

    if (req.method === "GET") return send(res, 200, { user: publicUser(current) });

    const body = parseJsonBody(req);
    const firstName = String(body.firstName || current.first_name || "").trim();
    const lastName = String(body.lastName || current.last_name || "").trim();
    const fullName = `${firstName} ${lastName}`.trim() || current.name || "Сотрудник";
    const nextEmail = String(body.email || current.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const telegramChatId = String(body.telegramChatId ?? current.telegram_chat_id ?? "").trim();
    const lowStock = normalizeToggle(body.lowStockNotifications, current.low_stock_notifications || "1");
    const reminderItems = normalizeReminderItemIds(body.reminderItemIds ?? current.reminder_item_ids ?? "");
    const reminderInterval = normalizeReminderInterval(body.reminderIntervalMinutes, current.reminder_interval_minutes || "0");

    if (!nextEmail) return send(res, 400, { error: "Email is required" });
    if (password && password.length < 6) {
      return send(res, 400, { error: "Password must be at least 6 chars" });
    }

    if (nextEmail !== String(current.email || "").toLowerCase()) {
      const users = await listUsers();
      const exists = users.some((u) => String(u.email || "").toLowerCase() === nextEmail);
      if (exists) return send(res, 409, { error: "User already exists" });
    }

    const updated = await updateUserByEmail(current.email, {
      email: nextEmail,
      name: fullName,
      first_name: firstName,
      last_name: lastName,
      password_hash: password ? hashPassword(password) : current.password_hash,
      telegram_chat_id: telegramChatId,
      low_stock_notifications: lowStock,
      reminder_item_ids: reminderItems.join(","),
      reminder_interval_minutes: reminderInterval,
    });

    if (!updated) return send(res, 404, { error: "User not found" });

    return send(res, 200, {
      ok: true,
      token: tokenForUser(updated),
      user: publicUser(updated),
    });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to update profile" });
  }
}

async function handleProfilePhoto(req, res) {
  if (req.method !== "GET") return methodNotAllowed(req, res, ["GET"]);
  const token = getBearerToken(req);
  const auth = verifyToken(token);
  if (!auth?.email) return send(res, 401, { error: "Unauthorized" });

  try {
    const current = await findUserByEmail(auth.email);
    if (!current) return send(res, 401, { error: "Unauthorized" });
    const chatId = String(current.telegram_chat_id || "").trim();
    if (!chatId) return send(res, 200, { photoDataUrl: "" });

    const photoDataUrl = await getTelegramProfilePhotoDataUrl(chatId);
    return send(res, 200, { photoDataUrl });
  } catch (error) {
    return send(res, 200, { photoDataUrl: "" });
  }
}

async function handleQrStart(req, res) {
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST"]);
  try {
    const sessionId = randomToken(16);
    const loginCode = randomToken(20);
    const pollKey = randomToken(28);
    const ttlMs = 2 * 60 * 1000;
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    const clientMeta = qrClientMetaFromReq(req);

    await createQrLoginSession({
      id: sessionId,
      login_code: loginCode,
      poll_key: pollKey,
      status: "pending",
      user_email: "",
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    });

    return send(res, 200, {
      ok: true,
      pollKey,
      expiresAt,
      qrPayload: qrPayloadByCode(loginCode, clientMeta),
    });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to create QR login session" });
  }
}

async function handleQrStatus(req, res) {
  if (req.method !== "GET") return methodNotAllowed(req, res, ["GET"]);
  try {
    const pollKey = String(req.query?.pollKey || req.query?.poll_key || "").trim();
    if (!pollKey) return send(res, 400, { error: "pollKey is required" });

    const session = await findQrLoginSessionByPollKey(pollKey);
    if (!session) return send(res, 404, { error: "QR session not found" });
    const expired = new Date(session.expires_at).getTime() <= Date.now();
    if (expired) return send(res, 200, { ok: true, status: "expired" });

    if (session.status !== "confirmed") {
      return send(res, 200, { ok: true, status: session.status || "pending" });
    }

    const user = await findUserByEmail(session.user_email);
    if (!user) return send(res, 200, { ok: true, status: "pending" });

    const consumed = await consumeQrLoginSessionByPollKey(pollKey);
    if (!consumed) {
      return send(res, 200, { ok: true, status: "consumed" });
    }

    return send(res, 200, {
      ok: true,
      status: "confirmed",
      token: tokenForUser(user),
      user: publicUser(user),
    });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to check QR login status" });
  }
}

async function handleQrConfirm(req, res) {
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST"]);
  const token = getBearerToken(req);
  const auth = verifyToken(token);
  if (!auth?.email) return send(res, 401, { error: "Unauthorized" });

  try {
    const body = parseJsonBody(req);
    const loginCode = String(body.code || body.loginCode || "").trim();
    if (!loginCode) return send(res, 400, { error: "code is required" });

    const existing = await findQrLoginSessionByCode(loginCode);
    if (!existing) return send(res, 404, { error: "QR session not found" });

    const expired = new Date(existing.expires_at).getTime() <= Date.now();
    if (expired) return send(res, 400, { error: "QR code expired" });
    if (existing.status !== "pending") {
      return send(res, 400, { error: "QR code already used" });
    }

    const confirmed = await confirmQrLoginSession(loginCode, auth.email);
    if (!confirmed) return send(res, 400, { error: "Unable to confirm QR login" });
    return send(res, 200, { ok: true });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to confirm QR login" });
  }
}

module.exports = async function handler(req, res) {
  const action = actionFromReq(req);
  if (action === "login") return handleLogin(req, res);
  if (action === "create-user") return handleCreateUser(req, res);
  if (action === "profile") return handleProfile(req, res);
  if (action === "profile-photo") return handleProfilePhoto(req, res);
  if (action === "qr-start") return handleQrStart(req, res);
  if (action === "qr-status") return handleQrStatus(req, res);
  if (action === "qr-confirm") return handleQrConfirm(req, res);
  return send(res, 404, { error: "Unknown auth action" });
};
