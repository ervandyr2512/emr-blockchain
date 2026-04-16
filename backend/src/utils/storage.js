/**
 * storage.js
 * ----------
 * Simulates off-chain storage (IPFS / cloud).
 * Medical data is stored as JSON files named by their SHA-256 hash.
 *
 * In a real deployment replace this with:
 *   - IPFS via ipfs-http-client
 *   - AWS S3 / Google Cloud Storage
 *   - Any encrypted object-store
 */

const fs   = require("fs");
const path = require("path");

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "../../data/records");

// Ensure the directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Saves medical data JSON to disk and returns the filename (= hash).
 * @param {string} hash  SHA-256 hex digest (used as filename)
 * @param {object} data  Full medical record JSON
 */
function saveRecord(hash, data) {
  const filePath = path.join(DATA_DIR, `${hash}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return hash;
}

/**
 * Retrieves medical data by hash.
 * @param {string} hash
 * @returns {object|null}
 */
function getRecord(hash) {
  const filePath = path.join(DATA_DIR, `${hash}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

/**
 * Checks whether a file exists for the given hash.
 * @param {string} hash
 * @returns {boolean}
 */
function recordExists(hash) {
  return fs.existsSync(path.join(DATA_DIR, `${hash}.json`));
}

module.exports = { saveRecord, getRecord, recordExists };
