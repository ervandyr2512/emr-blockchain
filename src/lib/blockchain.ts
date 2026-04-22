/**
 * blockchain.ts
 * -------------
 * ethers.js v6 wrapper for interacting with the EMRv2 smart contract.
 *
 * Two modes:
 *  - Read-only  : uses JsonRpcProvider (no wallet needed)
 *  - Read-write : uses BrowserProvider (MetaMask) for signing transactions
 */

import { ethers } from "ethers";

// ABI is generated after `npx hardhat run scripts/deployV2.js`
// and placed at frontend/src/lib/contract/EMRv2.json
let cachedAbi: ethers.InterfaceAbi | null = null;

async function getAbi(): Promise<ethers.InterfaceAbi> {
  if (cachedAbi) return cachedAbi;
  try {
    const mod = await import("./contract/EMRv2.json");
    cachedAbi = mod.abi;
    return cachedAbi!;
  } catch {
    // Fallback minimal ABI if file hasn't been generated yet
    cachedAbi = FALLBACK_ABI;
    return cachedAbi;
  }
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const RPC_URL          = process.env.NEXT_PUBLIC_RPC_URL          || "https://rpc.sepolia.org";

// ── Read-only contract (no MetaMask required) ────────────────────────────────
export async function getReadContract() {
  const abi      = await getAbi();
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
}

// ── Write contract (requires MetaMask) ──────────────────────────────────────
export async function getWriteContract() {
  if (typeof window === "undefined" || !(window as Window & { ethereum?: unknown }).ethereum) {
    throw new Error("MetaMask not detected. Please install MetaMask to sign transactions.");
  }
  const abi      = await getAbi();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = new ethers.BrowserProvider((window as any).ethereum as ethers.Eip1193Provider);
  const signer   = await provider.getSigner();
  return { contract: new ethers.Contract(CONTRACT_ADDRESS, abi, signer), signer };
}

// ── Blockchain helpers ───────────────────────────────────────────────────────

/**
 * Register a new patient on-chain.
 * @param emrId    Firebase EMR ID
 * @param dataHash SHA-256 of the patient biodata JSON
 */
export async function blockchainRegisterPatient(emrId: string, dataHash: string) {
  const { contract } = await getWriteContract();
  const tx      = await contract.registerPatient(emrId, dataHash);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

/**
 * Submit SOAP note hash on-chain.
 */
export async function blockchainSubmitSOAP(emrId: string, dataHash: string) {
  const { contract } = await getWriteContract();
  const tx      = await contract.submitSOAP(emrId, dataHash);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

/**
 * Submit doctor note hash on-chain.
 */
export async function blockchainSubmitDoctorNote(emrId: string, dataHash: string) {
  const { contract } = await getWriteContract();
  const tx      = await contract.submitDoctorNote(emrId, dataHash);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

/**
 * Fulfill prescription on-chain.
 */
export async function blockchainFulfillPrescription(emrId: string, dataHash: string) {
  const { contract } = await getWriteContract();
  const tx      = await contract.fulfillPrescription(emrId, dataHash);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

/**
 * Assign department on-chain (admin only).
 */
export async function blockchainAssignDepartment(emrId: string, dataHash: string) {
  const { contract } = await getWriteContract();
  const tx      = await contract.assignDepartment(emrId, dataHash);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

/**
 * Retrieve all on-chain actions for a patient (read-only).
 */
export async function getEMRActions(emrId: string) {
  const contract = await getReadContract();
  return contract.getEMRActions(emrId);
}

/**
 * Get the role of an address from the contract.
 */
export async function getOnChainRole(address: string): Promise<number> {
  const contract = await getReadContract();
  return Number(await contract.getRole(address));
}

// ── Fallback minimal ABI (used before contract is deployed) ──────────────────
const FALLBACK_ABI = [
  "function registerPatient(string emrId, string dataHash) external",
  "function submitSOAP(string emrId, string dataHash) external",
  "function submitDoctorNote(string emrId, string dataHash) external",
  "function fulfillPrescription(string emrId, string dataHash) external",
  "function assignDepartment(string emrId, string dataHash) external",
  "function getEMRActions(string emrId) external view returns (tuple(uint256 id, string emrId, string dataHash, uint8 actionType, address submitter, uint256 timestamp, bool isActive)[])",
  "function getRole(address user) external view returns (uint8)",
  "function assignRole(address user, uint8 role, string name) external",
  "function selfRegister(string name) external",
  "function getTotalActions() external view returns (uint256)",
  "function isRegistered(string emrId) external view returns (bool)",
  "event PatientRegistered(string indexed emrId, string dataHash, address indexed registrar, uint256 timestamp)",
  "event SOAPSubmitted(string indexed emrId, string dataHash, address indexed nurse, uint256 timestamp)",
  "event DoctorNoteSubmitted(string indexed emrId, string dataHash, address indexed doctor, uint256 timestamp)",
  "event PrescriptionCreated(string indexed emrId, string dataHash, address indexed pharmacist, uint256 timestamp)",
];
