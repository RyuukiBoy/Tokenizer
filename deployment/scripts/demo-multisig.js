const fs = require("node:fs");
const path = require("node:path");
const { ethers, network } = require("hardhat");

function readDeploymentRecord() {
  const deploymentFile = path.resolve(__dirname, "../deployments/bscTestnet.json");
  if (!fs.existsSync(deploymentFile)) {
    throw new Error("No BNB Smart Chain Testnet deployment record was found.");
  }
  return JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
}

function printTransaction(name, transactionHash) {
  console.log(`${name} transaction: ${transactionHash}`);
  if (network.name === "bscTestnet") {
    console.log(`Explorer: https://testnet.bscscan.com/tx/${transactionHash}`);
  }
}

async function main() {
  if (network.name !== "bscTestnet") {
    throw new Error(`Run this script on bscTestnet; current network is ${network.name}.`);
  }

  const deploymentRecord = readDeploymentRecord();
  const tokenAddress = deploymentRecord.token?.address;
  const multisigAddress = deploymentRecord.multisig?.address;
  if (!tokenAddress || !multisigAddress) {
    throw new Error("Deploy the token and multisig before running this demo.");
  }

  const signers = await ethers.getSigners();
  if (signers.length < 2) {
    throw new Error("The demo requires at least two funded owner keys in deployment/.env.");
  }
  const [ownerOne, ownerTwo] = signers;
  const [ownerOneAddress, ownerTwoAddress] = await Promise.all([ownerOne.getAddress(), ownerTwo.getAddress()]);
  const token = await ethers.getContractAt("Tokenizer42", tokenAddress, ownerOne);
  const multisig = await ethers.getContractAt("MultiSigWallet", multisigAddress, ownerOne);

  const currentTokenOwner = await token.owner();
  if (currentTokenOwner.toLowerCase() !== multisigAddress.toLowerCase()) {
    throw new Error("The token owner is not the recorded multisig address.");
  }

  const recipientAddress = ownerTwoAddress;
  const mintAmount = ethers.parseEther("1");
  const mintCallData = token.interface.encodeFunctionData("mint", [recipientAddress, mintAmount]);
  const transactionId = await multisig.getTransactionCount();

  const submitTransaction = await multisig.submitTransaction(tokenAddress, 0, mintCallData);
  await submitTransaction.wait();
  printTransaction("Submit mint proposal", submitTransaction.hash);
  console.log(`Transaction id: ${transactionId}`);
  console.log(`Confirmations after submit: ${(await multisig.getTransaction(transactionId)).confirmationCount}/2`);

  try {
    await multisig.executeTransaction(transactionId);
    throw new Error("The transaction unexpectedly executed with only one confirmation.");
  } catch (error) {
    if (error.message === "The transaction unexpectedly executed with only one confirmation.") {
      throw error;
    }
    console.log("Execution with one confirmation failed as expected.");
  }

  const confirmTransaction = await multisig.connect(ownerTwo).confirmTransaction(transactionId);
  await confirmTransaction.wait();
  printTransaction("Confirm mint proposal", confirmTransaction.hash);
  console.log("Second owner's confirmation is mined; the following execution proves the 2-of-3 threshold was met.");

  const executeTransaction = await multisig.executeTransaction(transactionId);
  await executeTransaction.wait();
  printTransaction("Execute mint proposal", executeTransaction.hash);
  console.log(`Wallet 2 TK42 balance: ${ethers.formatEther(await token.balanceOf(recipientAddress))}`);
  console.log(`Total supply: ${ethers.formatEther(await token.totalSupply())} TK42`);

  try {
    await token.mint(ownerOneAddress, mintAmount);
    throw new Error("Direct mint by the former owner unexpectedly succeeded.");
  } catch (error) {
    if (error.message === "Direct mint by the former owner unexpectedly succeeded.") {
      throw error;
    }
    console.log("Direct mint from wallet 1 failed as expected because the multisig owns the token.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
