const { google } = require("googleapis");

const USERS_HEADERS = [
  "email",
  "name",
  "password_hash",
  "role",
  "telegram_chat_id",
  "created_at",
  "first_name",
  "last_name",
  "low_stock_notifications",
  "reminder_item_ids",
  "reminder_interval_minutes",
  "reminder_last_sent_at",
];
const ITEMS_HEADERS = [
  "id",
  "name",
  "qty",
  "threshold",
  "notes",
  "updated_at",
  "updated_by",
  "low_notified",
  "group_name",
];
const MOVEMENTS_HEADERS = ["item_id", "delta", "reason", "user_email", "created_at"];
const GROUPS_HEADERS = ["id", "name", "created_at", "created_by"];
const BOOTSTRAP_TTL_MS = 5 * 60 * 1000;

let knownSheetsCache = null;
let headersVerifiedAt = 0;
let bootstrapPromise = null;

function env(name, fallback = "") {
  return process.env[name] || fallback;
}

function getSheetsClient() {
  const clientEmail = env("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  const privateKeyRaw = env("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    throw new Error("Google service account credentials are required");
  }

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

function spreadsheetId() {
  const id = env("GOOGLE_SHEETS_SPREADSHEET_ID");
  if (!id) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is required");
  return id;
}

function usersSheet() {
  return env("GOOGLE_USERS_SHEET", "users");
}

function itemsSheet() {
  return env("GOOGLE_ITEMS_SHEET", "inventory");
}

function movementsSheet() {
  return env("GOOGLE_MOVEMENTS_SHEET", "movements");
}

function groupsSheet() {
  return env("GOOGLE_GROUPS_SHEET", "groups");
}

function safeSheetName(sheetName) {
  return `'${String(sheetName || "").replace(/'/g, "''")}'`;
}

function sheetRange(sheetName, range = "A:Z") {
  return `${safeSheetName(sheetName)}!${range}`;
}

async function readRange(range) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range,
  });
  return res.data.values || [];
}

async function hasSheet(sheetName) {
  if (!knownSheetsCache) {
    const sheets = getSheetsClient();
    const meta = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId(),
      fields: "sheets.properties.title",
    });
    knownSheetsCache = new Set(
      (meta.data.sheets || []).map((s) => String(s.properties?.title || "").trim().toLowerCase())
    );
  }

  return knownSheetsCache.has(String(sheetName || "").trim().toLowerCase());
}

async function ensureSheetExists(sheetName) {
  if (await hasSheet(sheetName)) return;
  const sheets = getSheetsClient();
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: spreadsheetId(),
    requestBody: {
      requests: [{ addSheet: { properties: { title: String(sheetName) } } }],
    },
  });
  if (!knownSheetsCache) {
    knownSheetsCache = new Set();
  }
  knownSheetsCache.add(String(sheetName || "").trim().toLowerCase());
}

async function appendRow(sheetName, values) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: sheetRange(sheetName, "A:Z"),
    valueInputOption: "RAW",
    requestBody: {
      values: [values],
    },
  });
}

async function updateRow(sheetName, rowIndex1Based, rowValues) {
  const sheets = getSheetsClient();
  const rowNumber = Number(rowIndex1Based);
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: sheetRange(sheetName, `A${rowNumber}:Z${rowNumber}`),
    valueInputOption: "RAW",
    requestBody: {
      values: [rowValues],
    },
  });
}

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map((row, rowIndex) => {
    const obj = { _row: rowIndex + 2 };
    headers.forEach((header, idx) => {
      obj[header] = row[idx] ?? "";
    });
    return obj;
  });
}

async function ensureHeaders(sheetName, headers) {
  await ensureSheetExists(sheetName);
  const values = await readRange(sheetRange(sheetName, "A1:Z1"));
  if (!values.length) {
    await appendRow(sheetName, headers);
    return;
  }

  const firstRow = values[0];
  const mismatch = headers.some((header, i) => firstRow[i] !== header);
  if (mismatch) {
    await updateRow(sheetName, 1, headers);
  }
}

async function bootstrapSheets() {
  const now = Date.now();
  if (headersVerifiedAt && now - headersVerifiedAt < BOOTSTRAP_TTL_MS) {
    return;
  }

  if (bootstrapPromise) {
    await bootstrapPromise;
    return;
  }

  bootstrapPromise = (async () => {
    await ensureHeaders(usersSheet(), USERS_HEADERS);
    await ensureHeaders(itemsSheet(), ITEMS_HEADERS);
    await ensureHeaders(movementsSheet(), MOVEMENTS_HEADERS);
    await ensureHeaders(groupsSheet(), GROUPS_HEADERS);
    headersVerifiedAt = Date.now();
  })();

  try {
    await bootstrapPromise;
  } finally {
    bootstrapPromise = null;
  }
}

async function listUsers() {
  await bootstrapSheets();
  const rows = await readRange(sheetRange(usersSheet(), "A1:Z"));
  return rowsToObjects(rows).map((row) => ({
    ...row,
    first_name: String(row.first_name || "").trim(),
    last_name: String(row.last_name || "").trim(),
    low_stock_notifications: String(row.low_stock_notifications || "1"),
    reminder_item_ids: String(row.reminder_item_ids || "").trim(),
    reminder_interval_minutes: String(row.reminder_interval_minutes || "0").trim(),
    reminder_last_sent_at: String(row.reminder_last_sent_at || "").trim(),
  }));
}

