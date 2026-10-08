# BOUNTIO

> **Verifiable On-Chain Competitive Missions Protocol on BOT Chain Mainnet**

Bountio is an on-chain competitive protocol where players stake native BOT to compete in tactical, strategy, and optimization challenges. Gameplay executes off-chain, cryptographic commitments are recorded, an authorized AI adjudication service deterministically verifies game rules and scores, and settlement is guaranteed by smart contracts on **BOT Chain Mainnet**.

No custom tokens. Native BOT only. Code decides economic settlement.

---

## BOT Chain Mainnet Deployment

- **Network:** BOT Chain Mainnet
- **Chain ID:** `677` (`0x2a5`)
- **RPC:** `https://rpc.botchain.ai`
- **Block Explorer:** [https://scan.botchain.ai](https://scan.botchain.ai)
- **Official Site:** [https://botchain.ai](https://botchain.ai)
- **Bountio Mainnet Contract:** [`0x53a6922a6f604c9bd6f558e17a27c0e5194d215e`](https://scan.botchain.ai/address/0x53a6922a6f604c9bd6f558e17a27c0e5194d215e)
- **Deployment Transaction:** [`0xe8b9104046a9adc9a249349d185a9d650865353ece146bd856dd91a810a70eae`](https://scan.botchain.ai/tx/0xe8b9104046a9adc9a249349d185a9d650865353ece146bd856dd91a810a70eae)
- **Deployment Block:** `25978749`
- **Initial Mission 1 Tx:** [`0xde967e8ee65ef6507f7fb6d6a1d00483c4cfbd366ee32f32340af445a9d2f08b`](https://scan.botchain.ai/tx/0xde967e8ee65ef6507f7fb6d6a1d00483c4cfbd366ee32f32340af445a9d2f08b)

---

## Core Mission Loop

```
ENTER  ──►  STAKE  ──►  PERFORM  ──►  SUBMIT  ──►  AI VERIFY  ──►  REWARD
```

1. **Enter & Stake:** Player selects an active mission (e.g. Mission 01: *Strategy Grid*) and stakes native BOT directly to the smart contract (`enterMission`).
2. **Perform:** Player competes off-chain in the Bountio Tactical Arena, solving tactical pathing challenges under constrained resource rules.
3. **Submit:** Outcome generates a cryptographic commitment (`proofHash`) containing the run identifier, move sequence, resource consumption, and score.
4. **AI Adjudicate:** Authorized AI Adjudication service evaluates the submitted proof against mission anti-cheat rules (no restricted sector crossing, resource >= 50). If valid, it computes the verified score and signs an EIP-712 structured data payload using the adjudicator key.
5. **Reward Settlement:** Player calls `settleAndClaim` (or `claimReward`) on BOT Chain Mainnet. The smart contract validates the cryptographic signature, marks the proof as consumed, and releases native BOT directly into the player's wallet.

---

## Repository Structure

```
├── contracts/
│   └── Bountio.sol            # Core protocol contract (packed structs, EIP-712, claim-based)
├── artifacts/
│   └── Bountio.json           # Compiled contract ABI & bytecode
├── script/
│   ├── compile.mjs            # Solc 0.8.x compiler with optimizer (200 runs, paris target)
│   ├── estimate_deployment.mjs# Pre-deployment gas & safety checker
│   └── deploy.mjs             # Mainnet broadcaster & live mission initializer
├── server/
│   └── index.mjs              # AI Adjudication backend service with EIP-712 signing
├── test/
│   ├── Bountio.t.sol          # Foundry-compatible test file
│   ├── bountio.test.mjs       # Comprehensive unit, security, and lifecycle test suite
│   └── e2e_mainnet_simulation.mjs # Live end-to-end integration test
├── Bountio Frontend/          # React + Vite + Tailwind frontend wired to BOT Chain Mainnet
├── docs/
│   ├── ARCHITECTURE.md        # Technical architectural design
│   ├── SECURITY.md            # Threat model, replay protection, and security review
│   ├── MAINNET-DEPLOYMENT.md  # Official deployment record
│   └── DEMO.md                # Interactive demonstration guide
└── deployment.json            # Machine-readable deployment metadata
```

---

## Running Locally

### 1. Prerequisites
- Node.js v18+ (tested on v24.15)
- npm

### 2. Install Dependencies
```bash
# In repository root
npm install

# In frontend directory
cd "Bountio Frontend"
npm install
cd ..
```

### 3. Run Test Suite
```bash
npm run test
# Executes 35 passing tests covering deployment, entry, proof, EIP-712 sigs, double-entry, double-claim, and pauses.
```

### 4. Start AI Adjudication Service
```bash
npm run server
# Starts backend service on http://localhost:3001
```

### 5. Start Frontend
```bash
cd "Bountio Frontend"
npm run dev
# Starts Vite application on http://localhost:5173
```

---

## Gas Optimization Design

- **Packed Structs:** Slot layout packs `entryFee`, `rewardPool`, `maxPlayers`, and `currentPlayers` into a single 32-byte slot.
- **Custom Errors:** Zero revert strings; all failure conditions use custom error opcodes (`Unauthorized()`, `IncorrectEntryFee()`, etc.).
- **Claim-Based Settlement:** No iteration over winner arrays; settlement is O(1) pull-based (`claimReward` / `settleAndClaim`).
- **EIP-712 Signatures:** Off-chain AI verification with on-chain cryptographic commitment verification using `ecrecover`.
- **Atomic Operations:** Single-transaction `settleAndClaim` enables one-click verification and reward release.
