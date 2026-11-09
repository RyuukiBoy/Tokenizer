# Tokenizer 42 (TK42) Whitepaper

## Purpose

Tokenizer 42 is a small BEP-20 token built for the 42 School “Tokenizer – Build your own token” project. It demonstrates standard token balances and transfers, a maximum supply, optional burning, an emergency pause, and controlled minting. It has no investment purpose, promised value, or claim on goods or services. It is deployed only on BNB Smart Chain Testnet, where tBNB and TK42 have no real-money value.

## Network and deployed token

- Network: BNB Smart Chain Testnet
- Chain ID: 97
- Contract: `Tokenizer42`
- Name: `Tokenizer 42`
- Symbol: `TK42`
- Decimals: 18
- Contract address: `0x1be8A0534a8A0222Cd72d446Ef21E05C5c917cC7`
- Verified source: [BscScan contract page](https://testnet.bscscan.com/address/0x1be8A0534a8A0222Cd72d446Ef21E05C5c917cC7#code)

## Supply and token rules

The constructor created 4,200,000 TK42 for the initial owner. The contract caps total supply at 42,000,000 TK42. The owner may mint more tokens while staying under that cap. A holder may burn their own tokens, and an approved spender may use `burnFrom` within the holder’s allowance. Burning lowers the total supply permanently.

The token uses 18 decimal places. On-chain amounts are integers in the smallest unit: 1 TK42 is represented as 1,000,000,000,000,000,000 units.

## Roles

The owner can mint, pause, unpause, and transfer ownership. In the mandatory deployment, the owner was the deployer address. The bonus deployment transferred ownership to the 2-of-3 `MultiSigWallet`; the multisig can call those owner-only token functions after two owners approve a transaction. Both deployments and the ownership transfer are recorded in `deployment/deployments/bscTestnet.json`.

All holders can use ordinary BEP-20 transfers and approvals. Holders can burn their own TK42. There are no transfer fees, blacklist, upgrade mechanism, or hidden minting role.

## Token economics and limits

There is no presale, allocation schedule, staking reward, or financial return. The initial supply is a demonstration amount; up to 37,800,000 additional tokens can be minted by the owner before the cap is reached. A pause blocks balance changes, including transfers, mints, and burns. Only the owner can resume transfers.

## Risks and intended use

The token exists on a public test network, but testnet availability and explorer services can change. Testnet tokens can be lost or become unavailable without financial recovery. If ownership is renounced, no account can mint or pause again. If ownership is transferred to a multisig and fewer than the required owners remain available, privileged actions may become impossible. This project is educational and is not audited for production use.
