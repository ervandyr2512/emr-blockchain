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

  // Write to src/lib/contract (Next.js frontend, no "frontend/" prefix)
  const contractPath = path.join(__dirname, "..", "src", "lib", "contract");
  fs.mkdirSync(contractPath, { recursive: true });
  fs.writeFileSync(path.join(contractPath, "EMRv2.json"), output);
  console.log("  📄  ABI written to src/lib/contract/EMRv2.json");

  // Also update .env.local automatically
  const envLocalPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envLocalPath)) {
    let envContent = fs.readFileSync(envLocalPath, "utf8");
    envContent = envContent.replace(
      /^NEXT_PUBLIC_CONTRACT_ADDRESS=.*/m,
      `NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`
    );
    fs.writeFileSync(envLocalPath, envContent);
    console.log("  ✅  .env.local updated with new contract address");
  }

  console.log("\n  ✅  NEXT_PUBLIC_CONTRACT_ADDRESS=" + address + "\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
