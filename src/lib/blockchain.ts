/**
 * blockchain.ts
 * -------------
 * ethers.js v6 wrapper for interacting with the EMRv2 smart contract.
 *
 * ARCHITECTURE:
 * Every public "full" function handles the complete pre-flight automatically:
 *   1. requestMetaMask()      — connect wallet (popup if needed)
 *   2. switchToSepolia()      — ensure correct network
 *   3. ensureWalletAuthorized — selfRegister if role == 0  (non-admin ops only)
 *   4. ensureEMRRegistered    — registerPatient if not yet on-chain
 *   5. actual contract call
 *
 * Admin-only operations (assignDepartment) skip step 3 and require ADMIN/owner role.
 */

import { ethers } from "ethers";

let cachedAbi: ethers.InterfaceAbi | null = null;

async function getAbi(): Promise<ethers.InterfaceAbi> {
  if (cachedAbi) return cachedAbi;
  try {
    const mod = await import("./contract/EMRv2.json");
    cachedAbi = mod.abi;
    return cachedAbi!;
  } catch {
    cachedAbi = FALLBACK_ABI;
    return cachedAbi;
  }
}

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const RPC_URL                  = process.env.NEXT_PUBLIC_RPC_URL          || "https://rpc.sepolia.org";

const SEPOLIA_CHAIN_ID         = "0xaa36a7"; // 11155111 decimal
const SEPOLIA_CHAIN_ID_DECIMAL = 11155111;

// ─────────────────────────────────────────────────────────────────────────────
// Error extraction — handles ethers v6 + MetaMask error shapes
// ─────────────────────────────────────────────────────────────────────────────

export function extractErrorMessage(err: unknown): string {
  if (!err) return "Kesalahan tidak diketahui";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = err as any;
  // ethers v6: shortMessage > reason > message
  const msg = e?.shortMessage || e?.reason || e?.message || e?.info?.error?.message;
  if (msg) return String(msg).replace("execution reverted: ", "").replace("VM Exception while processing transaction: revert ", "");
  if (typeof err === "object") {
    try { return JSON.stringify(err).slice(0, 300); } catch { /* ignore */ }
  }
  return String(err) || "Kesalahan tidak diketahui";
}

// ─────────────────────────────────────────────────────────────────────────────
// Providers
// ─────────────────────────────────────────────────────────────────────────────

export async function getReadContract() {
  const abi      = await getAbi();
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  return new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
}

/** Returns a write-capable contract. Verifies Sepolia network. */
export async function getWriteContract() {
  if (typeof window === "undefined" || !(window as Window & { ethereum?: unknown }).ethereum) {
    throw new Error("MetaMask tidak terdeteksi. Install dari https://metamask.io");
  }
  const abi = await getAbi();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = new ethers.BrowserProvider((window as any).ethereum as ethers.Eip1193Provider);

  const network = await provider.getNetwork();
  if (Number(network.chainId) !== SEPOLIA_CHAIN_ID_DECIMAL) {
    throw new Error(
      `MetaMask berada di jaringan yang salah (chainId: ${network.chainId}). ` +
      `Harap beralih ke Sepolia Testnet.`
    );
  }

  const signer = await provider.getSigner();
  return {
    contract: new ethers.Contract(CONTRACT_ADDRESS, abi, signer),
    signer,
    provider,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MetaMask helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function requestMetaMask(): Promise<string> {
  if (typeof window === "undefined" || !(window as Window & { ethereum?: unknown }).ethereum) {
    throw new Error("MetaMask tidak terdeteksi. Install dari https://metamask.io lalu muat ulang halaman.");
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const accounts = (await (window as any).ethereum.request({ method: "eth_requestAccounts" })) as string[];
    if (!accounts?.length) throw new Error("Tidak ada akun MetaMask yang dipilih.");
    return accounts[0];
  } catch (err: unknown) {
    if ((err as { code?: number })?.code === 4001) {
      throw new Error("Koneksi MetaMask ditolak. Silakan izinkan akses akun.");
    }
    throw err;
  }
}

export async function switchToSepolia(): Promise<void> {
  if (typeof window === "undefined" || !(window as Window & { ethereum?: unknown }).ethereum) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eth = (window as any).ethereum;

  // Already on Sepolia? Skip.
  try {
    const chainId = (await eth.request({ method: "eth_chainId" })) as string;
    if (chainId.toLowerCase() === SEPOLIA_CHAIN_ID.toLowerCase()) return;
  } catch { /* proceed */ }

  try {
    await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_CHAIN_ID }] });
    await new Promise((r) => setTimeout(r, 800)); // wait for switch to settle
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code === 4001) throw new Error("Permintaan ganti jaringan ke Sepolia ditolak.");
    if (code === 4902) {
      // Chain not added yet — add it
      try {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: SEPOLIA_CHAIN_ID,
            chainName: "Sepolia Testnet",
            nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: [RPC_URL || "https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          }],
        });
        await new Promise((r) => setTimeout(r, 800));
      } catch (addErr: unknown) {
        if ((addErr as { code?: number })?.code === 4001) throw new Error("Permintaan tambah jaringan Sepolia ditolak.");
        throw addErr;
      }
    } else {
      throw err;
    }
  }
}

