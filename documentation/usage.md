# Usage Guide

## Network

Use **BNB Smart Chain Testnet**, chain ID **97**. The native test coin is tBNB and has no real-money value. The official BNB Chain RPC list includes `https://bsc-testnet-dataseed.bnbchain.org`; the official testnet explorer is [BscScan Testnet](https://testnet.bscscan.com/).

## Add TK42 to MetaMask

1. Switch MetaMask to BNB Smart Chain Testnet (chain ID 97).
2. Choose **Import tokens** / **Add token**.
3. Paste the token address: `0x1be8A0534a8A0222Cd72d446Ef21E05C5c917cC7`.
4. Confirm symbol `TK42` and 18 decimals.

The token’s code and current balances are visible on its [BscScan contract page](https://testnet.bscscan.com/address/0x1be8A0534a8A0222Cd72d446Ef21E05C5c917cC7).

## Transfer and burn

Use MetaMask’s send flow to transfer TK42 to another address. The token follows the ERC-20/BEP-20 interface, so wallets and explorers can read its balances and transfers. A holder can burn tokens through a contract interaction by calling `burn(amount)`; an approved spender can call `burnFrom(holder, amount)` up to the holder’s allowance. Amounts in a contract call are in the smallest unit: for example, 1 TK42 is `1000000000000000000`.

To run the scripted transfer-and-burn demonstration on testnet, use `npm run demo:testnet` from the `deployment/` directory. The script prints BscScan transaction links.

## Owner actions

The current owner can call `mint(recipient, amount)`, `pause()`, and `unpause()`. The owner can also transfer ownership. Token ownership is now held by the 2-of-3 multisig, so direct calls by the former deployer account fail; use the multisig transaction flow for privileged calls.

## Multisig flow

1. An owner calls `submitTransaction` with the token address, value `0`, and encoded token call data.
2. Another owner calls `confirmTransaction(transactionId)`.
3. Once two of three owners have confirmed, an owner calls `executeTransaction(transactionId)`.
4. Check the token event and resulting state on BscScan.

The exact testnet multisig address is listed in the project README and saved in `deployment/deployments/bscTestnet.json`.
