const { createGroup, listGroups } = require("../../lib/sheets");
const { requireAuth, requireRole } = require("../../lib/auth");
const { methodNotAllowed, parseJsonBody, send } = require("../../lib/http");

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return methodNotAllowed(req, res, ["GET", "POST"]);
  }

  const auth = requireAuth(req);
  if (!auth.ok) {
    return send(res, 401, { error: auth.error });
  }

  try {
    if (req.method === "GET") {
      const groups = await listGroups();
      return send(res, 200, { groups });
    }

    const access = requireRole(auth, ["admin"]);
    if (!access.ok) {
      return send(res, access.code, { error: access.error });
    }

    const body = parseJsonBody(req);
    const name = String(body.name || "").trim();
    if (!name) {
      return send(res, 400, { error: "Group name is required" });
    }

    const group = await createGroup({
      name,
      created_at: new Date().toISOString(),
      created_by: auth.user.email,
    });

    return send(res, 200, { ok: true, group });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to process groups" });
  }
};
