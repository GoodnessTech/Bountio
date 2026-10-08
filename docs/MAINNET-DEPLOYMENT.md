# BOT CHAIN MAINNET DEPLOYMENT EVIDENCE

This document records the official deployment of the Bountio Protocol on BOT Chain Mainnet.

## Network Configuration

- **Network:** BOT Chain Mainnet
- **Chain ID:** `677`
- **Chain ID (hex):** `0x2a5`
- **RPC URL:** `https://rpc.botchain.ai`
- **Currency:** `BOT`
- **Explorer:** `https://scan.botchain.ai`
- **Official Site:** `https://botchain.ai`

## Deployment Details

- **Contract Address:** `0x53a6922a6f604c9bd6f558e17a27c0e5194d215e`
- **Deployment Transaction Hash:** `0xe8b9104046a9adc9a249349d185a9d650865353ece146bd856dd91a810a70eae`
- **Deployment Block:** `25978749`
- **Deployment Date:** `2026-10-08T14:08:24.367Z`
- **Deployer Address:** `0x34a19B30d9edD62424802d323E81c25599A9f02e`
- **Authorized Adjudicator Address:** `0x34a19B30d9edD62424802d323E81c25599A9f02e`

## Gas Consumption & Economics

- **Gas Price:** `20.0 Gwei`
- **Deployment Gas Limit:** `2,257,674`
- **Actual Deployment Gas Used:** `1,865,423`
- **Deployment Cost:** `0.03730846 BOT`
- **Bytecode Size:** `8,557 bytes` (Creation), `8,029 bytes` (Deployed)
- **Compiler Version:** Solidity `0.8.28` (EVM target: `paris`, optimizer: `200` runs)

## Live Missions Initialized

### Mission 01: Strategy Grid
- **Mission ID:** `1`
- **Creation Tx:** `0xde967e8ee65ef6507f7fb6d6a1d00483c4cfbd366ee32f32340af445a9d2f08b`
- **Entry Fee:** `0.005 BOT` (`5000000000000000 wei`)
- **Initial Reward Pool:** `0.02 BOT` (`20000000000000000 wei`)
- **Max Capacity:** `50 players`
- **Status:** `1` (OPEN)
- **Rules Hash:** `0xcc22e827c81d267145b6721158c53698f76517cd4cc263c3f2d00ceb819e394a`

## Verification Status

- **Bytecode Match:** Verified against `artifacts/Bountio.json`.
- **On-chain State:**
  - `owner()` returns `0x34a19B30d9edD62424802d323E81c25599A9f02e`
  - `adjudicator()` returns `0x34a19B30d9edD62424802d323E81c25599A9f02e`
  - `paused()` returns `false`
  - `getMission(1).exists` returns `true`
  - `getMission(1).status` returns `1`
