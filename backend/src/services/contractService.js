/**
 * contractService.js
 * ------------------
 * Wraps ethers.js interactions with the deployed EMR smart contract.
 * The backend signer is used for write transactions (operator account).
 * Callers may also pass a patient/doctor signer for role-specific calls.
 */

const { ethers } = require("ethers");
const path        = require("path");

// Contract artifact written by deploy.js
let contractInfo;
try {
  contractInfo = require("../contract/EMR.json");
} catch {
  // Will be populated after first deployment
  contractInfo = { abi: [], address: "" };
}

// Provider — connects to the local Hardhat node (or any JSON-RPC endpoint)
const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || "http://127.0.0.1:8545"
);

// Operator signer — used by the backend for admin-level calls
const operatorSigner = new ethers.Wallet(
  process.env.PRIVATE_KEY ||
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  provider
);

/**
 * Returns an EMR contract instance connected to the given signer.
 * Defaults to the operator signer.
 *
 * @param {ethers.Signer} [signer]
 * @returns {ethers.Contract}
 */
function getContract(signer) {
  const address = process.env.CONTRACT_ADDRESS || contractInfo.address;
  return new ethers.Contract(address, contractInfo.abi, signer || operatorSigner);
}

/**
 * Returns a read-only contract instance (no signer needed).
 * @returns {ethers.Contract}
 */
function getReadContract() {
  const address = process.env.CONTRACT_ADDRESS || contractInfo.address;
  return new ethers.Contract(address, contractInfo.abi, provider);
}

/**
 * Creates a signer from a private key string.
 * Used when the request body includes a private key (dev/demo mode only).
 *
 * ⚠️  SECURITY NOTE: Never accept private keys over HTTP in production.
 *     Use a proper auth flow (JWT + MetaMask signature verification) instead.
 *
 * @param {string} privateKey
 * @returns {ethers.Wallet}
 */
function signerFromKey(privateKey) {
  return new ethers.Wallet(privateKey, provider);
}

module.exports = { getContract, getReadContract, signerFromKey, provider };
