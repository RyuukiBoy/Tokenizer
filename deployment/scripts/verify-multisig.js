const fs = require("node:fs");
const path = require("node:path");
const hre = require("hardhat");

async function main() {
  if (hre.network.name !== "bscTestnet") {
    throw new Error(`Run this script on bscTestnet; current network is ${hre.network.name}.`);
  }

  const deploymentFile = path.resolve(__dirname, "../deployments/bscTestnet.json");
  if (!fs.existsSync(deploymentFile)) {
    throw new Error("No BNB Smart Chain Testnet deployment record found.");
  }
  const deploymentRecord = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const multisigDeployment = deploymentRecord.multisig;
  if (!multisigDeployment?.address || !Array.isArray(multisigDeployment.constructorArguments)) {
    throw new Error("The multisig has not been deployed or its constructor arguments are missing.");
  }

  console.log(`Verifying MultiSigWallet at ${multisigDeployment.address} on BNB Smart Chain Testnet...`);
  await hre.run("verify:verify", {
    address: multisigDeployment.address,
    constructorArguments: multisigDeployment.constructorArguments,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
