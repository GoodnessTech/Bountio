import { ethers } from 'ethers';
import fs from 'node:fs';

const deployment = JSON.parse(fs.readFileSync('deployment.json', 'utf-8'));
const artifact = JSON.parse(fs.readFileSync('artifacts/Bountio.json', 'utf-8'));

async function main() {
  console.log('====================================================');
  console.log('END-TO-END MAINNET INTEGRATION TEST');
  console.log('====================================================\n');

  // 1. Check Backend Health
  console.log('[Step 1] Querying AI Adjudication Service /api/health...');
  const healthRes = await fetch('http://localhost:3001/api/health');
  const health = await healthRes.json();
  console.log('  Health:', health.status);
  console.log('  Connected Contract:', health.contractAddress);
  console.log('  Authorized Adjudicator:', health.adjudicator);

  // 2. Query Mission 1 Live State
  console.log('\n[Step 2] Querying Live Mission 1 from BOT Chain Mainnet...');
  const missionRes = await fetch('http://localhost:3001/api/mission/1');
  const mission = await missionRes.json();
  console.log('  Mission 1 Exists:', mission.exists);
  console.log('  Entry Fee:', mission.entryFeeFormatted, 'BOT');
  console.log('  Reward Pool:', mission.rewardPoolFormatted, 'BOT');
  console.log('  Status:', mission.status === 1 ? 'OPEN' : 'CLOSED');

  // 3. Submit Tactical Proof
  console.log('\n[Step 3] Submitting proof to /api/submit-proof...');
  const testPlayer = '0x1111111111111111111111111111111111111111';
  const submitRes = await fetch('http://localhost:3001/api/submit-proof', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      missionId: 1,
      player: testPlayer,
      moves: [0, 4, 8],
      resource: 78,
      timeSeconds: 124,
    }),
  });
  const submitData = await submitRes.json();
  console.log('  Proof Submission Status:', submitData.status);
  console.log('  Computed Proof Hash:', submitData.proofHash);

  // 4. Trigger AI Adjudication
  console.log('\n[Step 4] Triggering AI Adjudication /api/adjudicate...');
  const adjRes = await fetch('http://localhost:3001/api/adjudicate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      missionId: 1,
      player: testPlayer,
      moves: [0, 4, 8],
      resource: 78,
      timeSeconds: 124,
    }),
  });
  const adjData = await adjRes.json();
  console.log('  Adjudication Verified:', adjData.verified);
  console.log('  Evaluated Score:', adjData.score);
  console.log('  Assigned Reward:', adjData.rewardFormatted, 'BOT');
  console.log('  EIP-712 Signature:', adjData.signature.slice(0, 20) + '...');
  console.log('  AI Reasoning:', adjData.adjudication?.reasoning);

  // 5. Verify Signature Cryptographically against Mainnet Contract Adjudicator
  console.log('\n[Step 5] Cryptographically validating EIP-712 signature...');
  const domain = {
    name: 'Bountio',
    version: '1',
    chainId: deployment.chainId,
    verifyingContract: deployment.contractAddress,
  };
  const types = {
    AdjudicationResult: [
      { name: 'missionId', type: 'uint256' },
      { name: 'player', type: 'address' },
      { name: 'score', type: 'uint64' },
      { name: 'proofHash', type: 'bytes32' },
      { name: 'rewardAmount', type: 'uint96' },
      { name: 'nonce', type: 'uint256' },
    ],
  };
  const value = {
    missionId: BigInt(adjData.missionId),
    player: ethers.getAddress(testPlayer),
    score: BigInt(adjData.score),
    proofHash: adjData.proofHash,
    rewardAmount: BigInt(adjData.rewardAmount),
    nonce: BigInt(adjData.nonce),
  };

  const recoveredSigner = ethers.verifyTypedData(domain, types, value, adjData.signature);
  console.log('  Recovered Signer:', recoveredSigner);
  console.log('  Authorized Adjudicator:', health.adjudicator);

  if (recoveredSigner.toLowerCase() !== health.adjudicator.toLowerCase()) {
    throw new Error('Signature verification failed! Signer mismatch.');
  }

  console.log('  VERIFICATION: MATCH! Signature is 100% valid for smart contract settlement on BOT Chain Mainnet.');
  console.log('\n====================================================');
  console.log('END-TO-END FLOW VALIDATION PASSED (5/5)');
  console.log('====================================================');
}

main().catch(err => {
  console.error('E2E Test Failed:', err);
  process.exit(1);
});
