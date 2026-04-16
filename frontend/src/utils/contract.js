/**
 * utils/contract.js
 * -----------------
 * Connects to the deployed EMR contract via MetaMask (window.ethereum).
 * Returns a signer-connected contract instance so the user's wallet
 * signs every write transaction.
 */

import { ethers } from "ethers";
import contractInfo from "../contract/EMR.json";

/**
 * Returns { provider, signer, contract } using the connected MetaMask account.
 * Throws if MetaMask is not installed or no account is connected.
 */
export async function getContractWithSigner() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed. Please install it to use this app.");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer   = await provider.getSigner();
  const contract = new ethers.Contract(
    contractInfo.address,
    contractInfo.abi,
    signer
  );

  return { provider, signer, contract };
}

/**
 * Returns a read-only contract instance (no wallet needed).
 */
export function getReadContract() {
  if (!window.ethereum) return null;
  const provider = new ethers.BrowserProvider(window.ethereum);
  return new ethers.Contract(contractInfo.address, contractInfo.abi, provider);
}

/**
 * Formats a BigInt timestamp (seconds) to a human-readable date string.
 * @param {bigint|string} ts
 */
export function formatTimestamp(ts) {
  return new Date(Number(ts) * 1000).toLocaleString();
}
