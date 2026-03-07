#!/usr/bin/env node

const { google } = require('googleapis');
const { sql } = require('@vercel/postgres');

function env(name, fallback = '') {
  return process.env[name] || fallback;
}

function required(name) {
  const value = env(name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function safeSheetName(sheetName) {
  return `'${String(sheetName || '').replace(/'/g, "''")}'`;
}

function sheetRange(sheetName, range = 'A:Z') {
  return `${safeSheetName(sheetName)}!${range}`;
}

function rowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] ?? '';
    });
    return obj;
  });
}

function toIso(value) {
  if (!value) return new Date().toISOString();
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
}

async function getSheetsClient() {
  const clientEmail = required('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKeyRaw = required('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

async function readRange(sheets, spreadsheetId, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return res.data.values || [];
}

async function ensureSchema() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      telegram_chat_id TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      low_stock_notifications TEXT NOT NULL DEFAULT '1',
      reminder_item_ids TEXT NOT NULL DEFAULT '',
      reminder_interval_minutes INTEGER NOT NULL DEFAULT 0,
      reminder_last_sent_at TIMESTAMPTZ NULL
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      qty INTEGER NOT NULL DEFAULT 0,
      threshold INTEGER NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_by TEXT NOT NULL DEFAULT '',
      low_notified TEXT NOT NULL DEFAULT '0',
      group_name TEXT NOT NULL DEFAULT ''
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS movements (
      id BIGSERIAL PRIMARY KEY,
      item_id TEXT NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      user_email TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS movements_unique_event_idx
    ON movements (item_id, delta, reason, user_email, created_at);
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS groups_dir (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by TEXT NOT NULL DEFAULT ''
    );
  `;
}

async function main() {
  required('POSTGRES_URL');
  const spreadsheetId = required('GOOGLE_SHEETS_SPREADSHEET_ID');

  const usersSheet = env('GOOGLE_USERS_SHEET', 'users');
  const itemsSheet = env('GOOGLE_ITEMS_SHEET', 'inventory');
  const movementsSheet = env('GOOGLE_MOVEMENTS_SHEET', 'movements');
  const groupsSheet = env('GOOGLE_GROUPS_SHEET', 'groups');

  const sheets = await getSheetsClient();
  await ensureSchema();

  const [usersRaw, itemsRaw, movementsRaw, groupsRaw] = await Promise.all([
    readRange(sheets, spreadsheetId, sheetRange(usersSheet, 'A1:Z')),
    readRange(sheets, spreadsheetId, sheetRange(itemsSheet, 'A1:Z')),
    readRange(sheets, spreadsheetId, sheetRange(movementsSheet, 'A1:Z')),
    readRange(sheets, spreadsheetId, sheetRange(groupsSheet, 'A1:Z')),
  ]);

  const users = rowsToObjects(usersRaw).filter((r) => String(r.email || '').trim());
  const items = rowsToObjects(itemsRaw).filter((r) => String(r.id || '').trim());
  const movements = rowsToObjects(movementsRaw).filter((r) => String(r.item_id || '').trim());
  const groups = rowsToObjects(groupsRaw).filter((r) => String(r.name || '').trim());

  for (const user of users) {
    await sql`
      INSERT INTO users (
        email, name, password_hash, role, telegram_chat_id, created_at,
        first_name, last_name, low_stock_notifications,
        reminder_item_ids, reminder_interval_minutes, reminder_last_sent_at
      ) VALUES (
        ${String(user.email || '').trim().toLowerCase()},
        ${String(user.name || '')},
        ${String(user.password_hash || '')},
        ${String(user.role || 'staff')},
        ${String(user.telegram_chat_id || '')},
        ${toIso(user.created_at || new Date().toISOString())},
        ${String(user.first_name || '')},
        ${String(user.last_name || '')},
        ${String(user.low_stock_notifications || '1')},
        ${String(user.reminder_item_ids || '')},
        ${Number(user.reminder_interval_minutes || 0)},
        ${user.reminder_last_sent_at ? toIso(user.reminder_last_sent_at) : null}
      )
      ON CONFLICT (email)
      DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        telegram_chat_id = EXCLUDED.telegram_chat_id,
        created_at = EXCLUDED.created_at,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        low_stock_notifications = EXCLUDED.low_stock_notifications,
        reminder_item_ids = EXCLUDED.reminder_item_ids,
        reminder_interval_minutes = EXCLUDED.reminder_interval_minutes,
        reminder_last_sent_at = EXCLUDED.reminder_last_sent_at
    `;
  }

  for (const item of items) {
    await sql`
      INSERT INTO items (id, name, qty, threshold, notes, updated_at, updated_by, low_notified, group_name)
      VALUES (
        ${String(item.id || '')},
        ${String(item.name || '')},
        ${Number(item.qty || 0)},
        ${Number(item.threshold || 0)},
        ${String(item.notes || '')},
        ${toIso(item.updated_at || new Date().toISOString())},
        ${String(item.updated_by || '')},
        ${String(item.low_notified || '0')},
        ${String(item.group_name || '')}
      )
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        qty = EXCLUDED.qty,
        threshold = EXCLUDED.threshold,
        notes = EXCLUDED.notes,
        updated_at = EXCLUDED.updated_at,
        updated_by = EXCLUDED.updated_by,
        low_notified = EXCLUDED.low_notified,
        group_name = EXCLUDED.group_name
    `;
  }

  for (const movement of movements) {
    await sql`
      INSERT INTO movements (item_id, delta, reason, user_email, created_at)
      VALUES (
        ${String(movement.item_id || '')},
        ${Number(movement.delta || 0)},
        ${String(movement.reason || '')},
        ${String(movement.user_email || '')},
        ${toIso(movement.created_at || new Date().toISOString())}
      )
      ON CONFLICT (item_id, delta, reason, user_email, created_at)
      DO NOTHING
    `;
  }

  for (const group of groups) {
    const id = String(group.id || '').trim() || `GRP-${String(group.name || '').trim().toLowerCase().replace(/\s+/g, '-').slice(0, 48)}`;
    await sql`
      INSERT INTO groups_dir (id, name, created_at, created_by)
      VALUES (
        ${id},
        ${String(group.name || '').trim()},
        ${toIso(group.created_at || new Date().toISOString())},
        ${String(group.created_by || '')}
      )
      ON CONFLICT (id)
      DO UPDATE SET
        name = EXCLUDED.name,
        created_at = EXCLUDED.created_at,
        created_by = EXCLUDED.created_by
    `;
  }

  console.log(`Migration complete: users=${users.length}, items=${items.length}, movements=${movements.length}, groups=${groups.length}`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
