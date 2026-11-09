# Tokenizer 42 (TK42): my own token on BNB Smart Chain Testnet

42 School project **Tokenizer – Build your own token** (Web3, partnership with BNB Chain).

- **Mandatory part:** a BEP-20 token (`Tokenizer 42`, ticker `TK42`) deployed and verified on a public test chain.
- **Bonus part:** a multisignature wallet (2 of 3 signatures) that owns the token and controls its sensitive actions.

> Everything runs on a **test** network. No real money is used or needed.

---

## 1. What is in this repository

| Folder / file | Content |
|---|---|
| `README.md` | This file: my choices (platform, language, design) and the reasons behind them, plus how to run everything. |
| `code/` | The smart contracts (`Tokenizer42.sol`, `MultiSigWallet.sol`) and their automated tests. |
| `deployment/` | Everything needed to deploy: Hardhat config, deploy/verify/demo scripts, `.env.example`, and the saved deployed addresses. |
| `documentation/` | Full documentation: how the token works, which actions are possible, what is needed to use it, and how to deploy it. |

## 2. Deployed information

| Item | Value |
|---|---|
| Network | BNB Smart Chain Testnet (chain id 97) |
| Token name / ticker | Tokenizer 42 / **TK42** |
| Token contract address | `0x1be8A0534a8A0222Cd72d446Ef21E05C5c917cC7` |
| Token on explorer | https://testnet.bscscan.com/address/0x1be8A0534a8A0222Cd72d446Ef21E05C5c917cC7 |
| Multisig contract address (bonus) | `0xb2777f0C477976DbcAF845c4C5AddC6065b21CaF` |
| Multisig on explorer | https://testnet.bscscan.com/address/0xb2777f0C477976DbcAF845c4C5AddC6065b21CaF |
| Token owner | MultiSigWallet (2 of 3 owners required) |
| Tests / coverage | 22 passing; 100% statements, functions and lines; 97.92% branches |

---

## 3. Choice of blockchain platform and why

A token can be created on many platforms. I compared the main ones before choosing.

| Platform | Token standard | Language | Advantages | Drawbacks | Verdict |
|---|---|---|---|---|---|
| **Ethereum** | ERC-20 | Solidity | The reference. Biggest ecosystem, most documentation and tools, strongest decentralization. | Transaction fees on the main network are high. Testnet coins can be harder to get. | Great, but expensive in real life and less practical for a school exercise. |
| **BNB Smart Chain (BSC)** | BEP-20 (same interface as ERC-20) | Solidity | Compatible with Ethereum tools. Low fees and fast blocks. Free test coins from an official faucet. BscScan explorer. Partner of this project. | Fewer validators than Ethereum, so it is less decentralized. | **My choice.** |
| **Polygon** | ERC-20 | Solidity | Compatible with Ethereum tools. Low fees. | Not the platform of the partnership. Adds nothing for this exercise compared to BSC. | Good alternative. |
| **Solana** | SPL token | Rust | Very fast and very cheap. | Completely different model (a token is an account of a shared program, not a contract I write), different language and tools. Much steeper learning curve. | Interesting, but too far from the subject's hints. |

**Why BNB Smart Chain Testnet:**
1. The subject comes from the 42 × BNB Chain partnership, and BEP-20 is explicitly named in the subject.
2. It uses the same tools and code as Ethereum (EVM), so what I learn works on many other chains.
3. Test coins are free (faucet), so I never need real money.
4. The BscScan testnet explorer lets me publish and verify the contract publicly, as the subject asks.
5. Low fees and fast confirmations make testing and demos quick.

## 4. Choice of language and tools and why

**Language: Solidity (version ^0.8.24)**

| Option | Why I did not choose it |
|---|---|
| Vyper (EVM too) | Simpler and more restricted, but far fewer libraries, examples and tools. |
| Rust (Solana, others) | Only for non-EVM chains. Not usable on BNB Smart Chain. |
| **Solidity** | **Chosen.** It is the standard language of BNB Smart Chain and Ethereum, with the most documentation and the audited OpenZeppelin library. The BEP-20 standard is written for it. |

