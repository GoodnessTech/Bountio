import { ethers } from 'ethers';

// ABI definition
const abi = [
  {
    "inputs": [{ "internalType": "uint256", "name": "missionId", "type": "uint256" }],
    "name": "getMission",
    "outputs": [
      {
        "components": [
          { "internalType": "bool", "name": "exists", "type": "bool" },
          { "internalType": "uint96", "name": "entryFee", "type": "uint96" },
          { "internalType": "uint96", "name": "rewardPool", "type": "uint96" },
          { "internalType": "uint32", "name": "maxPlayers", "type": "uint32" },
          { "internalType": "uint32", "name": "currentPlayers", "type": "uint32" },
          { "internalType": "uint32", "name": "startTime", "type": "uint32" },
          { "internalType": "uint32", "name": "endTime", "type": "uint32" },
          { "internalType": "uint8", "name": "status", "type": "uint8" },
          { "internalType": "bytes32", "name": "rulesHash", "type": "bytes32" }
        ],
        "internalType": "struct Bountio.Mission",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "missionId", "type": "uint256" },
      { "internalType": "address", "name": "player", "type": "address" }
    ],
    "name": "getPlayerStatus",
    "outputs": [
      { "internalType": "bool", "name": "entered", "type": "bool" },
      { "internalType": "bytes32", "name": "proof", "type": "bytes32" },
      { "internalType": "bool", "name": "verified", "type": "bool" },
      { "internalType": "bool", "name": "claimed", "type": "bool" },
      { "internalType": "uint64", "name": "score", "type": "uint64" },
      { "internalType": "uint96", "name": "rewardAmount", "type": "uint96" },
      { "internalType": "uint256", "name": "currentNonce", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "missionId", "type": "uint256" }],
    "name": "enterMission",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "missionId", "type": "uint256" },
      { "internalType": "uint64", "name": "score", "type": "uint64" },
      { "internalType": "uint96", "name": "rewardAmount", "type": "uint96" },
      { "internalType": "uint256", "name": "nonce", "type": "uint256" },
      { "internalType": "bytes", "name": "signature", "type": "bytes" }
    ],
    "name": "settleAndClaim",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export { abi };
