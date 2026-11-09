# Deployment Guide

This page explains how to deploy Tokenizer 42 (TK42) from zero, on BNB Smart Chain Testnet (chain ID 97). It uses test coins only, never real money. Run every command from the `deployment/` folder.

## What you need

- Node.js 20 LTS or newer and Git.
- A browser wallet such as MetaMask, set to **BNB Smart Chain Testnet**.
- 3 test-only wallets (never wallets with real funds). Wallet 1 deploys the token. Wallets 2 and 3 are the other multisig signers (bonus).
- Free test coins (tBNB) from the official BNB Chain testnet faucet, at least for wallet 1.
- A free Etherscan account with an API key (used to verify the contract on BscScan).
- A testnet RPC address. The official list includes `https://bsc-testnet-dataseed.bnbchain.org`.

## 1. Install

```bash
cd deployment
npm install
```

## 2. Configure the secrets

```bash
cp .env.example .env
```

Fill in `.env`:

```
BSC_TESTNET_RPC_URL=https://bsc-testnet-dataseed.bnbchain.org
PRIVATE_KEY=<wallet 1 private key>
PRIVATE_KEY_2=<wallet 2 private key>
PRIVATE_KEY_3=<wallet 3 private key>
ETHERSCAN_API_KEY=<your API key>
MULTISIG_REQUIRED=2
```

`.env` is ignored by Git. Never commit it and never show it on screen.

## 3. Compile and test before deploying

```bash
npm run compile
npm test
```

All tests must pass before you deploy anything.

## 4. Deploy the token (mandatory part)

```bash
npm run deploy:testnet
```

What happens: the contract `Tokenizer42` is published with wallet 1 as owner and an initial supply of 4,200,000 TK42 (cap 42,000,000). The script prints the contract address and the transaction hash, and saves them in `deployments/bscTestnet.json`.

## 5. Verify the source code on BscScan

```bash
npm run verify:testnet
```

Open `https://testnet.bscscan.com/address/<token address>#code`. A verified contract shows its source code, so anyone can check it matches what is deployed.

## 6. Check that it works

```bash
npm run demo:testnet
```

The demo prints the token name, symbol, decimals, supply, cap and owner, transfers a small amount to wallet 2 and burns a tiny amount. Each transaction is printed with a BscScan link. You can also import the token in MetaMask with its address, symbol `TK42` and 18 decimals.

## 7. Bonus: deploy the multisig and give it ownership

```bash
npm run multisig:deploy:testnet
npm run multisig:verify:testnet
```

What happens: `MultiSigWallet` is deployed with wallets 1, 2 and 3 as owners and 2 required approvals. Then the token ownership is transferred to it. From this moment, `mint`, `pause` and `unpause` need 2 of 3 approvals. The multisig address and the ownership transfer transaction are saved in `deployments/bscTestnet.json`.

Check the multisig flow:

```bash
npm run multisig:demo:testnet
```

## 8. Record the result

Write the token address, the multisig address and the network in the project README. They are also saved in `deployment/deployments/bscTestnet.json`.

## Optional: rehearse on a local fake chain

```bash
# terminal 1
npm run node
# terminal 2
npm run deploy:local
npm run demo:local
```

## Common problems

| Problem | Fix |
|---|---|
| `insufficient funds for gas` | Get more tBNB from the faucet for that wallet. |
| `could not detect network` | The RPC address is wrong or down; use another one from the official BNB docs. |
| `invalid opcode` on deploy | Set `evmVersion` in `hardhat.config.js` to `paris` (or `shanghai`) and deploy again. |
| Verification fails | Wait one minute after deployment, check the API key, and check that the constructor arguments match. |
| `nonce too low` or a stuck transaction | Wait, or reset the account activity in MetaMask, then retry. |
| Import errors from OpenZeppelin | Run `npm install` inside `deployment/`, not at the repository root. |