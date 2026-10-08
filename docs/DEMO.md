# BOUNTIO LIVE DEMONSTRATION WALKTHROUGH

This guide walks through demonstrating the complete mission lifecycle on **BOT Chain Mainnet**.

```
CONNECT WALLET ──► VIEW LIVE MISSION ──► ENTER MISSION ──► STAKE BOT
        │
        ▼
   PLAY ARENA ──► SUBMIT PROOF ──► AI ADJUDICATE ──► "AI VERIFIED"
        │
        ▼
"ON-CHAIN REWARD UNLOCKED" ──► CLAIM BOT ──► BOTSCAN CONFIRMATION
```

---

## 1. Prerequisites
- Browser wallet installed (MetaMask, Rabby, or OKX)
- Network: **BOT Chain Mainnet**
  - **Chain ID:** `677`
  - **RPC:** `https://rpc.botchain.ai`
  - **Currency Symbol:** `BOT`
  - **Explorer:** `https://scan.botchain.ai`
- Frontend running on `http://localhost:5173`
- Backend AI Adjudication Service running on `http://localhost:3001`

---

## 2. Interactive Walkthrough

### Step 1: Connect Wallet
1. Open `http://localhost:5173/`.
2. Click **Connect wallet** in the navigation bar.
3. The app requests a network switch to Chain ID `677` (BOT Chain Mainnet).
4. Upon approval, your wallet address (e.g., `0x34a1...f02e`) and live native BOT balance appear in the navigation bar.

### Step 2: View Live Mainnet Mission
1. On the home page or **Missions** page, inspect **MISSION 01: Strategy Grid**.
2. All figures reflect on-chain parameters directly from the deployed contract:
   - **Entry Stake:** `0.005 BOT`
   - **Prize Pool:** `0.02 BOT`
   - **Status:** `OPEN`
   - **Contract:** `0x53a6922a6f604c9bd6f558e17a27c0e5194d215e`

### Step 3: Enter Mission & Native Staking
1. Click **Enter mission**.
2. The modal confirms the `0.005 BOT` entry stake and network details.
3. Click **Stake native BOT & enter**.
4. Sign the transaction in your browser wallet.
5. The transaction broadcasts directly to BOT Chain Mainnet. Once confirmed:
   - Your wallet transitions to **STAKED & ACTIVE**.
   - You are automatically routed to the **Arena**.

### Step 4: Compete in the Tactical Arena
1. The **Tactical Grid** displays a 4x4 interactive matrix.
2. Form your strategic path by clicking active nodes (e.g. nodes 0, 4, 8).
3. Restricted sectors (nodes 5 and 10) are guarded by anti-cheat rules.
4. Keep the resource gauge above 50.

### Step 5: Submit Cryptographic Proof
1. Click **Submit proof for AI verify**.
2. The frontend packages the deterministic run payload and computes the `proofHash`.
3. The proof is dispatched to the AI Adjudication Service (`/api/adjudicate`).

### Step 6: Watch Live AI Adjudication
1. The **Verification Modal** displays live step-by-step progress:
   - `01  Proof received & committed`
   - `02  Tactical sequence reconstructed`
   - `03  AI adjudication evaluating rules`
   - `04  Issuing EIP-712 cryptographic signature`
2. **The Unforgettable Moment:**
   ```
   ┌────────────────────────────────────────┐
   │              ✓ VERIFIED                │
   │            AI ADJUDICATED              │
   │                                        │
   │      VERIFIED REWARD: 0.008 BOT        │
   │    EIP-712 SIGNATURE ISSUED & VALID    │
   └────────────────────────────────────────┘
   ```

### Step 7: Claim Reward on BOT Chain
1. Click **Claim reward on BOT Chain**.
2. Your browser wallet prompts the on-chain settlement transaction (`settleAndClaim`).
3. The contract cryptographically verifies the adjudicator signature on-chain and transfers native BOT directly to your wallet.
4. The modal transforms to:
   ```
   ┌────────────────────────────────────────┐
   │        ON-CHAIN REWARD UNLOCKED        │
   │                                        │
   │   REWARD SETTLED: 0.008 BOT            │
   │   TRANSFERRED TO WALLET                │
   │                                        │
   │   Confirmed Tx: View on BOTScan        │
   └────────────────────────────────────────┘
   ```
5. Click **View on BOTScan** to verify the transaction receipt and balance transfer on `https://scan.botchain.ai`.

---

## 3. Footer Ecosystem Verification
At any point, scroll to the footer and click:
- **BOT Chain Official** -> Navigates to `https://botchain.ai`
- **BOTScan Explorer** -> Navigates to `https://scan.botchain.ai`
- **Smart Contract** -> Opens the verified Bountio contract on BOTScan
