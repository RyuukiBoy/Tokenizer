const fs = require("node:fs");
const path = require("node:path");
const { ethers, network } = require("hardhat");

const initialSupply = ethers.parseEther("4200000");

async function main() {
  const [deployer] = await ethers.getSigners();
  const Tokenizer42 = await ethers.getContractFactory("Tokenizer42", deployer);
  const token = await Tokenizer42.deploy(deployer.address, initialSupply);
  const deploymentTransaction = token.deploymentTransaction();
  const receipt = await deploymentTransaction.wait();
  const contractAddress = await token.getAddress();
  const chain = await ethers.provider.getNetwork();
  const deploymentRecord = {
    network: network.name,
    chainId: Number(chain.chainId),
    token: {
      name: await token.name(),
      symbol: await token.symbol(),
      address: contractAddress,
      transactionHash: deploymentTransaction.hash,
      blockNumber: receipt.blockNumber,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      initialOwner: deployer.address,
      initialSupply: initialSupply.toString(),
      constructorArguments: [deployer.address, initialSupply.toString()],
    },
    multisig: null,
  };

  const deploymentFile = path.resolve(__dirname, `../deployments/${network.name}.json`);
  fs.mkdirSync(path.dirname(deploymentFile), { recursive: true });
  fs.writeFileSync(deploymentFile, `${JSON.stringify(deploymentRecord, null, 2)}\n`);

  console.log(`Network: ${network.name} (chain id ${chain.chainId})`);
  console.log(`Token address: ${contractAddress}`);
  console.log(`Deployment transaction: ${deploymentTransaction.hash}`);
  console.log(`Deployment block: ${receipt.blockNumber}`);
  console.log(`Saved deployment record: ${path.relative(process.cwd(), deploymentFile)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
