const { listItems, deleteItemById, appendMovement } = require("../../lib/sheets");
const { requireAuth, requireRole } = require("../../lib/auth");
const { send, methodNotAllowed, parseJsonBody } = require("../../lib/http");

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
    const id = String(body.id || "").trim();

    if (!id) {
      return send(res, 400, { error: "Item id is required" });
    }

    const items = await listItems();
    const existing = items.find((row) => row.id === id);
    if (!existing) {
      return send(res, 404, { error: "Item not found" });
    }

    const ok = await deleteItemById(id);
    if (!ok) {
      return send(res, 404, { error: "Item not found" });
    }

    await appendMovement({
      item_id: id,
      delta: -Number(existing.qty || 0),
      reason: "delete",
      user_email: auth.user.email,
      created_at: new Date().toISOString(),
    });

    return send(res, 200, { ok: true });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to delete item" });
  }
};
