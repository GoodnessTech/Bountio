# BOUNTIO ARCHITECTURAL DESIGN

## 1. Design Philosophy: Compressed Protocol

Bountio adheres to the compressed protocol principle:
- Minimal on-chain surface area
- Off-chain execution with deterministic proof generation
- AI adjudication layer over verifiable evidence
- On-chain economic settlement using native BOT
- Zero custom tokens or unnecessary contract dependencies

## 2. Protocol Components

```
┌────────────────────────────────────────────────────────┐
│                   BOUNTIO FRONTEND                     │
│  (React / Vite / ethers v6 / BOT Chain Mainnet 677)    │
└───────────────▲────────────────────────▲───────────────┘
                │                        │
       Off-Chain│Gameplay        On-Chain│Staking & Claims
                │                        │
┌───────────────▼──────────────┐ ┌───────▼───────────────┐
│     AI ADJUDICATION SERVICE  │ │     BOUNTIO CONTRACT  │
│  - Anti-cheat validation     │ │  (BOT Chain Mainnet)  │
│  - Score evaluation          │ │  - Mission state      │
│  - EIP-712 Signature Issue   │ │  - Sig verification   │
└───────────────┬──────────────┘ │  - Native BOT custody │
                │                │  - Claim settlement   │
                └────────────────┴───────────────────────┘
```

### Smart Contract (`contracts/Bountio.sol`)
1. **Mission Registry:** Stores packed structs representing active competitions (`entryFee`, `rewardPool`, `capacity`, `rulesHash`).
2. **Staking Escrow:** Custodies native BOT stakes from entered players.
3. **Outcome Settlement:** Verifies cryptographic EIP-712 signatures from the authorized adjudicator, tracks nonces, and transfers rewards.

### AI Adjudication Service (`server/index.mjs`)
1. **Deterministic Verification:** Validates that submitted moves obey mission constraints (e.g. avoiding restricted sectors 5 & 10, maintaining resources).
2. **AI Evaluation:** Computes the tactical efficiency score.
3. **EIP-712 Signer:** Issues typed cryptographic signatures conforming to `AdjudicationResult`.

### Client Frontend (`Bountio Frontend`)
1. Connects to browser EVM wallets (MetaMask, Rabby, OKX) on BOT Chain Mainnet (Chain 677).
2. Directly reads contract state for missions and player records.
3. Provides interactive Arena gameplay and proof submission.

## 3. Storage Optimization & Packing

```solidity
struct Mission {
    uint96 entryFee;        // 12 bytes
    uint96 rewardPool;      // 12 bytes
    uint32 maxPlayers;      // 4 bytes
    uint32 currentPlayers;  // 4 bytes  --> Total: 32 bytes (Slot 1)
    
    uint64 startTime;       // 8 bytes
    uint64 endTime;         // 8 bytes
    uint8 status;           // 1 byte
    bool exists;            // 1 byte   --> Total: 18 bytes (Slot 2)
    
    bytes32 rulesHash;      // 32 bytes --> Total: 32 bytes (Slot 3)
}
```

## 4. EIP-712 Schema

```javascript
Domain: {
  name: 'Bountio',
  version: '1',
  chainId: 677,
  verifyingContract: '0x53a6922a6f604c9bd6f558e17a27c0e5194d215e'
}

Type: AdjudicationResult(
  uint256 missionId,
  address player,
  uint64 score,
  bytes32 proofHash,
  uint96 rewardAmount,
  uint256 nonce
)
```
