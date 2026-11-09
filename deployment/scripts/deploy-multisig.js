const fs = require("node:fs");
const path = require("node:path");
const { ethers, network } = require("hardhat");

function readTokenDeployment() {
  const deploymentFile = path.resolve(__dirname, "../deployments/bscTestnet.json");
  if (!fs.existsSync(deploymentFile)) {
    throw new Error("No BNB Smart Chain Testnet token deployment record was found.");
  }
  return { deploymentFile, record: JSON.parse(fs.readFileSync(deploymentFile, "utf8")) };
}

function writeDeploymentRecord(deploymentFile, record) {
  fs.writeFileSync(deploymentFile, `${JSON.stringify(record, null, 2)}\n`);
}

async function main() {
  if (network.name !== "bscTestnet") {
    throw new Error(`Run this script on bscTestnet; current network is ${network.name}.`);
  }

  const { deploymentFile, record } = readTokenDeployment();
  if (!record.token?.address) {
    throw new Error("The BNB Smart Chain Testnet token must be deployed before the multisig bonus.");
  }

  const signers = await ethers.getSigners();
  if (signers.length < 3) {
    throw new Error("The multisig deployment requires all three owner private keys in deployment/.env.");
  }
  const ownerAddresses = await Promise.all(signers.slice(0, 3).map((signer) => signer.getAddress()));
  const requiredConfirmations = Number(process.env.MULTISIG_REQUIRED || "2");
  if (!Number.isInteger(requiredConfirmations) || requiredConfirmations < 1 || requiredConfirmations > ownerAddresses.length) {
    throw new Error("MULTISIG_REQUIRED must be an integer from 1 through 3.");
  }

  const token = await ethers.getContractAt("Tokenizer42", record.token.address, signers[0]);
  const currentOwner = await token.owner();
  let multisigAddress = record.multisig?.address;

  if (!multisigAddress) {
    const MultiSigWallet = await ethers.getContractFactory("MultiSigWallet", signers[0]);
    const multisig = await MultiSigWallet.deploy(ownerAddresses, requiredConfirmations);
    const deploymentTransaction = multisig.deploymentTransaction();
    const deploymentReceipt = await deploymentTransaction.wait();
    multisigAddress = await multisig.getAddress();

    record.multisig = {
      address: multisigAddress,
      owners: ownerAddresses,
      requiredConfirmations,
      transactionHash: deploymentTransaction.hash,
      blockNumber: deploymentReceipt.blockNumber,
      deployedAt: new Date().toISOString(),
      constructorArguments: [ownerAddresses, requiredConfirmations],
      ownershipTransfer: null,
    };
    writeDeploymentRecord(deploymentFile, record);

    console.log(`Multisig address: ${multisigAddress}`);
    console.log(`Multisig deployment transaction: ${deploymentTransaction.hash}`);
    console.log(`Multisig deployment block: ${deploymentReceipt.blockNumber}`);
  } else {
    console.log(`Using existing multisig at ${multisigAddress}`);
  }

  if (currentOwner.toLowerCase() === multisigAddress.toLowerCase()) {
    console.log("The token is already owned by the multisig.");
  } else if (currentOwner.toLowerCase() === ownerAddresses[0].toLowerCase()) {
    const transferTransaction = await token.transferOwnership(multisigAddress);
    const transferReceipt = await transferTransaction.wait();
    const newOwner = await token.owner();
    if (newOwner.toLowerCase() !== multisigAddress.toLowerCase()) {
      throw new Error("Ownership transfer did not set the multisig as the token owner.");
    }

    record.multisig.ownershipTransfer = {
      transactionHash: transferTransaction.hash,
      blockNumber: transferReceipt.blockNumber,
      completedAt: new Date().toISOString(),
    };
    writeDeploymentRecord(deploymentFile, record);
    console.log(`Ownership transfer transaction: ${transferTransaction.hash}`);
    console.log(`Ownership transfer block: ${transferReceipt.blockNumber}`);
  } else {
    throw new Error(`Unexpected token owner ${currentOwner}; refusing to transfer ownership.`);
  }

  console.log(`Verified token owner(): ${await token.owner()}`);
  console.log(`Saved multisig deployment data: ${path.relative(process.cwd(), deploymentFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
