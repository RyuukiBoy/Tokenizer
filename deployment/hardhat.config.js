require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("./scripts/prepare-contracts");

const configuredAccounts = [
  process.env.PRIVATE_KEY,
  process.env.PRIVATE_KEY_2,
  process.env.PRIVATE_KEY_3,
].filter((privateKey) => typeof privateKey === "string" && privateKey.trim().length > 0);

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      evmVersion: "paris",
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {},
    localhost: { url: "http://127.0.0.1:8545" },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "",
      chainId: 97,
      accounts: configuredAccounts,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
};
