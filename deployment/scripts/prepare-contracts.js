const fs = require("node:fs");
const path = require("node:path");

// Hardhat rejects Solidity source files outside its project root. Keep code/contracts
// canonical and copy it into this ignored build directory before every Hardhat run.
const canonicalContractsDirectory = path.resolve(__dirname, "../../code/contracts");
const hardhatContractsDirectory = path.resolve(__dirname, "../contracts");
const canonicalTestsDirectory = path.resolve(__dirname, "../../code/test");
const hardhatTestsDirectory = path.resolve(__dirname, "../test");

fs.rmSync(hardhatContractsDirectory, { recursive: true, force: true });
fs.mkdirSync(hardhatContractsDirectory, { recursive: true });
fs.cpSync(canonicalContractsDirectory, hardhatContractsDirectory, { recursive: true });
fs.rmSync(hardhatTestsDirectory, { recursive: true, force: true });
fs.mkdirSync(hardhatTestsDirectory, { recursive: true });
fs.cpSync(canonicalTestsDirectory, hardhatTestsDirectory, { recursive: true });
