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

    await sql`
      CREATE TABLE IF NOT EXISTS films_stock (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        barcode TEXT NOT NULL,
        cell_no TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_by TEXT NOT NULL DEFAULT ''
      );
    `;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS films_barcode_cell_idx
      ON films_stock (barcode, cell_no);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS box_products_catalog (
        barcode TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_by TEXT NOT NULL DEFAULT ''
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS auth_qr_sessions (
        id TEXT PRIMARY KEY,
        login_code TEXT NOT NULL UNIQUE,
        poll_key TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'pending',
        user_email TEXT NOT NULL DEFAULT '',
        expires_at TIMESTAMPTZ NOT NULL,
        confirmed_at TIMESTAMPTZ NULL,
        consumed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS auth_qr_sessions_status_exp_idx
      ON auth_qr_sessions (status, expires_at);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS chat_threads (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        kind TEXT NOT NULL DEFAULT 'group',
        created_by TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        archived TEXT NOT NULL DEFAULT '0'
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS chat_members (
        thread_id BIGINT NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_read_at TIMESTAMPTZ NULL,
        PRIMARY KEY (thread_id, user_email)
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS chat_members_user_idx
      ON chat_members (user_email, thread_id);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id BIGSERIAL PRIMARY KEY,
        thread_id BIGINT NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
        author_email TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS chat_messages_thread_created_idx
      ON chat_messages (thread_id, created_at DESC, id DESC);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tasks_board (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'todo',
        priority TEXT NOT NULL DEFAULT 'medium',
        assignee_email TEXT NOT NULL DEFAULT '',
        due_date TEXT NOT NULL DEFAULT '',
        created_by TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        archived TEXT NOT NULL DEFAULT '0'
      );
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS tasks_board_status_idx
      ON tasks_board (status, updated_at DESC);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS task_comments (
        id BIGSERIAL PRIMARY KEY,
        task_id BIGINT NOT NULL REFERENCES tasks_board(id) ON DELETE CASCADE,
        author_email TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS box_tracking_entries (
        id BIGSERIAL PRIMARY KEY,
        box_code TEXT NOT NULL,
        location TEXT NOT NULL,
        product_barcode TEXT NOT NULL,
        product_name TEXT NOT NULL,
        qty INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_by TEXT NOT NULL DEFAULT ''
      );
    `;

    await sql`
      ALTER TABLE box_tracking_entries
      ADD COLUMN IF NOT EXISTS qty INTEGER NOT NULL DEFAULT 1;
    `;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS box_tracking_box_barcode_idx
      ON box_tracking_entries (box_code, product_barcode);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS box_tracking_barcode_idx
      ON box_tracking_entries (product_barcode);
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS box_tracking_location_idx
      ON box_tracking_entries (location);
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

function normalizeFilm(row) {
  return {
    id: String(row.id || ""),
    name: String(row.name || "").trim(),
    barcode: String(row.barcode || "").trim(),
    cell_no: String(row.cell_no || "").trim(),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    updated_by: String(row.updated_by || "").trim(),
  };
}

function normalizeBoxCatalogItem(row) {
  return {
    barcode: String(row.barcode || "").trim(),
    name: String(row.name || "").trim(),
    updated_at: toIso(row.updated_at),
    updated_by: String(row.updated_by || "").trim(),
  };
}

function normalizeBoxTrackingEntry(row) {
  return {
    id: String(row.id || ""),
    box_code: String(row.box_code || "").trim(),
    location: String(row.location || "").trim(),
    product_barcode: String(row.product_barcode || "").trim(),
    product_name: String(row.product_name || "").trim(),
    qty: Math.max(1, asInt(row.qty, 1)),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    updated_by: String(row.updated_by || "").trim(),
  };
}

async function listFilms({ search = "", barcode = "", cellNo = "", limit = 500, offset = 0 } = {}) {
  await ensurePgSchema();
  const safeLimit = Math.max(1, Math.min(asInt(limit, 500), 2000));
  const safeOffset = Math.max(0, asInt(offset, 0));
  const searchLike = `%${String(search || "").trim().toLowerCase()}%`;
  const barcodeLike = `%${String(barcode || "").trim().toLowerCase()}%`;
  const cellLike = `%${String(cellNo || "").trim().toLowerCase()}%`;

  const { rows } = await sql`
    SELECT id, name, barcode, cell_no, created_at, updated_at, updated_by
    FROM films_stock
    WHERE (${String(search || "").trim() === ""} OR lower(name) LIKE ${searchLike} OR lower(barcode) LIKE ${searchLike} OR lower(cell_no) LIKE ${searchLike})
      AND (${String(barcode || "").trim() === ""} OR lower(barcode) LIKE ${barcodeLike})
      AND (${String(cellNo || "").trim() === ""} OR lower(cell_no) LIKE ${cellLike})
    ORDER BY updated_at DESC, id DESC
    LIMIT ${safeLimit}
    OFFSET ${safeOffset}
  `;

  return rows.map(normalizeFilm);
}

async function upsertFilm(film) {
  await ensurePgSchema();
  const name = String(film.name || "").trim();
  const barcode = String(film.barcode || "").trim();
  const cellNo = String(film.cell_no || film.cellNo || "").trim();
  if (!name) throw new Error("Film name is required");
  if (!barcode) throw new Error("Film barcode is required");

  await sql`
    INSERT INTO films_stock (name, barcode, cell_no, created_at, updated_at, updated_by)
    VALUES (
      ${name},
      ${barcode},
      ${cellNo},
      ${toIso(film.created_at || new Date().toISOString())},
      ${toIso(film.updated_at || new Date().toISOString())},
      ${String(film.updated_by || "")}
    )
    ON CONFLICT (barcode, cell_no)
    DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by
  `;

  const { rows } = await sql`
    SELECT id, name, barcode, cell_no, created_at, updated_at, updated_by
    FROM films_stock
    WHERE barcode = ${barcode} AND cell_no = ${cellNo}
    LIMIT 1
  `;
  return rows.length ? normalizeFilm(rows[0]) : null;
}

async function deleteFilmByBarcodeCell(barcode, cellNo) {
  await ensurePgSchema();
  const b = String(barcode || "").trim();
  const c = String(cellNo || "").trim();
  if (!b || !c) return false;
  const result = await sql`DELETE FROM films_stock WHERE barcode = ${b} AND cell_no = ${c}`;
  return Number(result.rowCount || 0) > 0;
}

async function findFilmsByBarcode(barcode) {
  await ensurePgSchema();
  const b = String(barcode || "").trim();
  if (!b) return [];
  const { rows } = await sql`
    SELECT id, name, barcode, cell_no, created_at, updated_at, updated_by
    FROM films_stock
    WHERE barcode = ${b}
    ORDER BY cell_no ASC
  `;
  return rows.map(normalizeFilm);
}

async function getFilmDeleteStats({ dateFrom = "", dateTo = "", granularity = "day" } = {}) {
  await ensurePgSchema();
  const from = String(dateFrom || "").trim();
  const to = String(dateTo || "").trim();
  const mode = String(granularity || "day").trim().toLowerCase() === "month" ? "month" : "day";

  let seriesRows = [];
  if (mode === "month") {
    if (from && to) {
      const result = await sql`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS bucket, COUNT(*)::int AS total
        FROM movements
        WHERE reason = 'film_delete'
          AND created_at >= ${from}::timestamptz
          AND created_at <= (${to}::date + INTERVAL '1 day' - INTERVAL '1 millisecond')
        GROUP BY 1
        ORDER BY 1 ASC
      `;
      seriesRows = result.rows;
    } else if (from) {
      const result = await sql`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS bucket, COUNT(*)::int AS total
        FROM movements
        WHERE reason = 'film_delete'
          AND created_at >= ${from}::timestamptz
        GROUP BY 1
        ORDER BY 1 ASC
      `;
      seriesRows = result.rows;
    } else if (to) {
      const result = await sql`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS bucket, COUNT(*)::int AS total
        FROM movements
        WHERE reason = 'film_delete'
          AND created_at <= (${to}::date + INTERVAL '1 day' - INTERVAL '1 millisecond')
        GROUP BY 1
        ORDER BY 1 ASC
      `;
      seriesRows = result.rows;
    } else {
      const result = await sql`
        SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS bucket, COUNT(*)::int AS total
        FROM movements
        WHERE reason = 'film_delete'
        GROUP BY 1
        ORDER BY 1 ASC
      `;
      seriesRows = result.rows;
    }
  } else {
    if (from && to) {
      const result = await sql`
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS bucket, COUNT(*)::int AS total
        FROM movements
        WHERE reason = 'film_delete'
          AND created_at >= ${from}::timestamptz
          AND created_at <= (${to}::date + INTERVAL '1 day' - INTERVAL '1 millisecond')
        GROUP BY 1
        ORDER BY 1 ASC
      `;
      seriesRows = result.rows;
    } else if (from) {
      const result = await sql`
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS bucket, COUNT(*)::int AS total
        FROM movements
        WHERE reason = 'film_delete'
          AND created_at >= ${from}::timestamptz
        GROUP BY 1
        ORDER BY 1 ASC
      `;
      seriesRows = result.rows;
    } else if (to) {
      const result = await sql`
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS bucket, COUNT(*)::int AS total
        FROM movements
        WHERE reason = 'film_delete'
          AND created_at <= (${to}::date + INTERVAL '1 day' - INTERVAL '1 millisecond')
        GROUP BY 1
        ORDER BY 1 ASC
      `;
      seriesRows = result.rows;
    } else {
      const result = await sql`
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS bucket, COUNT(*)::int AS total
        FROM movements
        WHERE reason = 'film_delete'
        GROUP BY 1
        ORDER BY 1 ASC
      `;
      seriesRows = result.rows;
    }
  }

  let usersRows = [];
  if (from && to) {
    const result = await sql`
      SELECT user_email, COUNT(*)::int AS total
      FROM movements
      WHERE reason = 'film_delete'
        AND created_at >= ${from}::timestamptz
        AND created_at <= (${to}::date + INTERVAL '1 day' - INTERVAL '1 millisecond')
      GROUP BY user_email
      ORDER BY total DESC, user_email ASC
      LIMIT 100
    `;
    usersRows = result.rows;
  } else if (from) {
    const result = await sql`
      SELECT user_email, COUNT(*)::int AS total
      FROM movements
      WHERE reason = 'film_delete'
        AND created_at >= ${from}::timestamptz
      GROUP BY user_email
      ORDER BY total DESC, user_email ASC
      LIMIT 100
    `;
    usersRows = result.rows;
  } else if (to) {
    const result = await sql`
      SELECT user_email, COUNT(*)::int AS total
      FROM movements
      WHERE reason = 'film_delete'
        AND created_at <= (${to}::date + INTERVAL '1 day' - INTERVAL '1 millisecond')
      GROUP BY user_email
      ORDER BY total DESC, user_email ASC
      LIMIT 100
    `;
    usersRows = result.rows;
  } else {
    const result = await sql`
      SELECT user_email, COUNT(*)::int AS total
      FROM movements
      WHERE reason = 'film_delete'
      GROUP BY user_email
      ORDER BY total DESC, user_email ASC
      LIMIT 100
    `;
    usersRows = result.rows;
  }

  const series = seriesRows.map((row) => ({
    bucket: String(row.bucket || ""),
    total: asInt(row.total, 0),
  }));
  const users = usersRows.map((row) => ({
    user_email: String(row.user_email || ""),
    total: asInt(row.total, 0),
  }));
  const totalDeleted = series.reduce((acc, row) => acc + asInt(row.total, 0), 0);

  return {
    granularity: mode,
    totalDeleted,
    series,
    users,
  };
}

async function listBoxProductsCatalog({ search = "", limit = 500, offset = 0 } = {}) {
  await ensurePgSchema();
  const safeLimit = Math.max(1, Math.min(asInt(limit, 500), 3000));
  const safeOffset = Math.max(0, asInt(offset, 0));
  const searchText = String(search || "").trim();
  const searchLike = `%${searchText.toLowerCase()}%`;
  const { rows } = await sql`
    SELECT barcode, name, updated_at, updated_by
    FROM box_products_catalog
    WHERE (${searchText === ""} OR lower(name) LIKE ${searchLike} OR lower(barcode) LIKE ${searchLike})
    ORDER BY name ASC, barcode ASC
    LIMIT ${safeLimit}
    OFFSET ${safeOffset}
  `;
  return rows.map(normalizeBoxCatalogItem);
}

async function findBoxCatalogByBarcode(barcode) {
  await ensurePgSchema();
  const needle = String(barcode || "").trim();
  if (!needle) return null;
  const { rows } = await sql`
    SELECT barcode, name, updated_at, updated_by
    FROM box_products_catalog
    WHERE barcode = ${needle}
    LIMIT 1
  `;
  if (!rows.length) return null;
  return normalizeBoxCatalogItem(rows[0]);
}

async function upsertBoxCatalogItem(item = {}) {
  await ensurePgSchema();
  const barcode = String(item.barcode || "").trim();
  const name = String(item.name || "").trim();
  if (!barcode) throw new Error("Product barcode is required");
  if (!name) throw new Error("Product name is required");
  const now = toIso(item.updated_at || new Date().toISOString());
  const updatedBy = String(item.updated_by || "");
  await sql`
    INSERT INTO box_products_catalog (barcode, name, updated_at, updated_by)
    VALUES (${barcode}, ${name}, ${now}, ${updatedBy})
    ON CONFLICT (barcode)
    DO UPDATE SET
      name = EXCLUDED.name,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by
  `;
  return { barcode, name, updated_at: now, updated_by: updatedBy };
}

async function upsertBoxTrackingEntry(entry = {}) {
  await ensurePgSchema();
  const boxCode = String(entry.box_code || entry.boxCode || "").trim();
  const location = String(entry.location || "").trim();
  const productBarcode = String(entry.product_barcode || entry.productBarcode || "").trim();
  const productName = String(entry.product_name || entry.productName || "").trim();
  const qty = Math.max(1, asInt(entry.qty, 1));
  if (!boxCode) throw new Error("Box code is required");
  if (!location) throw new Error("Box location is required");
  if (!productBarcode) throw new Error("Product barcode is required");
  if (!productName) throw new Error("Product name is required");

  const now = toIso(entry.updated_at || new Date().toISOString());
  const createdAt = toIso(entry.created_at || now);
  const updatedBy = String(entry.updated_by || entry.updatedBy || "");

  await sql`
    INSERT INTO box_tracking_entries (
      box_code, location, product_barcode, product_name, qty, created_at, updated_at, updated_by
    ) VALUES (
      ${boxCode}, ${location}, ${productBarcode}, ${productName}, ${qty}, ${createdAt}, ${now}, ${updatedBy}
    )
    ON CONFLICT (box_code, product_barcode)
    DO UPDATE SET
      location = EXCLUDED.location,
      product_name = EXCLUDED.product_name,
      qty = EXCLUDED.qty,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by
  `;
}

async function listBoxTrackingEntries({ search = "", barcode = "", location = "", limit = 800, offset = 0 } = {}) {
  await ensurePgSchema();
  const safeLimit = Math.max(1, Math.min(asInt(limit, 800), 5000));
  const safeOffset = Math.max(0, asInt(offset, 0));
  const searchText = String(search || "").trim();
  const barcodeText = String(barcode || "").trim();
  const locationText = String(location || "").trim();
  const searchLike = `%${searchText.toLowerCase()}%`;
  const barcodeLike = `%${barcodeText.toLowerCase()}%`;
  const locationLike = `%${locationText.toLowerCase()}%`;

  const { rows } = await sql`
    SELECT id, box_code, location, product_barcode, product_name, qty, created_at, updated_at, updated_by
    FROM box_tracking_entries
    WHERE (${searchText === ""} OR lower(box_code) LIKE ${searchLike} OR lower(product_name) LIKE ${searchLike} OR lower(product_barcode) LIKE ${searchLike} OR lower(location) LIKE ${searchLike})
      AND (${barcodeText === ""} OR lower(product_barcode) LIKE ${barcodeLike})
      AND (${locationText === ""} OR lower(location) LIKE ${locationLike})
    ORDER BY updated_at DESC, id DESC
    LIMIT ${safeLimit}
    OFFSET ${safeOffset}
  `;
  return rows.map(normalizeBoxTrackingEntry);
}

async function findBoxTrackingByBarcode(barcode) {
  await ensurePgSchema();
  const needle = String(barcode || "").trim();
  if (!needle) return [];
  const { rows } = await sql`
    SELECT id, box_code, location, product_barcode, product_name, qty, created_at, updated_at, updated_by
    FROM box_tracking_entries
    WHERE product_barcode = ${needle}
    ORDER BY box_code ASC
  `;
  return rows.map(normalizeBoxTrackingEntry);
}

async function removeBoxTrackingByBoxCode(boxCode) {
  await ensurePgSchema();
  const code = String(boxCode || "").trim();
  if (!code) return { removed: 0 };
  const { rows } = await sql`
    DELETE FROM box_tracking_entries
    WHERE box_code = ${code}
    RETURNING id, box_code, location, product_barcode, product_name, qty, created_at, updated_at, updated_by
  `;
  return {
    removed: Number(rows.length || 0),
    rows: rows.map(normalizeBoxTrackingEntry),
  };
}

async function boxCodeExists(boxCode) {
  await ensurePgSchema();
  const code = String(boxCode || "").trim();
  if (!code) return false;
  const { rows } = await sql`
    SELECT 1
    FROM box_tracking_entries
    WHERE box_code = ${code}
    LIMIT 1
  `;
  return rows.length > 0;
}

function normalizeQrSession(row) {
  return {
    id: String(row.id || ""),
    login_code: String(row.login_code || ""),
    poll_key: String(row.poll_key || ""),
    status: String(row.status || "pending"),
    user_email: String(row.user_email || "").trim().toLowerCase(),
    expires_at: toIso(row.expires_at),
    confirmed_at: toIso(row.confirmed_at),
    consumed_at: toIso(row.consumed_at),
    created_at: toIso(row.created_at),
  };
}

function normalizeChatThread(row) {
  return {
    id: String(row.id || ""),
    title: String(row.title || "").trim(),
    kind: String(row.kind || "group").trim(),
    created_by: String(row.created_by || "").trim().toLowerCase(),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    last_message_at: toIso(row.last_message_at),
    last_message_preview: String(row.last_message_preview || "").trim(),
    last_author_email: String(row.last_author_email || "").trim().toLowerCase(),
    members_count: asInt(row.members_count, 0),
    unread_count: asInt(row.unread_count, 0),
  };
}

function normalizeChatMessage(row) {
  return {
    id: String(row.id || ""),
    thread_id: String(row.thread_id || ""),
    author_email: String(row.author_email || "").trim().toLowerCase(),
    body: String(row.body || ""),
    created_at: toIso(row.created_at),
  };
}

function normalizeTask(row) {
  return {
    id: String(row.id || ""),
    title: String(row.title || "").trim(),
    description: String(row.description || ""),
    status: String(row.status || "todo").trim().toLowerCase(),
    priority: String(row.priority || "medium").trim().toLowerCase(),
    assignee_email: String(row.assignee_email || "").trim().toLowerCase(),
    due_date: String(row.due_date || "").trim(),
    created_by: String(row.created_by || "").trim().toLowerCase(),
    created_at: toIso(row.created_at),
    updated_at: toIso(row.updated_at),
    comments_count: asInt(row.comments_count, 0),
  };
}

function normalizeTaskComment(row) {
  return {
    id: String(row.id || ""),
    task_id: String(row.task_id || ""),
    author_email: String(row.author_email || "").trim().toLowerCase(),
    body: String(row.body || ""),
    created_at: toIso(row.created_at),
  };
}

async function ensureUserChatBootstrap(userEmail) {
  await ensurePgSchema();
  const email = String(userEmail || "").trim().toLowerCase();
  if (!email) return;
  const existing = await sql`
    SELECT 1
    FROM chat_members
    WHERE user_email = ${email}
    LIMIT 1
  `;
  if (existing.rows.length) return;

  const created = await sql`
    INSERT INTO chat_threads (title, kind, created_by, created_at, updated_at, archived)
    VALUES ('Общий чат', 'group', ${email}, NOW(), NOW(), '0')
    RETURNING id
  `;
  const threadId = created.rows?.[0]?.id;
  if (!threadId) return;

  await sql`
    INSERT INTO chat_members (thread_id, user_email, role, joined_at, last_read_at)
    VALUES (${threadId}, ${email}, 'admin', NOW(), NOW())
    ON CONFLICT (thread_id, user_email) DO NOTHING
  `;

  await sql`
    INSERT INTO chat_messages (thread_id, author_email, body, created_at)
    VALUES (${threadId}, ${email}, 'Чат создан. Можно начинать переписку.', NOW())
  `;
}

async function createChatThread({ title = "", kind = "group", createdBy = "", memberEmails = [] } = {}) {
  await ensurePgSchema();
  const cleanTitle = String(title || "").trim();
  const cleanCreator = String(createdBy || "").trim().toLowerCase();
  if (!cleanTitle) throw new Error("Thread title is required");
  if (!cleanCreator) throw new Error("Creator email is required");

  const cleanKind = ["group", "direct", "channel"].includes(String(kind || "").trim().toLowerCase())
    ? String(kind || "").trim().toLowerCase()
    : "group";
  const mergedMembers = [...new Set([cleanCreator, ...memberEmails.map((x) => String(x || "").trim().toLowerCase())].filter(Boolean))];

  const created = await sql`
    INSERT INTO chat_threads (title, kind, created_by, created_at, updated_at, archived)
    VALUES (${cleanTitle}, ${cleanKind}, ${cleanCreator}, NOW(), NOW(), '0')
    RETURNING id, title, kind, created_by, created_at, updated_at
  `;
  const row = created.rows[0];
  if (!row?.id) throw new Error("Failed to create thread");

  for (const email of mergedMembers) {
    await sql`
      INSERT INTO chat_members (thread_id, user_email, role, joined_at, last_read_at)
      VALUES (${row.id}, ${email}, ${email === cleanCreator ? "admin" : "member"}, NOW(), NOW())
      ON CONFLICT (thread_id, user_email) DO NOTHING
    `;
  }

  await sql`
    INSERT INTO chat_messages (thread_id, author_email, body, created_at)
    VALUES (${row.id}, ${cleanCreator}, 'Чат создан.', NOW())
  `;

  return normalizeChatThread({ ...row, members_count: mergedMembers.length, unread_count: 0 });
}

async function listChatThreadsForUser(userEmail, { search = "", limit = 120 } = {}) {
  await ensureUserChatBootstrap(userEmail);
  const email = String(userEmail || "").trim().toLowerCase();
  if (!email) return [];
  const safeLimit = Math.max(1, Math.min(asInt(limit, 120), 300));
  const searchText = String(search || "").trim().toLowerCase();
  const searchLike = `%${searchText}%`;

  const { rows } = await sql`
    SELECT
      t.id,
      t.title,
      t.kind,
      t.created_by,
      t.created_at,
      t.updated_at,
      lm.created_at AS last_message_at,
      lm.body AS last_message_preview,
      lm.author_email AS last_author_email,
      (
        SELECT COUNT(*)::int
        FROM chat_members m2
        WHERE m2.thread_id = t.id
      ) AS members_count,
      (
        SELECT COUNT(*)::int
        FROM chat_messages um
        WHERE um.thread_id = t.id
          AND um.created_at > COALESCE(cm.last_read_at, '1970-01-01'::timestamptz)
          AND lower(um.author_email) <> ${email}
      ) AS unread_count
    FROM chat_threads t
    JOIN chat_members cm
      ON cm.thread_id = t.id
     AND lower(cm.user_email) = ${email}
    LEFT JOIN LATERAL (
      SELECT body, author_email, created_at
      FROM chat_messages
      WHERE thread_id = t.id
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    ) lm ON true
    WHERE t.archived = '0'
      AND (${searchText === ""} OR lower(t.title) LIKE ${searchLike} OR lower(COALESCE(lm.body, '')) LIKE ${searchLike})
    ORDER BY COALESCE(lm.created_at, t.updated_at) DESC, t.id DESC
    LIMIT ${safeLimit}
  `;

  return rows.map(normalizeChatThread);
}

async function listChatMessages(threadId, userEmail, { limit = 200 } = {}) {
  await ensurePgSchema();
  const id = asInt(threadId, 0);
  const email = String(userEmail || "").trim().toLowerCase();
  if (!id) return [];
  if (!email) return [];

  const member = await sql`
    SELECT 1
    FROM chat_members
    WHERE thread_id = ${id} AND lower(user_email) = ${email}
    LIMIT 1
  `;
  if (!member.rows.length) throw new Error("No access to thread");

  const safeLimit = Math.max(1, Math.min(asInt(limit, 200), 600));
  const { rows } = await sql`
    SELECT id, thread_id, author_email, body, created_at
    FROM chat_messages
    WHERE thread_id = ${id}
    ORDER BY created_at ASC, id ASC
    LIMIT ${safeLimit}
  `;
  return rows.map(normalizeChatMessage);
}

async function sendChatMessage({ threadId = "", authorEmail = "", body = "" } = {}) {
  await ensurePgSchema();
  const id = asInt(threadId, 0);
  const email = String(authorEmail || "").trim().toLowerCase();
  const text = String(body || "").trim();
  if (!id) throw new Error("threadId is required");
  if (!email) throw new Error("authorEmail is required");
  if (!text) throw new Error("Message body is required");

  const member = await sql`
    SELECT 1
    FROM chat_members
    WHERE thread_id = ${id} AND lower(user_email) = ${email}
    LIMIT 1
  `;
  if (!member.rows.length) throw new Error("No access to thread");

  const inserted = await sql`
    INSERT INTO chat_messages (thread_id, author_email, body, created_at)
    VALUES (${id}, ${email}, ${text}, NOW())
    RETURNING id, thread_id, author_email, body, created_at
  `;
  await sql`
    UPDATE chat_threads
    SET updated_at = NOW()
    WHERE id = ${id}
  `;
  return normalizeChatMessage(inserted.rows[0] || {});
}

async function markChatThreadRead(threadId, userEmail) {
  await ensurePgSchema();
  const id = asInt(threadId, 0);
  const email = String(userEmail || "").trim().toLowerCase();
  if (!id || !email) return;
  await sql`
    UPDATE chat_members
    SET last_read_at = NOW()
    WHERE thread_id = ${id}
      AND lower(user_email) = ${email}
  `;
}

async function listTaskBoard({ search = "", status = "", limit = 400 } = {}) {
  await ensurePgSchema();
  const safeLimit = Math.max(1, Math.min(asInt(limit, 400), 1000));
  const searchText = String(search || "").trim().toLowerCase();
  const statusText = String(status || "").trim().toLowerCase();
  const searchLike = `%${searchText}%`;

  const { rows } = await sql`
    SELECT
      t.id,
      t.title,
      t.description,
      t.status,
      t.priority,
      t.assignee_email,
      t.due_date,
      t.created_by,
      t.created_at,
      t.updated_at,
      (
        SELECT COUNT(*)::int
        FROM task_comments c
        WHERE c.task_id = t.id
      ) AS comments_count
    FROM tasks_board t
    WHERE t.archived = '0'
      AND (${statusText === ""} OR lower(t.status) = ${statusText})
      AND (${searchText === ""} OR lower(t.title) LIKE ${searchLike} OR lower(t.description) LIKE ${searchLike} OR lower(t.assignee_email) LIKE ${searchLike})
    ORDER BY t.updated_at DESC, t.id DESC
    LIMIT ${safeLimit}
  `;
  return rows.map(normalizeTask);
}

async function createTask(task = {}) {
  await ensurePgSchema();
  const title = String(task.title || "").trim();
  if (!title) throw new Error("Task title is required");
  const description = String(task.description || "");
  const status = ["todo", "in_progress", "review", "done"].includes(String(task.status || "").trim().toLowerCase())
    ? String(task.status || "").trim().toLowerCase()
    : "todo";
  const priority = ["low", "medium", "high", "urgent"].includes(String(task.priority || "").trim().toLowerCase())
    ? String(task.priority || "").trim().toLowerCase()
    : "medium";
  const assignee = String(task.assignee_email || "").trim().toLowerCase();
  const dueDate = String(task.due_date || "").trim();
  const createdBy = String(task.created_by || "").trim().toLowerCase();

  const inserted = await sql`
    INSERT INTO tasks_board (
      title, description, status, priority, assignee_email, due_date,
      created_by, created_at, updated_at, archived
    ) VALUES (
      ${title}, ${description}, ${status}, ${priority}, ${assignee}, ${dueDate},
      ${createdBy}, NOW(), NOW(), '0'
    )
    RETURNING id, title, description, status, priority, assignee_email, due_date, created_by, created_at, updated_at
  `;
  return normalizeTask({ ...(inserted.rows[0] || {}), comments_count: 0 });
}

async function updateTaskById(taskId, patch = {}) {
  await ensurePgSchema();
  const id = asInt(taskId, 0);
  if (!id) throw new Error("Task id is required");
  const existing = await sql`
    SELECT id, title, description, status, priority, assignee_email, due_date, created_by, created_at, updated_at
    FROM tasks_board
    WHERE id = ${id} AND archived = '0'
    LIMIT 1
  `;
  if (!existing.rows.length) return null;
  const row = existing.rows[0];
  const next = {
    title: String(patch.title ?? row.title ?? "").trim(),
    description: String(patch.description ?? row.description ?? ""),
    status: ["todo", "in_progress", "review", "done"].includes(String(patch.status || row.status || "").trim().toLowerCase())
      ? String(patch.status || row.status || "").trim().toLowerCase()
      : String(row.status || "todo").trim().toLowerCase(),
    priority: ["low", "medium", "high", "urgent"].includes(String(patch.priority || row.priority || "").trim().toLowerCase())
      ? String(patch.priority || row.priority || "").trim().toLowerCase()
      : String(row.priority || "medium").trim().toLowerCase(),
    assignee_email: String(patch.assignee_email ?? row.assignee_email ?? "").trim().toLowerCase(),
    due_date: String(patch.due_date ?? row.due_date ?? "").trim(),
  };
  if (!next.title) throw new Error("Task title is required");

  await sql`
    UPDATE tasks_board
    SET title = ${next.title},
        description = ${next.description},
        status = ${next.status},
        priority = ${next.priority},
        assignee_email = ${next.assignee_email},
        due_date = ${next.due_date},
        updated_at = NOW()
    WHERE id = ${id}
  `;

  const comments = await sql`
    SELECT COUNT(*)::int AS count
    FROM task_comments
    WHERE task_id = ${id}
  `;
  return normalizeTask({
    ...row,
    ...next,
    id,
    updated_at: new Date().toISOString(),
    comments_count: comments.rows?.[0]?.count || 0,
  });
}

async function archiveTaskById(taskId) {
  await ensurePgSchema();
  const id = asInt(taskId, 0);
  if (!id) return false;
  const result = await sql`
    UPDATE tasks_board
    SET archived = '1', updated_at = NOW()
    WHERE id = ${id} AND archived = '0'
  `;
  return Number(result.rowCount || 0) > 0;
}

async function listTaskComments(taskId, { limit = 200 } = {}) {
  await ensurePgSchema();
  const id = asInt(taskId, 0);
  if (!id) return [];
  const safeLimit = Math.max(1, Math.min(asInt(limit, 200), 500));
  const { rows } = await sql`
    SELECT id, task_id, author_email, body, created_at
    FROM task_comments
    WHERE task_id = ${id}
    ORDER BY created_at ASC, id ASC
    LIMIT ${safeLimit}
  `;
  return rows.map(normalizeTaskComment);
}

async function addTaskComment({ taskId = "", authorEmail = "", body = "" } = {}) {
  await ensurePgSchema();
  const id = asInt(taskId, 0);
  const email = String(authorEmail || "").trim().toLowerCase();
  const text = String(body || "").trim();
  if (!id) throw new Error("Task id is required");
  if (!email) throw new Error("authorEmail is required");
  if (!text) throw new Error("Comment body is required");

  const inserted = await sql`
    INSERT INTO task_comments (task_id, author_email, body, created_at)
    VALUES (${id}, ${email}, ${text}, NOW())
    RETURNING id, task_id, author_email, body, created_at
  `;
  await sql`
    UPDATE tasks_board
    SET updated_at = NOW()
    WHERE id = ${id}
  `;
  return normalizeTaskComment(inserted.rows[0] || {});
}

async function createQrLoginSession(session) {
  await ensurePgSchema();
  const id = String(session.id || "").trim();
  const loginCode = String(session.login_code || "").trim();
  const pollKey = String(session.poll_key || "").trim();
  const expiresAt = toIso(session.expires_at || "");
  if (!id || !loginCode || !pollKey || !expiresAt) {
    throw new Error("Invalid QR login session payload");
  }
  await sql`
    INSERT INTO auth_qr_sessions (
      id, login_code, poll_key, status, user_email, expires_at, confirmed_at, consumed_at, created_at
    ) VALUES (
      ${id},
      ${loginCode},
      ${pollKey},
      ${String(session.status || "pending")},
      ${String(session.user_email || "")},
      ${expiresAt},
      ${session.confirmed_at ? toIso(session.confirmed_at) : null},
      ${session.consumed_at ? toIso(session.consumed_at) : null},
      ${toIso(session.created_at || new Date().toISOString())}
    )
  `;
}

async function findQrLoginSessionByPollKey(pollKey) {
  await ensurePgSchema();
  const key = String(pollKey || "").trim();
  if (!key) return null;
  const { rows } = await sql`
    SELECT id, login_code, poll_key, status, user_email, expires_at, confirmed_at, consumed_at, created_at
    FROM auth_qr_sessions
    WHERE poll_key = ${key}
    LIMIT 1
  `;
  if (!rows.length) return null;
  return normalizeQrSession(rows[0]);
}

async function findQrLoginSessionByCode(loginCode) {
  await ensurePgSchema();
  const code = String(loginCode || "").trim();
  if (!code) return null;
  const { rows } = await sql`
    SELECT id, login_code, poll_key, status, user_email, expires_at, confirmed_at, consumed_at, created_at
    FROM auth_qr_sessions
    WHERE login_code = ${code}
    LIMIT 1
  `;
  if (!rows.length) return null;
  return normalizeQrSession(rows[0]);
}

async function confirmQrLoginSession(loginCode, userEmail) {
  await ensurePgSchema();
  const code = String(loginCode || "").trim();
  const email = String(userEmail || "").trim().toLowerCase();
  if (!code || !email) return null;

  const nowIso = new Date().toISOString();
  const { rows } = await sql`
    UPDATE auth_qr_sessions
    SET status = 'confirmed',
        user_email = ${email},
        confirmed_at = ${nowIso}
    WHERE login_code = ${code}
      AND status = 'pending'
      AND expires_at > NOW()
    RETURNING id, login_code, poll_key, status, user_email, expires_at, confirmed_at, consumed_at, created_at
  `;
  if (!rows.length) return null;
  return normalizeQrSession(rows[0]);
}

async function consumeQrLoginSessionByPollKey(pollKey) {
  await ensurePgSchema();
  const key = String(pollKey || "").trim();
  if (!key) return null;
  const nowIso = new Date().toISOString();
  const { rows } = await sql`
    UPDATE auth_qr_sessions
    SET status = 'consumed',
        consumed_at = ${nowIso}
    WHERE poll_key = ${key}
      AND status = 'confirmed'
      AND expires_at > NOW()
    RETURNING id, login_code, poll_key, status, user_email, expires_at, confirmed_at, consumed_at, created_at
  `;
  if (!rows.length) return null;
  return normalizeQrSession(rows[0]);
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
  listFilms,
  upsertFilm,
  deleteFilmByBarcodeCell,
  findFilmsByBarcode,
  getFilmDeleteStats,
  listBoxProductsCatalog,
  findBoxCatalogByBarcode,
  upsertBoxCatalogItem,
  upsertBoxTrackingEntry,
  listBoxTrackingEntries,
  findBoxTrackingByBarcode,
  removeBoxTrackingByBoxCode,
  boxCodeExists,
  createQrLoginSession,
  findQrLoginSessionByPollKey,
  findQrLoginSessionByCode,
  confirmQrLoginSession,
  consumeQrLoginSessionByPollKey,
  createChatThread,
  listChatThreadsForUser,
  listChatMessages,
  sendChatMessage,
  markChatThreadRead,
  listTaskBoard,
  createTask,
  updateTaskById,
  archiveTaskById,
  listTaskComments,
  addTaskComment,
};
