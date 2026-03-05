const { listItems, upsertItem, appendMovement } = require("../../lib/sheets");
const { requireAuth, requireRole } = require("../../lib/auth");
const { send, methodNotAllowed, parseJsonBody } = require("../../lib/http");

function nextId(items) {
  let max = 0;
  for (const item of items) {
    const n = Number(String(item.id || "").replace("SUP-", ""));
    if (n > max) max = n;
  }
  return `SUP-${String(max + 1).padStart(3, "0")}`;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(req, res, ["POST"]);
  }

  const auth = requireAuth(req);
  const access = requireRole(auth, ["admin"]);
  if (!access.ok) {
    return send(res, access.code, { error: access.error });
  }

  try {
    const body = parseJsonBody(req);
    const items = await listItems();
    const incomingId = String(body.id || "").trim();
    const id = incomingId || nextId(items);
    const name = String(body.name || "").trim();
    const qty = Number(body.qty || 0);
    const threshold = Number(body.threshold || 0);
    const notes = String(body.notes || "").trim();

    if (!name) {
      return send(res, 400, { error: "Item name is required" });
    }

    const existed = items.some((row) => row.id === id);

    await upsertItem({
      id,
      name,
      qty,
      threshold,
      notes,
      updated_at: new Date().toISOString(),
      updated_by: auth.user.email,
    });

    await appendMovement({
      item_id: id,
      delta: 0,
      reason: existed ? "update" : "create",
      user_email: auth.user.email,
      created_at: new Date().toISOString(),
    });

    return send(res, 200, { ok: true, id });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to save item" });
  }
};
