/**
 * hash.js
 * -------
 * Generates a SHA-256 hash of a JavaScript object (simulating IPFS CID).
 * Only the hash is stored on-chain; the full JSON lives in data/records/.
 */

const { createHash } = require("crypto");

/**
 * Returns the hex SHA-256 digest of the JSON-serialised object.
 * @param {object} data
 * @returns {string} hex string, e.g. "a3f1b2..."
 */
function hashData(data) {
  const json = JSON.stringify(data, Object.keys(data).sort()); // deterministic
  return createHash("sha256").update(json).digest("hex");
}

module.exports = { hashData };