**Tools**

| Tool | Choice and reason |
|---|---|
| **Hardhat** (chosen) | JavaScript scripts for deploy and demo, built-in local test chain, easy tests, plugin to verify on BscScan. |
| Remix | Good for learning in a browser, but hard to automate and to keep as code in a repository. |
| Truffle | No longer maintained. |
| Foundry | Excellent and fast, but tests and scripts use Solidity; Hardhat's JavaScript was simpler for me. |
| **OpenZeppelin Contracts v5** (chosen) | Audited building blocks for ERC-20, burn, cap, pause and ownership. Safer than writing security-critical code myself. |
| **ethers v6** | Library used by the scripts to talk to the blockchain. |

## 5. Design choices of the token and why

| Choice | Why |
|---|---|
| Name `Tokenizer 42`, ticker `TK42` | The name must contain 42. Short and clear. |
| 18 decimals | Standard on BSC and Ethereum. Wallets display the token correctly. |
| Cap 42,000,000, initial supply 4,200,000 | A fixed ceiling makes the token trustworthy: nobody can inflate it forever. |
| Owner-only `mint`, `pause`, `unpause` | Real privileges must exist but be limited and documented. |
| Public `burn` | Any holder can destroy their own tokens. Harmless and useful. |
| No fees, no blacklist, no upgradeability | Simpler to explain and safer. Less hidden power. |
| Custom small multisig (2 of 3) | Easy to read and defend in a code review. Protects the owner powers against one stolen key. |
| Bonus done as a second step | The mandatory token stays valid by itself. The bonus then moves ownership to the multisig. |

## 6. Concepts to understand

| Word | Simple meaning |
|---|---|
| **Blockchain** | A shared notebook that thousands of computers keep identical. Nobody can secretly edit it. |
| **Smart contract** | A small program stored on the blockchain. Once published it cannot be changed, and everybody can read it. |
| **Token** | A line in a contract's notebook: "address A owns 100 TK42, address B owns 5 TK42". |
| **BEP-20 / ERC-20** | A standard list of functions every token must have (`transfer`, `approve`, `balanceOf`...). Wallets and explorers rely on it. |
| **Testnet / tBNB / gas** | A practice blockchain, its free coins, and the fee to run a transaction. |
| **Wallet / private key** | The wallet is your account. The private key is its password: never share it, never commit it. |
| **Deploy / verify** | Publish the contract (it gets a permanent address) / upload its source on BscScan so everyone can check it. |
| **Decimals** | Tokens are integers: 1 TK42 = 10^18 smallest units. |
| **Cap, mint, burn** | Maximum supply / create tokens (owner only) / destroy tokens. |
| **Owner, pause** | The only address allowed privileged actions / an emergency switch that stops transfers. |
| **Multisig** | A wallet that needs several people to approve before acting (here 2 of 3). |

## 7. How to run it, step by step

### Prerequisites
- Node.js 20 LTS or newer (`node -v`), Git, and a browser wallet such as MetaMask.

### Step 1: Get the code and install
```bash
git clone <your-repo-url>
cd <your-repo>/deployment
npm install
```

### Step 2: Create 3 test wallets
In MetaMask create 3 **new** accounts used only for this project (never a wallet with real money). Export each private key (Account details, Show private key). Wallet 1 deploys the token; wallets 2 and 3 are the other multisig signers.

### Step 3: Get free tBNB
Use the official BNB Chain testnet faucet (search "BNB Chain testnet faucet" on bnbchain.org). Request tBNB for wallet 1, and a little for wallets 2 and 3. Check that the wallet is on the **BNB Smart Chain Testnet** (chain id 97); if the network is missing in MetaMask, add it from the official BNB docs.

### Step 4: Get a BscScan / Etherscan API key
Create a free account on etherscan.io and generate an API key (it is used for BscScan verification).

