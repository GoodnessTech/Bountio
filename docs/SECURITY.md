# BOUNTIO SECURITY MODEL & AUDIT REVIEW

## 1. Threat Model & Mitigations

### 1.1 Anti-Cheat: Fake or Malicious Game Submissions
- **Risk:** Player submits fabricated moves, teleports across restricted sectors, or claims impossible scores.
- **Mitigation:** The AI Adjudication service reconstructs every single move sequence deterministically against the mission rules. If a move intersects restricted sectors (nodes 5 or 10) or resource drops below threshold, the submission is rejected. The smart contract refuses to settle without an authentic signature from the authorized adjudicator.

### 1.2 Replay Attacks & Signature Recycling
- **Risk:** Player captures a valid adjudication signature and submits it multiple times or on other missions.
- **Mitigation:**
  - EIP-712 domain binds `chainId: 677` and `verifyingContract: 0x53a6922a6f604c9bd6f558e17a27c0e5194d215e`.
  - Signatures include `missionId`, `player`, `proofHash`, `score`, `rewardAmount`, and `nonce`.
  - Smart contract maintains `usedProofHashes[proofHash]` and `playerNonces[player]`.
  - Once verified, the proof hash is marked permanently used and the player's nonce increments.

### 1.3 Double-Entry and Double-Claiming
- **Risk:** Player enters a mission twice with one account, or claims rewards multiple times.
- **Mitigation:**
  - `hasEntered[missionId][player]` prevents entering more than once.
  - `VerifiedOutcome.claimed` boolean flag is marked `true` prior to native BOT transfer.
  - Checks-Effects-Interactions pattern strictly adhered to.

### 1.4 Reentrancy Protection
- **Risk:** External native transfer to malicious contracts triggers fallback reentry.
- **Mitigation:** Custom reentrancy lock `_locked` guards all value-bearing functions (`enterMission`, `claimReward`, `settleAndClaim`). State changes are committed before `call{value: reward}("")`.

### 1.5 Compromise or Rotation of Adjudicator Key
- **Risk:** Adjudicator key compromised or requires rotation to an automated enclave.
- **Mitigation:**
  - The smart contract includes `setAdjudicator(address newAdjudicator)` callable exclusively by the contract owner.
  - Adjudicator has zero fund withdrawal privileges; it can only attest to outcome validity within the bounds of a mission's funded reward pool.

### 1.6 Emergency Circuit Breaker
- **Risk:** Unexpected market conditions or exploit attempts.
- **Mitigation:** `setPaused(bool isPaused)` allows pausing mission entry and claims while safeguarding existing pool balances.
