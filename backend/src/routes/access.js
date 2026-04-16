/**
 * routes/access.js
 * ----------------
 * REST endpoints for access-control management.
 *
 * POST /grant-access    — patient grants doctor access
 * POST /revoke-access   — patient revokes doctor access
 * POST /register-doctor — register a new doctor address
 * GET  /check-access    — check if doctor has access to patient
 * GET  /check-doctor    — check if address is a doctor
 */

const router  = require("express").Router();
const { getContract, signerFromKey } = require("../services/contractService");

// ────────────────────────────────────────────────────────────────
// POST /grant-access
// ────────────────────────────────────────────────────────────────
router.post("/grant-access", async (req, res) => {
  try {
    const { privateKey, doctorAddress } = req.body;

    if (!privateKey || !doctorAddress) {
      return res.status(400).json({ error: "privateKey and doctorAddress are required" });
    }

    const signer   = signerFromKey(privateKey);
    const contract = getContract(signer);
    const tx       = await contract.grantAccess(doctorAddress);
    const receipt  = await tx.wait();

    return res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    console.error("[POST /grant-access]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// POST /revoke-access
// ────────────────────────────────────────────────────────────────
router.post("/revoke-access", async (req, res) => {
  try {
    const { privateKey, doctorAddress } = req.body;

    if (!privateKey || !doctorAddress) {
      return res.status(400).json({ error: "privateKey and doctorAddress are required" });
    }

    const signer   = signerFromKey(privateKey);
    const contract = getContract(signer);
    const tx       = await contract.revokeAccess(doctorAddress);
    const receipt  = await tx.wait();

    return res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    console.error("[POST /revoke-access]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// POST /register-doctor
// ────────────────────────────────────────────────────────────────
router.post("/register-doctor", async (req, res) => {
  try {
    const { privateKey, doctorAddress } = req.body;

    if (!doctorAddress) {
      return res.status(400).json({ error: "doctorAddress is required" });
    }

    // Use provided key or fall back to operator key
    const signer   = privateKey ? signerFromKey(privateKey) : null;
    const contract = getContract(signer);
    const tx       = await contract.registerDoctor(doctorAddress);
    const receipt  = await tx.wait();

    return res.json({ success: true, txHash: receipt.hash });
  } catch (err) {
    console.error("[POST /register-doctor]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// GET /check-access?patient=0x...&doctor=0x...
// ────────────────────────────────────────────────────────────────
router.get("/check-access", async (req, res) => {
  try {
    const { patient, doctor } = req.query;
    if (!patient || !doctor) {
      return res.status(400).json({ error: "patient and doctor query params required" });
    }
    const contract = getContract();
    const hasAccess = await contract.checkAccess(patient, doctor);
    return res.json({ patient, doctor, hasAccess });
  } catch (err) {
    console.error("[GET /check-access]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ────────────────────────────────────────────────────────────────
// GET /check-doctor?address=0x...
// ────────────────────────────────────────────────────────────────
router.get("/check-doctor", async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ error: "address query param required" });
    }
    const contract  = getContract();
    const isDoctor  = await contract.checkDoctor(address);
    return res.json({ address, isDoctor });
  } catch (err) {
    console.error("[GET /check-doctor]", err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