### Step 5: Configure the environment
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

### Step 6: Compile and test
```bash
npm run compile
npm test
npm run coverage      # optional: shows how much code is tested
```

### Step 7: (optional) Try everything on a local fake chain
Terminal 1: `npm run node`
Terminal 2: `npm run deploy:local`, then `npm run demo:local`

### Step 8: Deploy the token on BSC Testnet
```bash
npm run deploy:testnet
```
The address is printed and saved in `deployment/deployments/bscTestnet.json`. Put it in the table in section 2.

### Step 9: Verify on BscScan
```bash
npm run verify:testnet
```
Open `https://testnet.bscscan.com/address/<token address>` and check the "Contract" tab with the source code. The ticker `TK42` and the name appear on the token page.

### Step 10: Add the token to MetaMask
Import tokens, paste the token address, symbol `TK42`, 18 decimals. Wallet 1 shows 4,200,000 TK42.

### Step 11: Run the demo (minimal actions)
```bash
npm run demo:testnet
```
It prints name, symbol, decimals, supply, cap and owner, sends a small amount from wallet 1 to wallet 2, burns a tiny amount, and shows BscScan links for each transaction.

### Step 12: Bonus, deploy the multisig and give it ownership
```bash
npm run multisig:deploy:testnet
npm run multisig:verify:testnet
```
This deploys the multisig with wallets 1, 2 and 3 as signers (2 required) and transfers the token ownership to it.

### Step 13: Bonus, demo the multisig
```bash
npm run multisig:demo:testnet
```
Wallet 1 proposes to mint tokens, executing fails (only 1 of 2 approvals), wallet 2 approves, execution succeeds and the supply increases. A direct `mint` from wallet 1 now fails, because wallet 1 is no longer the owner.

## 8. What the token can do

| Function | Who | Effect |
|---|---|---|
| `transfer`, `approve`, `transferFrom`, `balanceOf`, `allowance` | everyone | Standard token behavior |
| `burn`, `burnFrom` | token holder / approved spender | Destroys tokens, lowers total supply |
| `mint(to, amount)` | owner only | Creates tokens, never above the 42,000,000 cap |
| `pause()` / `unpause()` | owner only | Stops / resumes all transfers |
| `transferOwnership(newOwner)` | owner only | Gives the owner role to someone else (e.g. the multisig) |

Multisig functions: `submitTransaction`, `confirmTransaction`, `revokeConfirmation`, `executeTransaction`. More detail in `documentation/`.

## 9. Security model

- Contract code is based on OpenZeppelin (audited) instead of custom token logic.
- Privileged functions (`mint`, `pause`, `unpause`) are owner-only.
- With the bonus, the owner is the multisig: stealing **one** key is not enough to mint or pause.
- The cap makes unlimited inflation impossible.
- Private keys live only in `.env` (ignored by git) and belong to test wallets.
- Known limits: if 2 of 3 signer keys are lost, the owner powers are locked forever; if 2 are stolen, an attacker can act. Written in `documentation/security.md`.

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| `insufficient funds for gas` | Get more tBNB from the faucet for that wallet. |
| `could not detect network` | The RPC URL is wrong or down. Take another testnet RPC from the official BNB docs. |
| `invalid opcode` on deploy | Set `evmVersion` in `hardhat.config.js` to `paris` (or `shanghai`) and redeploy. |
| Verification fails | Wait 1 minute after deploy, check the API key and that constructor arguments match. |
| `nonce too low` / stuck transaction | Reset the account's activity in MetaMask or wait, then retry. |
| Import errors from OpenZeppelin | Run `npm install` inside `deployment/`, not at the root. |

## 11. Resources

- BNB Chain docs: https://docs.bnbchain.org
- BscScan testnet: https://testnet.bscscan.com
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts
- Hardhat: https://hardhat.org/docs
- BEP-20 standard: https://github.com/bnb-chain/BEPs/blob/master/BEPs/BEP20.md