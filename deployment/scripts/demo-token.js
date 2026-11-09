const fs = require("node:fs");
const path = require("node:path");
const { ethers, network } = require("hardhat");

function readDeploymentRecord() {
  const deploymentFile = path.resolve(__dirname, `../deployments/${network.name}.json`);
  if (!fs.existsSync(deploymentFile)) {
    throw new Error(`No deployment record for ${network.name}. Run the matching deploy command first.`);
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
  const deploymentRecord = readDeploymentRecord();
  if (!deploymentRecord.token?.address) {
    throw new Error(`The ${network.name} deployment record does not contain a token address.`);
  }

  const [deployer, secondWallet] = await ethers.getSigners();
  if (!secondWallet) {
    throw new Error("The demo needs a second wallet to receive a token transfer.");
  }

  const token = await ethers.getContractAt("Tokenizer42", deploymentRecord.token.address, deployer);
  console.log(`Token name: ${await token.name()}`);
  console.log(`Symbol: ${await token.symbol()}`);
  console.log(`Decimals: ${await token.decimals()}`);
  console.log(`Total supply: ${ethers.formatEther(await token.totalSupply())} TK42`);
  console.log(`Maximum supply: ${ethers.formatEther(await token.MAXIMUM_SUPPLY())} TK42`);
  console.log(`Owner: ${await token.owner()}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(await token.balanceOf(deployer.address))} TK42`);

  const transferTransaction = await token.transfer(secondWallet.address, ethers.parseEther("1"));
  await transferTransaction.wait();
  printTransaction("Transfer", transferTransaction.hash);
  console.log(`Deployer balance after transfer: ${ethers.formatEther(await token.balanceOf(deployer.address))} TK42`);
  console.log(`Wallet 2 balance after transfer: ${ethers.formatEther(await token.balanceOf(secondWallet.address))} TK42`);

  const burnTransaction = await token.burn(ethers.parseEther("0.1"));
  await burnTransaction.wait();
  printTransaction("Burn", burnTransaction.hash);
  console.log(`Total supply after burn: ${ethers.formatEther(await token.totalSupply())} TK42`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
