const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

async function main() {
  if (hre.network.name !== "bscTestnet") {
    throw new Error(`Run this script on bscTestnet; current network is ${hre.network.name}.`);
  }

  const deploymentFile = path.resolve(__dirname, "../deployments/bscTestnet.json");
  if (!fs.existsSync(deploymentFile)) {
    throw new Error("No BSC Testnet deployment record found. Deploy Tokenizer42 first.");
  }
  const deploymentRecord = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const tokenDeployment = deploymentRecord.token;
  if (!tokenDeployment?.address || !Array.isArray(tokenDeployment.constructorArguments)) {
    throw new Error("The BSC Testnet deployment record is missing the token address or constructor arguments.");
  }

  console.log(`Verifying Tokenizer42 at ${tokenDeployment.address} on BNB Smart Chain Testnet...`);
  await hre.run("verify:verify", {
    address: tokenDeployment.address,
    constructorArguments: tokenDeployment.constructorArguments,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
