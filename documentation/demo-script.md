# Defense Demo Script

Run commands from `deployment/`. Have the test wallet app and BscScan Testnet open. Never show `.env`, private keys, or a recovery phrase on screen.

## 1. Build and test locally

```bash
npm install
npm run compile
npm test
npm run coverage
```

Explain that Hardhat compiles Solidity and runs local tests. `code/contracts/` and `code/test/` are copied into ignored Hardhat build folders because Hardhat requires its project inputs to be within the `deployment/` project root.

## 2. Show the mandatory token deployment

- Network: BNB Smart Chain Testnet, chain ID 97.
- Token name and ticker: Tokenizer 42 / TK42.
- Token contract: `0x1be8A0534a8A0222Cd72d446Ef21E05C5c917cC7`.
- Open the [verified token on BscScan](https://testnet.bscscan.com/address/0x1be8A0534a8A0222Cd72d446Ef21E05C5c917cC7#code).

Run:

```bash
npm run demo:testnet
```

Point out the metadata, 4,200,000 initial supply, 42,000,000 cap, transfer to wallet 2, burn, and transaction links.

## 3. Explain the owner controls

Explain that only the current owner can mint, pause, or unpause. The cap limits minting; pausing blocks all token balance changes. Burning is public and permanent.

## 4. Bonus multisig demonstration

The multisig is deployed and verified at [0xb2777f0C477976DbcAF845c4C5AddC6065b21CaF](https://testnet.bscscan.com/address/0xb2777f0C477976DbcAF845c4C5AddC6065b21CaF#code). Token ownership was transferred in [this transaction](https://testnet.bscscan.com/tx/0xce1edf1237de80f8a21108ed18d46f02b67cde2966c7cf9a858053f03815c398).

Run:

```bash
npm run multisig:demo:testnet
```

Show wallet 1 submitting a mint call, execution failing with one approval, wallet 2 confirming, and execution succeeding at two approvals. The live demo used [proposal](https://testnet.bscscan.com/tx/0x33428f587e0bc1023841ff513a494fb51617f0075c22454a160114f7e652e68), [confirmation](https://testnet.bscscan.com/tx/0x81bd5576c5727ede24fa72acde9f6bf99c0e4bfc50bdc72bd38ff0bc36bdce6f), and [execution](https://testnet.bscscan.com/tx/0x5e1744ed0bc3d837786e0b5e7148352b654b67342024a3f3dbbd5b2d48ada2f9). Then show a direct mint from wallet 1 reverting because the multisig owns the token.