async function createUser(user) {
  await bootstrapSheets();
  await appendRow(usersSheet(), [
    user.email,
    user.name,
    user.password_hash,
    user.role,
    user.telegram_chat_id || "",
    user.created_at,
    user.first_name || "",
    user.last_name || "",
    String(user.low_stock_notifications ?? "1"),
    String(user.reminder_item_ids || ""),
    String(user.reminder_interval_minutes ?? "0"),
    String(user.reminder_last_sent_at || ""),
  ]);
}

async function findUserByEmail(email) {
  const needle = String(email || "").trim().toLowerCase();
  if (!needle) return null;
  const users = await listUsers();
  return users.find((u) => String(u.email || "").toLowerCase() === needle) || null;
}

async function updateUserByEmail(email, nextUser) {
  const existing = await findUserByEmail(email);
  if (!existing) return null;

  const merged = {
    ...existing,
    ...nextUser,
    email: String(nextUser.email || existing.email || "").trim().toLowerCase(),
    name: String(nextUser.name || existing.name || "").trim(),
    password_hash: String(nextUser.password_hash || existing.password_hash || ""),
    role: String(nextUser.role || existing.role || "staff").trim().toLowerCase(),
    telegram_chat_id: String(nextUser.telegram_chat_id || existing.telegram_chat_id || "").trim(),
    created_at: String(existing.created_at || nextUser.created_at || new Date().toISOString()),
    first_name: String(nextUser.first_name || existing.first_name || "").trim(),
    last_name: String(nextUser.last_name || existing.last_name || "").trim(),
    low_stock_notifications: String(
      nextUser.low_stock_notifications ?? existing.low_stock_notifications ?? "1"
    ),
    reminder_item_ids: String(nextUser.reminder_item_ids ?? existing.reminder_item_ids ?? ""),
    reminder_interval_minutes: String(nextUser.reminder_interval_minutes ?? existing.reminder_interval_minutes ?? "0"),
    reminder_last_sent_at: String(nextUser.reminder_last_sent_at ?? existing.reminder_last_sent_at ?? ""),
  };

  await updateRow(usersSheet(), existing._row, [
    merged.email,
    merged.name,
    merged.password_hash,
    merged.role,
    merged.telegram_chat_id,
    merged.created_at,
    merged.first_name,
    merged.last_name,
    merged.low_stock_notifications,
    merged.reminder_item_ids,
    merged.reminder_interval_minutes,
    merged.reminder_last_sent_at,
  ]);

  return merged;
}

async function listItems() {
  await bootstrapSheets();
  const rows = await readRange(sheetRange(itemsSheet(), "A1:Z"));
  return rowsToObjects(rows)
    .filter((row) => String(row.id || "").trim())
    .map((row) => ({
      ...row,
      group_name: String(row.group_name || "").trim(),
      qty: Number(row.qty || 0),
      threshold: Number(row.threshold || 0),
      low_notified: String(row.low_notified || "0"),
    }));
}

async function upsertItem(item) {
  await bootstrapSheets();
  const items = await listItems();
  const existing = items.find((row) => row.id === item.id);

  const values = [
    item.id,
    item.name,
    String(item.qty),
    String(item.threshold),
    item.notes || "",
    item.updated_at,
    item.updated_by,
    String(item.low_notified ?? existing?.low_notified ?? "0"),
    item.group_name || "",
  ];

  if (!existing) {
    await appendRow(itemsSheet(), values);
    return;
  }

  await updateRow(itemsSheet(), existing._row, values);
}

async function deleteItemById(id) {
  await bootstrapSheets();
  const items = await listItems();
  const existing = items.find((row) => row.id === id);
  if (!existing) return false;
  await updateRow(itemsSheet(), existing._row, Array(ITEMS_HEADERS.length).fill(""));
  return true;
}

async function appendMovement(movement) {
  await bootstrapSheets();
  await appendRow(movementsSheet(), [
    movement.item_id,
    String(movement.delta),
    movement.reason,
    movement.user_email,
    movement.created_at,
  ]);
}

async function listMovements(limit = 100) {
  await bootstrapSheets();
  const rows = await readRange(sheetRange(movementsSheet(), "A1:Z"));
  const movements = rowsToObjects(rows).map((row) => ({
    ...row,
    delta: Number(row.delta || 0),
  }));
  return movements.reverse().slice(0, limit);
}

function groupIdFromName(name) {
  const base = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё_-]+/gi, "")
    .slice(0, 48);
  if (!base) return "";
  return `GRP-${base}`;
}

async function listGroups() {
  await bootstrapSheets();
  const rows = await readRange(sheetRange(groupsSheet(), "A1:Z"));
  return rowsToObjects(rows)
    .filter((row) => String(row.name || "").trim())
    .map((row) => ({
      ...row,
      id: String(row.id || "").trim() || groupIdFromName(row.name),
      name: String(row.name || "").trim(),
    }));
}

async function createGroup(group) {
  await bootstrapSheets();
  const name = String(group.name || "").trim();
  if (!name) throw new Error("Group name is required");
  const id = String(group.id || groupIdFromName(name)).trim();
  if (!id) throw new Error("Failed to generate group id");

  const groups = await listGroups();
  const exists = groups.find(
    (row) => String(row.id || "").toLowerCase() === id.toLowerCase() || String(row.name || "").toLowerCase() === name.toLowerCase()
  );
  if (exists) return exists;

  const created = {
    id,
    name,
    created_at: group.created_at || new Date().toISOString(),
    created_by: group.created_by || "",
  };

  await appendRow(groupsSheet(), [created.id, created.name, created.created_at, created.created_by]);
  return created;
}

module.exports = {
  listUsers,
  findUserByEmail,
  updateUserByEmail,
  createUser,
  listItems,
  upsertItem,
  deleteItemById,
  appendMovement,
  listMovements,
  listGroups,
  createGroup,
};
