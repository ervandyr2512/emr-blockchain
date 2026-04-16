/**
 * storage.js
 * ----------
 * Off-chain storage using MongoDB (primary) with filesystem fallback.
 * Keyed by SHA-256 hash — the same value stored on the blockchain.
 */

const fs   = require("fs");
const path = require("path");

// Lazy-load model (mongoose might not be connected yet at module load)
function getModel() {
  return require("../models/OffChainRecord");
}

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, "../../data/records");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Save medical data keyed by its SHA-256 hash.
 * Writes to MongoDB (primary) and filesystem (fallback cache).
 */
async function saveRecord(hash, data) {
  // MongoDB primary
  try {
    const OffChainRecord = getModel();
    await OffChainRecord.findOneAndUpdate(
      { hash },
      { hash, medicalData: data },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.warn("[storage] MongoDB save failed, using filesystem:", err.message);
    // Filesystem fallback
    fs.writeFileSync(path.join(DATA_DIR, `${hash}.json`), JSON.stringify(data, null, 2));
  }
  return hash;
}

/**
 * Retrieve medical data by hash.
 * Tries MongoDB first, falls back to filesystem.
 */
async function getRecord(hash) {
  // MongoDB primary
  try {
    const OffChainRecord = getModel();
    const doc = await OffChainRecord.findOne({ hash });
    if (doc) return doc.medicalData;
  } catch (err) {
    console.warn("[storage] MongoDB read failed, trying filesystem:", err.message);
  }

  // Filesystem fallback
  const filePath = path.join(DATA_DIR, `${hash}.json`);
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  return null;
}

module.exports = { saveRecord, getRecord };
