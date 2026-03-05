const { getBearerToken, verifyToken } = require("./security");

function requireAuth(req) {
  const token = getBearerToken(req);
  const payload = verifyToken(token);
  if (!payload) {
    return { ok: false, error: "Unauthorized" };
  }
  return { ok: true, user: payload };
}

module.exports = {
  requireAuth,
};
