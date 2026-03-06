const { findUserByEmail, listUsers, updateUserByEmail } = require("../../lib/sheets");
const { getBearerToken, hashPassword, signToken, verifyToken } = require("../../lib/security");
const { send, methodNotAllowed, parseJsonBody } = require("../../lib/http");

function normalizeToggle(raw, fallback = "1") {
  if (raw === undefined || raw === null || raw === "") return String(fallback);
  if (typeof raw === "boolean") return raw ? "1" : "0";
  const value = String(raw).trim().toLowerCase();
  if (value === "1" || value === "true" || value === "on" || value === "yes") return "1";
  if (value === "0" || value === "false" || value === "off" || value === "no") return "0";
  return String(fallback);
}

function notificationsEnabled(raw) {
  return normalizeToggle(raw, "1") === "1";
}

function normalizeReminderInterval(raw, fallback = "0") {
  const value = Number(raw ?? fallback ?? 0);
  if (!Number.isFinite(value) || value < 0) return "0";
  const rounded = Math.round(value);
  return String(rounded);
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

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "PATCH") {
    return methodNotAllowed(req, res, ["GET", "PATCH"]);
  }

  const token = getBearerToken(req);
  const auth = verifyToken(token);
  if (!auth?.email) {
    return send(res, 401, { error: "Unauthorized" });
  }

  try {
    const current = await findUserByEmail(auth.email);
    if (!current) {
      return send(res, 401, { error: "Unauthorized" });
    }

    if (req.method === "GET") {
      return send(res, 200, { user: publicUser(current) });
    }

    const body = parseJsonBody(req);
    const firstName = String(body.firstName || current.first_name || "").trim();
    const lastName = String(body.lastName || current.last_name || "").trim();
    const fullName = `${firstName} ${lastName}`.trim() || current.name || "Сотрудник";
    const nextEmail = String(body.email || current.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const telegramChatId = String(body.telegramChatId ?? current.telegram_chat_id ?? "").trim();
    const lowStock = normalizeToggle(body.lowStockNotifications, current.low_stock_notifications || "1");
    const reminderItems = normalizeReminderItemIds(body.reminderItemIds ?? current.reminder_item_ids ?? "");
    const reminderInterval = normalizeReminderInterval(
      body.reminderIntervalMinutes,
      current.reminder_interval_minutes || "0"
    );

    if (!nextEmail) {
      return send(res, 400, { error: "Email is required" });
    }

    if (password && password.length < 6) {
      return send(res, 400, { error: "Password must be at least 6 chars" });
    }

    if (nextEmail !== String(current.email || "").toLowerCase()) {
      const users = await listUsers();
      const exists = users.some((u) => String(u.email || "").toLowerCase() === nextEmail);
      if (exists) {
        return send(res, 409, { error: "User already exists" });
      }
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

    if (!updated) {
      return send(res, 404, { error: "User not found" });
    }

    return send(res, 200, {
      ok: true,
      token: tokenForUser(updated),
      user: publicUser(updated),
    });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to update profile" });
  }
};
