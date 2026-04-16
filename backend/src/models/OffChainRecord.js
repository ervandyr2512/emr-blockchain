/**
 * OffChainRecord.js
 * -----------------
 * Mongoose model for off-chain medical data.
 * Keyed by SHA-256 hash so the blockchain reference never breaks.
 */

const mongoose = require("mongoose");

const OffChainRecordSchema = new mongoose.Schema(
  {
    hash:        { type: String, required: true, unique: true, index: true },
    medicalData: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OffChainRecord", OffChainRecordSchema);
