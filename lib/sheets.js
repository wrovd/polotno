const { sql } = require("@vercel/postgres");

let pgBootstrapped = false;
let pgBootstrapPromise = null;

function requirePostgresEnv() {
  if (!process.env.POSTGRES_URL && !process.env.POSTGRES_PRISMA_URL) {
    throw new Error("POSTGRES_URL is required (Google Sheets mode is disabled)");
  }
}

function toIso(value) {
  if (!value) return "";
  const dt = new Date(value);
  return Number.isNaN(dt.getTime()) ? String(value) : dt.toISOString();
}

function asInt(value, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.round(parsed);
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

async function ensurePgSchema() {
  requirePostgresEnv();
  if (pgBootstrapped) return;
  if (pgBootstrapPromise) {
    await pgBootstrapPromise;
    return;
  }

  pgBootstrapPromise = (async () => {
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

    pgBootstrapped = true;
  })();

  try {
    await pgBootstrapPromise;
  } finally {
    pgBootstrapPromise = null;
  }
}

function normalizeUser(row) {
  return {
    ...row,
    email: String(row.email || "").trim().toLowerCase(),
    name: String(row.name || "").trim(),
    role: String(row.role || "staff").trim().toLowerCase(),
    telegram_chat_id: String(row.telegram_chat_id || "").trim(),
    created_at: toIso(row.created_at),
    first_name: String(row.first_name || "").trim(),
    last_name: String(row.last_name || "").trim(),
    low_stock_notifications: String(row.low_stock_notifications ?? "1"),
    reminder_item_ids: String(row.reminder_item_ids || ""),
    reminder_interval_minutes: String(row.reminder_interval_minutes ?? 0),
    reminder_last_sent_at: toIso(row.reminder_last_sent_at),
  };
}

function normalizeItem(row) {
  return {
    ...row,
    id: String(row.id || "").trim(),
    name: String(row.name || "").trim(),
    qty: asInt(row.qty, 0),
    threshold: asInt(row.threshold, 0),
    notes: String(row.notes || ""),
    updated_at: toIso(row.updated_at),
    updated_by: String(row.updated_by || ""),
    low_notified: String(row.low_notified || "0"),
    group_name: String(row.group_name || ""),
  };
}

async function listUsers() {
  await ensurePgSchema();
  const { rows } = await sql`
    SELECT email, name, password_hash, role, telegram_chat_id, created_at,
           first_name, last_name, low_stock_notifications,
           reminder_item_ids, reminder_interval_minutes, reminder_last_sent_at
    FROM users
    ORDER BY created_at ASC
  `;
  return rows.map(normalizeUser);
}

async function createUser(user) {
  await ensurePgSchema();
  await sql`
    INSERT INTO users (
      email, name, password_hash, role, telegram_chat_id, created_at,
      first_name, last_name, low_stock_notifications,
      reminder_item_ids, reminder_interval_minutes, reminder_last_sent_at
    ) VALUES (
      ${String(user.email || "").trim().toLowerCase()},
      ${String(user.name || "")},
      ${String(user.password_hash || "")},
      ${String(user.role || "staff")},
      ${String(user.telegram_chat_id || "")},
      ${toIso(user.created_at || new Date().toISOString())},
      ${String(user.first_name || "")},
      ${String(user.last_name || "")},
      ${String(user.low_stock_notifications ?? "1")},
      ${String(user.reminder_item_ids || "")},
      ${asInt(user.reminder_interval_minutes, 0)},
      ${user.reminder_last_sent_at ? toIso(user.reminder_last_sent_at) : null}
    )
  `;
}

async function findUserByEmail(email) {
  const needle = String(email || "").trim().toLowerCase();
  if (!needle) return null;
  await ensurePgSchema();

  const { rows } = await sql`
    SELECT email, name, password_hash, role, telegram_chat_id, created_at,
           first_name, last_name, low_stock_notifications,
           reminder_item_ids, reminder_interval_minutes, reminder_last_sent_at
    FROM users
    WHERE email = ${needle}
    LIMIT 1
  `;

  if (!rows.length) return null;
  return normalizeUser(rows[0]);
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
    low_stock_notifications: String(nextUser.low_stock_notifications ?? existing.low_stock_notifications ?? "1"),
    reminder_item_ids: String(nextUser.reminder_item_ids ?? existing.reminder_item_ids ?? ""),
    reminder_interval_minutes: String(nextUser.reminder_interval_minutes ?? existing.reminder_interval_minutes ?? "0"),
    reminder_last_sent_at: String(nextUser.reminder_last_sent_at ?? existing.reminder_last_sent_at ?? ""),
  };

  await sql`
    UPDATE users
    SET email = ${merged.email},
        name = ${merged.name},
        password_hash = ${merged.password_hash},
        role = ${merged.role},
        telegram_chat_id = ${merged.telegram_chat_id},
        created_at = ${toIso(merged.created_at)},
        first_name = ${merged.first_name},
        last_name = ${merged.last_name},
        low_stock_notifications = ${merged.low_stock_notifications},
        reminder_item_ids = ${merged.reminder_item_ids},
        reminder_interval_minutes = ${asInt(merged.reminder_interval_minutes, 0)},
        reminder_last_sent_at = ${merged.reminder_last_sent_at ? toIso(merged.reminder_last_sent_at) : null}
    WHERE email = ${existing.email}
  `;

  return merged;
}

