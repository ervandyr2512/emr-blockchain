/**
 * routes/records.js
 * -----------------
 * REST endpoints for medical record CRUD.
 *
 * POST   /record            — create record (patient)
 * GET    /record/:id        — get record by ID
 * PUT    /record/:id        — update record
 * DELETE /record/:id        — soft-delete record
 */

const router  = require("express").Router();
const { getContract, signerFromKey, getReadContract } = require("../services/contractService");
const { hashData }    = require("../utils/hash");
const { saveRecord, getRecord } = require("../utils/storage");

// ────────────────────────────────────────────────────────────────
// POST /record  — Patient creates a new medical record
// ────────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { privateKey, medicalData } = req.body;

    if (!privateKey || !medicalData) {
      return res.status(400).json({ error: "privateKey and medicalData are required" });
    }

    // 1. Hash the medical data (simulate IPFS CID)
    const dataHash = hashData(medicalData);

    // 2. Persist full data off-chain
    saveRecord(dataHash, medicalData);

    // 3. Write ONLY the hash to the blockchain
    const signer   = signerFromKey(privateKey);
    const contract = getContract(signer);
    const tx       = await contract.createRecord(dataHash);
    const receipt  = await tx.wait();

    // Parse the RecordCreated event to get the new record ID
    const event = receipt.logs
      .map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } })
      .find((e) => e && e.name === "RecordCreated");

    const recordId = event ? event.args.id.toString() : null;

    return res.status(201).json({
      success:   true,
      recordId,
      dataHash,
      txHash:    receipt.hash,
    });
  } catch (err) {
    console.error("[POST /record]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// GET /record/:id  — Retrieve a record (patient or authorised doctor)
// ────────────────────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { privateKey } = req.query; // demo: pass key as query param

    let contract;
    if (privateKey) {
      const signer = signerFromKey(privateKey);
      contract = getContract(signer);
    } else {
      // Read-only — will fail for protected records
      contract = getReadContract();
    }

    // Fetch on-chain metadata
    const rec = await contract.getRecord(BigInt(id));

    // Fetch full medical data from off-chain storage
    const offChainData = getRecord(rec.dataHash);

    return res.json({
      id:          rec.id.toString(),
      patient:     rec.patient,
      dataHash:    rec.dataHash,
      timestamp:   rec.timestamp.toString(),
      active:      rec.active,
      medicalData: offChainData,
    });
  } catch (err) {
    console.error("[GET /record/:id]", err.message);
    if (err.message.includes("access denied")) {
      return res.status(403).json({ error: "Access denied" });
    }
    return res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// PUT /record/:id  — Update a record (patient or authorised doctor)
// ────────────────────────────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { privateKey, medicalData, isDoctor } = req.body;

    if (!privateKey || !medicalData) {
      return res.status(400).json({ error: "privateKey and medicalData are required" });
    }

    // 1. Hash new data and persist off-chain
    const newDataHash = hashData(medicalData);
    saveRecord(newDataHash, medicalData);

    // 2. Update hash on-chain
    const signer   = signerFromKey(privateKey);
    const contract = getContract(signer);

    let tx;
    if (isDoctor) {
      tx = await contract.updateRecordByDoctor(BigInt(id), newDataHash);
    } else {
      tx = await contract.updateRecord(BigInt(id), newDataHash);
    }
    const receipt = await tx.wait();

    return res.json({
      success:      true,
      newDataHash,
      txHash:       receipt.hash,
    });
  } catch (err) {
    console.error("[PUT /record/:id]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// DELETE /record/:id  — Soft-delete a record (patient only)
// ────────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { privateKey } = req.body;

    if (!privateKey) {
      return res.status(400).json({ error: "privateKey is required" });
    }

    const signer   = signerFromKey(privateKey);
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
