/**
 * deploy.js
 * ---------
 * Deploys the EMR smart contract to the configured network and writes the
 * deployed address + ABI to:
 *   - backend/src/contract/EMR.json
 *   - frontend/src/contract/EMR.json
 *
 * Run:
 *   npx hardhat run scripts/deploy.js --network localhost
 */

const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying EMR contract with account:", deployer.address);
  console.log(
    "Account balance:",
    ethers.formatEther(await ethers.provider.getBalance(deployer.address)),
    "ETH"
  );

  // Deploy
  const EMRFactory = await ethers.getContractFactory("EMR");
  const emr = await EMRFactory.deploy();
  await emr.waitForDeployment();

  const contractAddress = await emr.getAddress();
  console.log("EMR deployed to:", contractAddress);

  // Build the artifact we need to share with backend + frontend
  const artifact = await artifacts.readArtifact("EMR");
  const deployInfo = {
    address: contractAddress,
    abi:     artifact.abi,
    network: hre.network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  // Write to backend
  const backendContractDir = path.join(__dirname, "../backend/src/contract");
  fs.mkdirSync(backendContractDir, { recursive: true });
  fs.writeFileSync(
    path.join(backendContractDir, "EMR.json"),
    JSON.stringify(deployInfo, null, 2)
  );

  // Write to frontend
  const frontendContractDir = path.join(__dirname, "../frontend/src/contract");
  fs.mkdirSync(frontendContractDir, { recursive: true });
  fs.writeFileSync(
    path.join(frontendContractDir, "EMR.json"),
    JSON.stringify(deployInfo, null, 2)
  );

  console.log("Contract info written to backend/src/contract/EMR.json");
  console.log("Contract info written to frontend/src/contract/EMR.json");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
