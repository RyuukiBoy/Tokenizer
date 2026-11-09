# Tokenizer 42 (TK42) — my own token on BNB Smart Chain Testnet

42 School project **Tokenizer – Build your own token** (Web3, partnership with BNB Chain).
Mandatory part: a BEP-20 token deployed on a public test chain.
Bonus part: a multisignature wallet that owns the token (2 of 3 signatures needed for sensitive actions).

## Deployed information

| Item | Value |
|---|---|
| Network | BNB Smart Chain Testnet (chain id 97) |
| Token name / ticker | Tokenizer 42 / **TK42** |
| Token contract address | `0x1be8A0534a8A0222Cd72d446Ef21E05C5c917cC7` |
| Token on explorer | [Open Tokenizer42 on BscScan](https://testnet.bscscan.com/address/0x1be8A0534a8A0222Cd72d446Ef21E05C5c917cC7) |
| Multisig contract address (bonus) | `0xb2777f0C477976DbcAF845c4C5AddC6065b21CaF` |
| Multisig on explorer | [Open verified MultiSigWallet on BscScan](https://testnet.bscscan.com/address/0xb2777f0C477976DbcAF845c4C5AddC6065b21CaF#code) |
| Token owner | MultiSigWallet (2 of 3 owners required) |
| Tests / coverage | 22 passing; 100% statements, functions, and lines; 97.92% branches |

> Everything runs on a **test** network. No real money is used or needed.

---

## 1. What this project is, in simple words

A **blockchain** is a shared notebook that thousands of computers keep identical. Nobody can secretly edit it.
A **token** is just a line in a smart contract's notebook: "address A owns 100 TK42, address B owns 5 TK42".
A **smart contract** is a small program stored on the blockchain. Once published it cannot be changed, and everybody can read it.
My contract `Tokenizer42` is that program: it keeps the balances and the rules (who can send, who can create new tokens, who can stop everything).

## 2. Concepts you must understand (for the defense)

| Word | Simple meaning |
|---|---|
| **BEP-20 / ERC-20** | A standard list of functions every token must have (`transfer`, `approve`, `balanceOf`...). Wallets and explorers rely on it. BEP-20 is the same thing as ERC-20, but on BNB chain. |
| **Testnet** | A practice copy of the blockchain. Coins on it are free and worth nothing. |
| **tBNB** | The free test coin used to pay fees on the testnet (from a faucet). |
| **Gas** | The fee paid to run a transaction. |
| **Wallet / private key** | The wallet is your account. The private key is the password that proves it is yours. Never share it, never commit it. |
| **Deploy** | Publishing the contract on the blockchain. It gets a permanent address. |
| **Verify (BscScan)** | Uploading the source code so everybody can read it and check it matches the deployed one. |
| **Decimals (18)** | Tokens are stored as integers: 1 TK42 = 10^18 smallest units. |
| **Cap** | The maximum number of tokens that can ever exist (42,000,000). |
| **Mint / Burn** | Mint = create new tokens (owner only, below the cap). Burn = destroy tokens. |
| **Owner** | The one address allowed to do privileged actions (`mint`, `pause`, `unpause`). |
| **Pause** | An emergency switch that stops all transfers. |
| **Multisig** | A wallet that needs several people to approve before acting (here 2 of 3). |
| **OpenZeppelin** | A well-audited library of contract building blocks. Using it is safer than writing everything myself. |
| **Hardhat** | The tool to compile, test and deploy contracts. |

## 3. My choices and why

| Choice | Why |
|---|---|
| BNB Smart Chain Testnet | The subject comes from the BNB Chain partnership. Free faucet, cheap, BscScan explorer. |
| Solidity + Hardhat | Most used and best documented stack for EVM chains. Easy tests and scripts. |
| OpenZeppelin v5 | Audited code for ERC-20, burn, pause and ownership, so I do not reinvent security-critical code. |
| Name `Tokenizer 42`, ticker `TK42` | Must contain 42. Short and clear. |
| 18 decimals | Standard, same as BNB and ETH. Wallets display it correctly. |
| Cap 42,000,000, initial supply 4,200,000 | A fixed ceiling makes the token trustworthy: nobody can inflate it forever. |
| Owner-only `mint` / `pause` | Real privileges must exist but be limited and documented. |
| Public burn | Any holder can destroy their own tokens. Harmless and useful. |
| No fees, no blacklist, no upgradeability | Simpler to explain and safer. Less hidden power. |
| Custom small multisig (2 of 3) | Easy to read and defend in a code review. Protects the owner powers against one stolen key. |
| Bonus done as a second step | The mandatory token stays valid by itself. The bonus then moves ownership to the multisig. |

## 4. Folder structure

```
.
├── README.md            this file
├── code/
│   ├── contracts/       Tokenizer42.sol, MultiSigWallet.sol
│   └── test/            automated tests
├── deployment/          Hardhat config, scripts, .env.example, deployed addresses
└── documentation/       whitepaper, architecture, usage, security, demo script
```

## 5. How to run it, step by step

### Prerequisites
- Node.js 20 LTS or newer (`node -v`)
- Git
- A browser wallet such as MetaMask

### Step 1 — Get the code and install
```bash
git clone <your-repo-url>
cd <your-repo>/deployment
npm install
```

### Step 2 — Create 3 test wallets
In MetaMask create 3 **new** accounts used only for this project (never a wallet with real money).
Export each private key (Account details → Show private key). Wallet 1 deploys the token, wallets 2 and 3 are the other multisig signers.

### Step 3 — Get free tBNB
Use the official BNB Chain testnet faucet (search "BNB Chain testnet faucet" on bnbchain.org). Request tBNB for wallet 1, and a little for wallets 2 and 3.
Check that the wallet is on the **BNB Smart Chain Testnet** (chain id 97). If the network is missing in MetaMask, add it from the official BNB docs.

### Step 4 — Get a BscScan / Etherscan API key
Create a free account on etherscan.io and generate an API key (it is used for BscScan verification).

### Step 5 — Configure the environment
```bash
cp .env.example .env
```
Edit `.env`:
```
BSC_TESTNET_RPC_URL=<a BSC testnet RPC url from the official BNB docs>
PRIVATE_KEY=<wallet 1 key>
PRIVATE_KEY_2=<wallet 2 key>
PRIVATE_KEY_3=<wallet 3 key>
ETHERSCAN_API_KEY=<your api key>
MULTISIG_REQUIRED=2
```
`.env` is in `.gitignore`. **Never commit it.**

### Step 6 — Compile and test
```bash
npm run compile
npm test
npm run coverage      # optional: shows how much code is tested
```

### Step 7 — (optional) Try everything on a local fake chain
Terminal 1: `npm run node`
Terminal 2: `npm run deploy:local`, then `npm run demo:local`

### Step 8 — Deploy the token on BSC Testnet
```bash
npm run deploy:testnet
```
Copy the printed contract address. It is also saved in `deployment/deployments/bscTestnet.json`. Put it in the table at the top of this file.

### Step 9 — Verify on BscScan
```bash
npm run verify:testnet
```
Open `https://testnet.bscscan.com/address/<token address>` and check the green "Contract" tab with the source code. The ticker `TK42` and name appear on the token page.

### Step 10 — Add the token to MetaMask
Import tokens → paste the token address → symbol `TK42`, 18 decimals. You should see 4,200,000 TK42 on wallet 1.

### Step 11 — Run the demo (minimal actions)
```bash
npm run demo:testnet
```
It prints name, symbol, decimals, supply, cap and owner, sends a small amount from wallet 1 to wallet 2, burns a tiny amount, and shows BscScan links for each transaction.

### Step 12 — Bonus: deploy the multisig and give it ownership
```bash
npm run multisig:deploy:testnet
npm run multisig:verify:testnet
```
This deploys the multisig with wallets 1, 2 and 3 as signers (2 required) and transfers the token ownership to it. Put the multisig address in the table at the top.

### Step 13 — Bonus: demo the multisig
```bash
npm run multisig:demo:testnet
```
What you will see: wallet 1 proposes to mint tokens → executing fails (only 1 of 2 approvals) → wallet 2 approves → execution succeeds → supply increases. A direct `mint` from wallet 1 now fails, because wallet 1 is no longer the owner.

## 6. What the token can do

| Function | Who | Effect |
|---|---|---|
| `transfer`, `approve`, `transferFrom`, `balanceOf`, `allowance` | everyone | Standard token behavior |
| `burn`, `burnFrom` | token holder / approved spender | Destroys tokens, lowers total supply |
| `mint(to, amount)` | owner only | Creates tokens, never above the 42,000,000 cap |
| `pause()` / `unpause()` | owner only | Stops / resumes all transfers |
| `transferOwnership(newOwner)` | owner only | Gives the owner role to someone else (e.g. the multisig) |

Multisig functions: `submitTransaction`, `confirmTransaction`, `revokeConfirmation`, `executeTransaction`.
More detail in `documentation/`.

## 7. Security model

- Contract code is based on OpenZeppelin (audited) instead of custom token logic.
- Privileged functions (`mint`, `pause`, `unpause`) are owner-only.
- With the bonus, the owner is the multisig: stealing **one** key is not enough to mint or pause.
- The cap makes unlimited inflation impossible.
- Private keys live only in `.env` (ignored by git) and belong to test wallets.
- Known limits: if 2 of 3 signer keys are lost, the owner powers are locked forever; if 2 are stolen, an attacker can act. Written in `documentation/security.md`.

## 8. Important points to master for the defense

1. **Explain every choice** in section 3 in your own words. This is graded.
2. **Be ready for the code review.** You must be able to explain each line of both contracts.
3. **Know the difference** between the token contract (balances and rules) and the multisig contract (a wallet that needs several approvals).
4. **Know who can do what.** Who is the owner now? What happens if the owner key is stolen? (Answer: before the bonus, everything the owner can do; after the bonus, an attacker needs 2 keys.)
5. **Why a cap?** Why can burn be public but not mint?
6. **What is verification** and why does it matter? (Trust: everyone can read the source.)
7. **Show the demo** with the fewest actions and explain each transaction on BscScan.
8. **Be able to rebuild or redeploy** from scratch following only this README.
9. **No secrets in git.** Run `git log -p | grep -i private` before submitting.
10. **The bonus only counts if the mandatory part is perfect.** Validate the mandatory part first.
11. The demo video is optional and gives no extra grade.

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `insufficient funds for gas` | Get more tBNB from the faucet for that wallet. |
| `could not detect network` | The RPC URL is wrong or down. Take another testnet RPC from the official BNB docs. |
| `invalid opcode` on deploy | Set `evmVersion` in `hardhat.config.js` to `paris` (or `shanghai`) and redeploy. |
| Verification fails | Wait 1 minute after deploy, check the API key, check that constructor arguments match. |
| `nonce too low` / stuck transaction | Reset the account's activity in MetaMask or wait, then retry. |
| Import errors from OpenZeppelin | Run `npm install` inside `deployment/`, not at the root. |

## 10. Resources

- BNB Chain docs: https://docs.bnbchain.org
- BscScan testnet: https://testnet.bscscan.com
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts
- Hardhat: https://hardhat.org/docs
- BEP-20 standard: https://github.com/bnb-chain/BEPs/blob/master/BEPs/BEP20.md
