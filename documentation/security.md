# Security Model

## Privileges

The token owner alone can mint, pause, unpause, transfer ownership, or renounce ownership. Minting is limited by the immutable 42,000,000 TK42 cap. Holders can burn only their own tokens; `burnFrom` requires allowance. Pausing blocks all token balance updates, including minting and burning.

At the mandatory deployment stage, owner is the deployer EOA. After the bonus step, ownership is transferred to the multisig, which requires 2 of 3 owner approvals to perform token owner actions. An EOA calling `mint` directly after that transfer should revert.

## Key handling

The three test-only private keys and the explorer API key are stored in the local `deployment/.env` file, which is ignored by Git. Never commit or share that file, private keys, or recovery phrases. The test wallets should not hold real funds. For this project, the three accounts were created from one MetaMask recovery phrase; that phrase can restore all three accounts, so it is a single point of compromise. The multisig demonstrates a 2-of-3 transaction rule, but these keys are not independent if that shared phrase is exposed.

## Threats and safeguards

| Risk | Safeguard or limitation |
|---|---|
| Owner key is stolen before multisig transfer | The attacker can mint up to the remaining cap or pause the token. Move ownership to the multisig after the mandatory phase. |
| Two signer keys or the shared recovery phrase are stolen | An attacker can meet the 2-of-3 threshold. Keep the phrase private and use test-only accounts. |
| Signers lose access | If fewer than two owners can act, owner functions are locked. The multisig has no owner-replacement feature. |
| Owner renounces token ownership | Owner-only actions become permanently unavailable. The current owner must not renounce during the demo. |
| Token is paused | Transfers, minting, and burning revert until the owner calls `unpause`. |
| RPC, faucet, or testnet is unavailable | Testnet services can be rate-limited or changed; retry with an official endpoint or faucet. |
| Testnet state is lost or reset | Test networks are for practice and do not offer production-grade persistence guarantees. |

## Design limits

The contracts are educational examples, not audited production software. The token has no upgrade path, emergency withdrawal function, blacklist, or fee logic. The multisig intentionally has a small feature set and no method to change owners or threshold after deployment. A failed inner transaction reverts the multisig execution transaction and remains available for a later retry after the cause is fixed.

## Verification and testing

The token and multisig sources are verified on BscScan Testnet: [Tokenizer42](https://testnet.bscscan.com/address/0x1be8A0534a8A0222Cd72d446Ef21E05C5c917cC7#code) and [MultiSigWallet](https://testnet.bscscan.com/address/0xb2777f0C477976DbcAF845c4C5AddC6065b21CaF#code). The complete local suite has 22 passing tests. Coverage is 100% for statements, functions, and lines, and 97.92% for branches.
