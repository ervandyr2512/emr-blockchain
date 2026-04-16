/**
 * routes/records.js
 * -----------------
 * REST endpoints for medical record CRUD.
 *
 * POST   /record            — create record (stores off-chain JSON + hash on-chain)
 * GET    /record/:id        — get record metadata by blockchain ID (requires auth)
 * GET    /offchain/:hash    — get full medical data by SHA-256 hash (public, no blockchain call)
 * PUT    /record/:id        — update record
 * DELETE /record/:id        — soft-delete record
 */

const router  = require("express").Router();
const { getContract, signerFromKey } = require("../services/contractService");
const { hashData }              = require("../utils/hash");
const { saveRecord, getRecord } = require("../utils/storage");

// ── POST /record ─────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { privateKey, medicalData } = req.body;
    if (!medicalData) {
      return res.status(400).json({ error: "medicalData is required" });
    }

    // 1. Hash the medical data (simulate IPFS CID)
    const dataHash = hashData(medicalData);

    // 2. Persist full data off-chain (MongoDB)
    await saveRecord(dataHash, medicalData);

    // 3. Write ONLY the hash to blockchain
    //    Use provided key or operator key
    const signer   = privateKey ? signerFromKey(privateKey) : null;
    const contract = getContract(signer);
    const tx       = await contract.createRecord(dataHash);
    const receipt  = await tx.wait();

    const event = receipt.logs
      .map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } })
      .find((e) => e && e.name === "RecordCreated");

    const recordId = event ? event.args.id.toString() : null;

    return res.status(201).json({ success: true, recordId, dataHash, txHash: receipt.hash });
  } catch (err) {
    console.error("[POST /record]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /offchain/:hash ───────────────────────────────────────────────────────
// Returns full medical data by SHA-256 hash.
// No blockchain call — anyone with the correct hash can request the data.
// In production, add patient-signature verification here.
router.get("/offchain/:hash", async (req, res) => {
  try {
    const { hash } = req.params;
    if (!hash || hash.length < 32) {
      return res.status(400).json({ error: "Invalid hash" });
    }

    const data = await getRecord(hash);
    if (!data) {
      return res.status(404).json({ error: "Off-chain data not found for this hash" });
    }

    return res.json({ hash, medicalData: data });
  } catch (err) {
    console.error("[GET /offchain/:hash]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── GET /record/:id ───────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { privateKey } = req.query;

    const signer   = privateKey ? signerFromKey(privateKey) : null;
    const contract = getContract(signer);
    const rec      = await contract.getRecord(BigInt(id));
    const offChain = await getRecord(rec.dataHash);

    return res.json({
      id:          rec.id.toString(),
      patient:     rec.patient,
      dataHash:    rec.dataHash,
      timestamp:   rec.timestamp.toString(),
      active:      rec.active,
      medicalData: offChain,
    });
  } catch (err) {
    console.error("[GET /record/:id]", err.message);
    if (err.message.includes("access denied")) {
      return res.status(403).json({ error: "Access denied" });
    }
    return res.status(500).json({ error: err.message });
  }
});

// ── PUT /record/:id ───────────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { privateKey, medicalData, isDoctor } = req.body;

    if (!medicalData) {
      return res.status(400).json({ error: "medicalData is required" });
    }

    const newDataHash = hashData(medicalData);
    await saveRecord(newDataHash, medicalData);

    const signer   = privateKey ? signerFromKey(privateKey) : null;
    const contract = getContract(signer);
    const tx       = isDoctor
      ? await contract.updateRecordByDoctor(BigInt(id), newDataHash)
      : await contract.updateRecord(BigInt(id), newDataHash);
    const receipt  = await tx.wait();

    return res.json({ success: true, newDataHash, txHash: receipt.hash });
  } catch (err) {
    console.error("[PUT /record/:id]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── DELETE /record/:id ────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { privateKey } = req.body;

    const signer   = privateKey ? signerFromKey(privateKey) : null;
    const contract = getContract(signer);
    const tx       = await contract.deleteRecord(BigInt(id));
    const receipt  = await tx.wait();

    return res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    console.error("[DELETE /record/:id]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