async function listItems() {
  await ensurePgSchema();
  const { rows } = await sql`
    SELECT id, name, qty, threshold, notes, updated_at, updated_by, low_notified, group_name
    FROM items
    ORDER BY id ASC
  `;
  return rows.map(normalizeItem);
}

async function upsertItem(item) {
  await ensurePgSchema();
  await sql`
    INSERT INTO items (id, name, qty, threshold, notes, updated_at, updated_by, low_notified, group_name)
    VALUES (
      ${String(item.id || "")},
      ${String(item.name || "")},
      ${asInt(item.qty, 0)},
      ${asInt(item.threshold, 0)},
      ${String(item.notes || "")},
      ${toIso(item.updated_at || new Date().toISOString())},
      ${String(item.updated_by || "")},
      ${String(item.low_notified ?? "0")},
      ${String(item.group_name || "")}
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

async function deleteItemById(id) {
  await ensurePgSchema();
  const result = await sql`DELETE FROM items WHERE id = ${String(id || "")}`;
  return Number(result.rowCount || 0) > 0;
}

async function appendMovement(movement) {
  await ensurePgSchema();
  await sql`
    INSERT INTO movements (item_id, delta, reason, user_email, created_at)
    VALUES (
      ${String(movement.item_id || "")},
      ${asInt(movement.delta, 0)},
      ${String(movement.reason || "")},
      ${String(movement.user_email || "")},
      ${toIso(movement.created_at || new Date().toISOString())}
    )
    ON CONFLICT (item_id, delta, reason, user_email, created_at)
    DO NOTHING
  `;
}

async function listMovements(limit = 100) {
  await ensurePgSchema();
  const safeLimit = Math.max(1, Math.min(asInt(limit, 100), 1000));
  const { rows } = await sql`
    SELECT item_id, delta, reason, user_email, created_at
    FROM movements
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;
  return rows.map((row) => ({
    ...row,
    delta: asInt(row.delta, 0),
    created_at: toIso(row.created_at),
  }));
}

async function listGroups() {
  await ensurePgSchema();
  const { rows } = await sql`
    SELECT id, name, created_at, created_by
    FROM groups_dir
    ORDER BY name ASC
  `;
  return rows.map((row) => ({
    ...row,
    id: String(row.id || ""),
    name: String(row.name || ""),
    created_at: toIso(row.created_at),
    created_by: String(row.created_by || ""),
  }));
}

async function createGroup(group) {
  await ensurePgSchema();
  const name = String(group.name || "").trim();
  if (!name) throw new Error("Group name is required");
  const id = String(group.id || groupIdFromName(name)).trim();
  if (!id) throw new Error("Failed to generate group id");

  const existing = await sql`
    SELECT id, name, created_at, created_by
    FROM groups_dir
    WHERE lower(name) = lower(${name})
    LIMIT 1
  `;
  if (existing.rows.length) {
    const row = existing.rows[0];
    return {
      ...row,
      created_at: toIso(row.created_at),
      created_by: String(row.created_by || ""),
    };
  }

  await sql`
    INSERT INTO groups_dir (id, name, created_at, created_by)
    VALUES (${id}, ${name}, ${toIso(group.created_at || new Date().toISOString())}, ${String(group.created_by || "")})
    ON CONFLICT (id) DO NOTHING
  `;

  const created = await sql`
    SELECT id, name, created_at, created_by
    FROM groups_dir
    WHERE id = ${id}
    LIMIT 1
  `;

  if (!created.rows.length) {
    return {
      id,
      name,
      created_at: toIso(group.created_at || new Date().toISOString()),
      created_by: String(group.created_by || ""),
    };
  }

  const row = created.rows[0];
  return {
    ...row,
    created_at: toIso(row.created_at),
    created_by: String(row.created_by || ""),
  };
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
