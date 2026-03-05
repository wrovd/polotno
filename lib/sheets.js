const { google } = require("googleapis");

const USERS_HEADERS = ["email", "name", "password_hash", "role", "telegram_chat_id", "created_at"];
const ITEMS_HEADERS = [
  "id",
  "name",
  "qty",
  "threshold",
  "notes",
  "updated_at",
  "updated_by",
];
const MOVEMENTS_HEADERS = ["item_id", "delta", "reason", "user_email", "created_at"];

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

async function readRange(range) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range,
  });
  return res.data.values || [];
}

async function appendRow(sheetName, values) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${sheetName}!A:Z`,
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
    range: `${sheetName}!A${rowNumber}:Z${rowNumber}`,
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
  const values = await readRange(`${sheetName}!A1:Z1`);
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
  await ensureHeaders(usersSheet(), USERS_HEADERS);
  await ensureHeaders(itemsSheet(), ITEMS_HEADERS);
  await ensureHeaders(movementsSheet(), MOVEMENTS_HEADERS);
}

async function listUsers() {
  await bootstrapSheets();
  const rows = await readRange(`${usersSheet()}!A1:Z`);
  return rowsToObjects(rows);
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
  ]);
}

async function listItems() {
  await bootstrapSheets();
  const rows = await readRange(`${itemsSheet()}!A1:Z`);
  return rowsToObjects(rows).map((row) => ({
    ...row,
    qty: Number(row.qty || 0),
    threshold: Number(row.threshold || 0),
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
  ];

  if (!existing) {
    await appendRow(itemsSheet(), values);
    return;
  }

  await updateRow(itemsSheet(), existing._row, values);
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

module.exports = {
  listUsers,
  createUser,
  listItems,
  upsertItem,
  appendMovement,
};