export async function isEMRRegistered(emrId: string): Promise<boolean> {
  try {
    const contract = await getReadContract();
    return Boolean(await contract.isRegistered(emrId));
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Blockchain Status (pre-flight, read-only — no MetaMask popup)
// ─────────────────────────────────────────────────────────────────────────────

export interface BlockchainStatus {
  metaMaskInstalled: boolean;
  account: string | null;
  chainId: string | null;
  isOnSepolia: boolean;
  onChainRole: number;
  roleName: string;
  isAdmin: boolean;
  contractAddress: string;
  ready: boolean;
  issues: string[];
}

const ROLE_NAMES: Record<number, string> = {
  0: "Tidak Terdaftar",
  1: "Pasien",
  2: "Dokter",
  3: "Perawat",
  4: "Admin",
  5: "Apoteker",
};

export async function getBlockchainStatus(): Promise<BlockchainStatus> {
  const result: BlockchainStatus = {
    metaMaskInstalled: false,
    account: null,
    chainId: null,
    isOnSepolia: false,
    onChainRole: 0,
    roleName: "Tidak Terdaftar",
    isAdmin: false,
    contractAddress: CONTRACT_ADDRESS,
    ready: false,
    issues: [],
  };

  if (typeof window === "undefined" || !(window as Window & { ethereum?: unknown }).ethereum) {
    result.issues.push("MetaMask tidak terdeteksi. Install dari https://metamask.io");
    return result;
  }

  result.metaMaskInstalled = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const eth = (window as any).ethereum;

  try {
    const accounts = (await eth.request({ method: "eth_accounts" })) as string[];
    result.account = accounts?.[0] ?? null;
    if (!result.account) result.issues.push("MetaMask belum terhubung. Akan diminta saat klik Simpan.");
  } catch { result.issues.push("Tidak dapat membaca akun MetaMask."); }

  try {
    result.chainId = (await eth.request({ method: "eth_chainId" })) as string;
    result.isOnSepolia = result.chainId?.toLowerCase() === SEPOLIA_CHAIN_ID.toLowerCase();
    if (!result.isOnSepolia) {
      result.issues.push(`Jaringan bukan Sepolia (${result.chainId ?? "?"}). Akan otomatis diganti saat klik Simpan.`);
    }
  } catch { result.issues.push("Tidak dapat membaca jaringan MetaMask."); }

  if (result.account) {
    try {
      result.onChainRole = await getOnChainRole(result.account);
      result.roleName    = ROLE_NAMES[result.onChainRole] ?? "Unknown";
      result.isAdmin     = result.onChainRole === 4;
    } catch { result.issues.push("Tidak dapat memeriksa peran wallet di kontrak (cek RPC URL)."); }
  }

  result.ready = result.metaMaskInstalled && !!result.account;
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal shared pre-flight helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Handles ALL pre-conditions for a blockchain write:
 *  1. Connect MetaMask
 *  2. Switch to Sepolia
 *  3. (non-admin) selfRegister if wallet role == 0
 *  4. registerPatient if EMR not yet on-chain
 *
 * Returns a ready-to-use { contract, signer }.
 */
async function prepareWrite(
  emrId: string,
  dataHash: string,
  requireAdmin: boolean,
  report: (msg: string) => void
): Promise<{ contract: ethers.Contract; signer: ethers.JsonRpcSigner }> {
  // 1. MetaMask
  report("Menghubungkan MetaMask…");
  await requestMetaMask();

  // 2. Sepolia
  report("Memastikan jaringan Sepolia…");
  await switchToSepolia();

  // 3. Get signer + contract (now verified on Sepolia)
  const { contract, signer } = await getWriteContract();
  const address = await signer.getAddress();

  if (requireAdmin) {
    // Admin must have ADMIN role or be contract owner
    const role = await getOnChainRole(address);
    if (role !== 4) {
      // Check if owner
      let isOwner = false;
      try { isOwner = (await contract.owner()).toLowerCase() === address.toLowerCase(); } catch { /* ignore */ }
      if (!isOwner) {
        throw new Error(
          `Wallet ${address.slice(0, 8)}…${address.slice(-4)} tidak memiliki peran Admin di kontrak. ` +
          `Gunakan wallet deployer kontrak, atau minta owner memanggil: assignRole("${address}", 4, "Admin")`
        );
      }
    }
  } else {
    // Non-admin: self-register if no role
    report("Memeriksa registrasi wallet di kontrak…");
    const role = await getOnChainRole(address);
    if (role === 0) {
      report("Mendaftarkan wallet ke kontrak (selfRegister)…");
      try {
        const tx = await contract.selfRegister(`user_${address.slice(2, 8)}`);
        await tx.wait();
        report("Wallet terdaftar ✓");
      } catch (regErr: unknown) {
        const msg = extractErrorMessage(regErr);
        if (!msg.toLowerCase().includes("already registered")) {
          throw new Error(`Gagal registrasi wallet: ${msg}`);
        }
      }
    }
  }

  // 4. Register EMR if not yet on-chain
  report("Memeriksa registrasi EMR di blockchain…");
  const registered = await isEMRRegistered(emrId);
  if (!registered) {
    report("Mendaftarkan EMR pasien ke blockchain…");
    try {
      const tx = await contract.registerPatient(emrId, dataHash);
      await tx.wait();
      report("EMR terdaftar ✓");
    } catch (regErr: unknown) {
      const msg = extractErrorMessage(regErr);
      if (!msg.toLowerCase().includes("already registered")) {
        throw new Error(`Gagal mendaftarkan EMR: ${msg}`);
      }
    }
  }

  return { contract, signer };
}

// ─────────────────────────────────────────────────────────────────────────────
// Full-flow public functions (use these from pages)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Full flow: MetaMask → Sepolia → selfRegister → registerEMR → submitSOAP
 * Use this from the nurse SOAP page.
 */
export async function blockchainSubmitSOAPFull(
  emrId: string,
  dataHash: string,
  onStatus?: (msg: string) => void
): Promise<string> {
  const report = (msg: string) => { onStatus?.(msg); console.info("[Blockchain SOAP]", msg); };
  const { contract } = await prepareWrite(emrId, dataHash, false, report);
  report("Mencatat SOAP di blockchain…");
  try {
    const tx = await contract.submitSOAP(emrId, dataHash);
    const receipt = await tx.wait();
    const hash = receipt.hash as string;
    report(`SOAP berhasil dicatat: ${hash}`);
    return hash;
  } catch (err: unknown) {
    console.error("[Blockchain SOAP] submitSOAP error:", err);
    throw new Error(`Gagal submit SOAP: ${extractErrorMessage(err)}`);
  }
}

/**
 * Full flow: MetaMask → Sepolia → selfRegister → registerEMR → submitDoctorNote
 * Use this from the doctor examination page.
 */
export async function blockchainSubmitDoctorNoteFull(
  emrId: string,
  dataHash: string,
  onStatus?: (msg: string) => void
): Promise<string> {
  const report = (msg: string) => { onStatus?.(msg); console.info("[Blockchain DoctorNote]", msg); };
  const { contract } = await prepareWrite(emrId, dataHash, false, report);
  report("Mencatat catatan dokter di blockchain…");
  try {
    const tx = await contract.submitDoctorNote(emrId, dataHash);
    const receipt = await tx.wait();
    const hash = receipt.hash as string;
    report(`Catatan dokter berhasil dicatat: ${hash}`);
    return hash;
  } catch (err: unknown) {
    console.error("[Blockchain DoctorNote] submitDoctorNote error:", err);
    throw new Error(`Gagal submit catatan dokter: ${extractErrorMessage(err)}`);
  }
}

/**
 * Full flow: MetaMask → Sepolia → selfRegister → registerEMR → fulfillPrescription
 * Use this from the pharmacist page.
 */
export async function blockchainFulfillPrescriptionFull(
  emrId: string,
  dataHash: string,
  onStatus?: (msg: string) => void
): Promise<string> {
  const report = (msg: string) => { onStatus?.(msg); console.info("[Blockchain Rx]", msg); };
  const { contract } = await prepareWrite(emrId, dataHash, false, report);
  report("Mencatat pemenuhan resep di blockchain…");
  try {
    const tx = await contract.fulfillPrescription(emrId, dataHash);
    const receipt = await tx.wait();
    const hash = receipt.hash as string;
    report(`Resep berhasil dicatat: ${hash}`);
    return hash;
  } catch (err: unknown) {
    console.error("[Blockchain Rx] fulfillPrescription error:", err);
    throw new Error(`Gagal submit resep: ${extractErrorMessage(err)}`);
  }
}

/**
 * Full flow: MetaMask → Sepolia → (verify ADMIN role) → registerEMR → assignDepartment
 * Use this from the admin assign-poli pages.
 */
export async function blockchainAssignDepartmentFull(
  emrId: string,
  dataHash: string,
  onStatus?: (msg: string) => void
): Promise<string> {
  const report = (msg: string) => { onStatus?.(msg); console.info("[Blockchain Admin]", msg); };
  const { contract } = await prepareWrite(emrId, dataHash, true, report);
  report("Mencatat penugasan poli di blockchain…");
  try {
    const tx = await contract.assignDepartment(emrId, dataHash);
    const receipt = await tx.wait();
    const hash = receipt.hash as string;
    report(`Penugasan poli berhasil dicatat: ${hash}`);
    return hash;
  } catch (err: unknown) {
    console.error("[Blockchain Admin] assignDepartment error:", err);
    const reason = extractErrorMessage(err);
    if (reason.toLowerCase().includes("not admin") || reason.toLowerCase().includes("caller is not admin")) {
      throw new Error(
        "Wallet tidak memiliki peran Admin di smart contract. " +
        "Gunakan wallet deployer kontrak, atau minta owner memanggil assignRole(alamat, 4, \"Admin\")."
      );
    }
    if ((err as { code?: number })?.code === 4001 || reason.toLowerCase().includes("user denied") || reason.toLowerCase().includes("rejected")) {
      throw new Error("Transaksi dibatalkan oleh pengguna di MetaMask.");
    }
    throw new Error(`assignDepartment gagal: ${reason}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy single-step wrappers (kept for reference, prefer Full variants above)
// ─────────────────────────────────────────────────────────────────────────────

export async function blockchainRegisterPatient(emrId: string, dataHash: string): Promise<string> {
  const { contract } = await getWriteContract();
  const tx = await contract.registerPatient(emrId, dataHash);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function blockchainSubmitSOAP(emrId: string, dataHash: string): Promise<string> {
  const { contract } = await getWriteContract();
  const tx = await contract.submitSOAP(emrId, dataHash);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function blockchainSubmitDoctorNote(emrId: string, dataHash: string): Promise<string> {
  const { contract } = await getWriteContract();
  const tx = await contract.submitDoctorNote(emrId, dataHash);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function blockchainFulfillPrescription(emrId: string, dataHash: string): Promise<string> {
  const { contract } = await getWriteContract();
  const tx = await contract.fulfillPrescription(emrId, dataHash);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function blockchainAssignDepartment(emrId: string, dataHash: string): Promise<string> {
  const { contract } = await getWriteContract();
  const tx = await contract.assignDepartment(emrId, dataHash);
  const receipt = await tx.wait();
  return receipt.hash as string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Read helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function getEMRActions(emrId: string) {
  const contract = await getReadContract();
  return contract.getEMRActions(emrId);
}

export async function getOnChainRole(address: string): Promise<number> {
  try {
    const contract = await getReadContract();
    return Number(await contract.getRole(address));
  } catch {
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback ABI
// ─────────────────────────────────────────────────────────────────────────────

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
  "function owner() external view returns (address)",
  "event PatientRegistered(string indexed emrId, string dataHash, address indexed registrar, uint256 timestamp)",
  "event SOAPSubmitted(string indexed emrId, string dataHash, address indexed nurse, uint256 timestamp)",
  "event DoctorNoteSubmitted(string indexed emrId, string dataHash, address indexed doctor, uint256 timestamp)",
  "event PrescriptionCreated(string indexed emrId, string dataHash, address indexed pharmacist, uint256 timestamp)",
];
