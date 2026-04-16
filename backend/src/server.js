/**
 * server.js
 * ---------
 * Express API server for the EMR blockchain system.
 *
 * Start: node src/server.js  (or: npm start)
 *
 * Endpoints:
 *   POST   /record
 *   GET    /record/:id
 *   PUT    /record/:id
 *   DELETE /record/:id
 *   POST   /grant-access
 *   POST   /revoke-access
 *   POST   /register-doctor
 *   GET    /check-access
 *   GET    /check-doctor
 */

require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const morgan  = require("morgan");

const recordRoutes = require("./routes/records");
const accessRoutes = require("./routes/access");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────
// Allow requests from Vercel frontend and localhost dev
app.use(cors({
  origin: [
    "https://emr-blockchain.vercel.app",
    "http://localhost:3000",
    /\.vercel\.app$/,         // any Vercel preview URL
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(morgan("dev"));

// ── Health check ─────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    service:     "EMR Blockchain API",
    version:     "1.0.0",
    status:      "running",
    contract:    process.env.CONTRACT_ADDRESS || "(not set — run deploy first)",
    rpc:         process.env.RPC_URL || "http://127.0.0.1:8545",
  });
});

// ── Routes ───────────────────────────────────────────────────────
app.use("/record",          recordRoutes);
app.use("/",                accessRoutes); // /grant-access, /revoke-access, etc.

// ── 404 handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ─────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[Unhandled Error]", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  EMR API running at http://localhost:${PORT}`);
  console.log(`  Contract address : ${process.env.CONTRACT_ADDRESS || "(not set)"}`);
  console.log(`  RPC endpoint     : ${process.env.RPC_URL || "http://127.0.0.1:8545"}\n`);
});

module.exports = app; // for testing
