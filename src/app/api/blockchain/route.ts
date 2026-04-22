/**
 * GET /api/blockchain?emrId=...
 * Returns all on-chain actions for an EMR ID using server-side RPC.
 * Useful when the client doesn't have MetaMask.
 */

import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
const RPC_URL          = process.env.NEXT_PUBLIC_RPC_URL          || "https://rpc.sepolia.org";

// Minimal read-only ABI
const ABI = [
  "function getEMRActions(string emrId) external view returns (tuple(uint256 id, string emrId, string dataHash, uint8 actionType, address submitter, uint256 timestamp, bool isActive)[])",
  "function isRegistered(string emrId) external view returns (bool)",
  "function getTotalActions() external view returns (uint256)",
];

export async function GET(req: NextRequest) {
  const emrId = req.nextUrl.searchParams.get("emrId");
  if (!emrId) {
    return NextResponse.json({ error: "emrId is required" }, { status: 400 });
  }
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const actions  = await contract.getEMRActions(emrId);
    const serialized = actions.map((a: {
      id: bigint; emrId: string; dataHash: string;
      actionType: bigint; submitter: string; timestamp: bigint; isActive: boolean;
    }) => ({
      id:         Number(a.id),
      emrId:      a.emrId,
      dataHash:   a.dataHash,
      actionType: Number(a.actionType),
      submitter:  a.submitter,
      timestamp:  Number(a.timestamp),
      isActive:   a.isActive,
    }));
    return NextResponse.json({ actions: serialized });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Blockchain query failed" },
      { status: 500 }
    );
  }
}
