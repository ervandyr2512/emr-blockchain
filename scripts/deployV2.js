/**
 * deployV2.js
 * -----------
 * Deploy EMRv2 contract and write ABI + address to frontend contract folder.
 *
 * Usage:
 *   npx hardhat run scripts/deployV2.js --network sepolia
 *   npx hardhat run scripts/deployV2.js --network localhost
 */

const hre    = require("hardhat");
const fs     = require("fs");
const path   = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("\n  Deploying EMRv2 with account:", deployer.address);
  console.log("  Account balance           :", (await hre.ethers.provider.getBalance(deployer.address)).toString(), "wei\n");

  // ── Deploy ──────────────────────────────────────────────────────────────
  const EMRv2   = await hre.ethers.getContractFactory("EMRv2");
  const contract = await EMRv2.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("  ✅  EMRv2 deployed to:", address);

  // ── Write ABI + address ──────────────────────────────────────────────────
  const artifact = await hre.artifacts.readArtifact("EMRv2");

  const output = JSON.stringify(
    { address, abi: artifact.abi },
    null,
    2
  );

  // Write to frontend contract directory
  const frontendPath = path.join(__dirname, "..", "frontend", "src", "lib", "contract");
  fs.mkdirSync(frontendPath, { recursive: true });
  fs.writeFileSync(path.join(frontendPath, "EMRv2.json"), output);

  console.log("  📄  ABI written to frontend/src/lib/contract/EMRv2.json");
  console.log("\n  Add this to frontend/.env.local:");
  console.log(`  NEXT_PUBLIC_CONTRACT_ADDRESS=${address}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
