import { ethers } from 'ethers';
import fs from 'node:fs';
import path from 'node:path';

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING BOUNTIO PROTOCOL SPECIFICATION TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`  FAIL: ${message}`);
      failed++;
      throw new Error(`Assertion failed: ${message}`);
    } else {
      console.log(`  PASS: ${message}`);
      passed++;
    }
  }

  // Connect to local Hardhat JSON-RPC node
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  const network = await provider.getNetwork();
  console.log(`Connected to local test EVM (chainId: ${network.chainId})\n`);

  const signers = await provider.listAccounts();
  const deployer = signers[0];
  const player1 = signers[1];
  const player2 = signers[2];
  const stranger = signers[3];

  const adjudicatorWallet = ethers.Wallet.createRandom().connect(provider);
  const rogueAdjudicatorWallet = ethers.Wallet.createRandom().connect(provider);

  // Fund test wallets
  await deployer.sendTransaction({ to: adjudicatorWallet.address, value: ethers.parseEther('1.0') });

  const artifact = JSON.parse(fs.readFileSync(path.resolve('artifacts/Bountio.json'), 'utf8'));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, deployer);

  console.log('[Phase 1] Deployment & Initial Configuration');
  const bountio = await factory.deploy(adjudicatorWallet.address);
  await bountio.waitForDeployment();
  const bountioAddress = await bountio.getAddress();

  const deployerAddr = await deployer.getAddress();
  assert((await bountio.owner()).toLowerCase() === deployerAddr.toLowerCase(), 'Deployer is contract owner');
  assert((await bountio.adjudicator()).toLowerCase() === adjudicatorWallet.address.toLowerCase(), 'Adjudicator address set correctly');
  assert((await bountio.paused()) === false, 'Contract initially not paused');
  console.log(`  Deployed contract at: ${bountioAddress}\n`);

  console.log('[Phase 2] Mission Creation');
  const missionId = 1n;
  const entryFee = ethers.parseEther('0.01'); // 0.01 BOT
  const initialPool = ethers.parseEther('0.05'); // 0.05 BOT
  const maxPlayers = 50;
  const startTime = BigInt(Math.floor(Date.now() / 1000) - 100);
  const endTime = startTime + 86400n;
  const rulesHash = ethers.keccak256(ethers.toUtf8Bytes('STRATEGY_GRID_V1'));

  const createTx = await bountio.createMission(
    missionId,
    entryFee,
    maxPlayers,
    startTime,
    endTime,
    rulesHash,
    { value: initialPool }
  );
  await createTx.wait();

  const mData = await bountio.getMission(missionId);
  assert(mData.exists === true, 'Mission 1 created and exists');
  assert(mData.entryFee === entryFee, 'Entry fee is 0.01 BOT');
  assert(mData.rewardPool === initialPool, 'Initial reward pool funded with 0.05 BOT');
  assert(Number(mData.status) === 1, 'Mission status is OPEN');

  // Test duplicate mission creation failure
  try {
    await bountio.createMission(missionId, entryFee, maxPlayers, startTime, endTime, rulesHash);
    assert(false, 'Should revert on duplicate mission creation');
  } catch (e) {
    assert(true, 'Reverts on duplicate mission creation (MissionAlreadyExists)');
  }

  // Test non-owner creation failure
  try {
    await bountio.connect(stranger).createMission(2n, entryFee, maxPlayers, startTime, endTime, rulesHash);
    assert(false, 'Should revert if non-owner creates mission');
  } catch (e) {
    assert(true, 'Reverts when non-owner creates mission (Unauthorized)');
  }
  console.log('');

  console.log('[Phase 3] Player Entry & Native Staking');
  // Revert on incorrect fee
  try {
    await bountio.connect(player1).enterMission(missionId, { value: ethers.parseEther('0.005') });
    assert(false, 'Should revert on incorrect entry fee');
  } catch (e) {
    assert(true, 'Reverts on incorrect entry fee (IncorrectEntryFee)');
  }

  // Valid entry
  const enterTx = await bountio.connect(player1).enterMission(missionId, { value: entryFee });
  await enterTx.wait();

  const p1Addr = await player1.getAddress();
  assert(await bountio.hasEntered(missionId, p1Addr) === true, 'Player 1 successfully entered');
  const mAfter = await bountio.getMission(missionId);
  assert(Number(mAfter.currentPlayers) === 1, 'Current players incremented to 1');
  assert(mAfter.rewardPool === initialPool + entryFee, 'Reward pool increased by entry fee');

  // Double entry test
  try {
    await bountio.connect(player1).enterMission(missionId, { value: entryFee });
    assert(false, 'Should revert on double entry');
  } catch (e) {
    assert(true, 'Reverts on double entry (AlreadyEntered)');
  }
  console.log('');

  console.log('[Phase 4] Proof Submission');
  // Non-entered player cannot submit proof
  const dummyProof = ethers.keccak256(ethers.toUtf8Bytes('RUN_001_PLAYER1_PROOF'));
  try {
    await bountio.connect(stranger).submitProof(missionId, dummyProof);
    assert(false, 'Non-entered player should not submit proof');
  } catch (e) {
    assert(true, 'Reverts when non-entered player submits proof (NotEntered)');
  }

  // Player 1 submits proof
  const submitTx = await bountio.connect(player1).submitProof(missionId, dummyProof);
  await submitTx.wait();
  assert(await bountio.submittedProofs(missionId, p1Addr) === dummyProof, 'Proof committed on-chain');
  console.log('');

  console.log('[Phase 5] AI Adjudication & Signature Verification');
  const domain = {
    name: 'Bountio',
    version: '1',
    chainId: network.chainId,
    verifyingContract: bountioAddress,
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

  const score = 9480n;
  const rewardAmount = ethers.parseEther('0.04'); // 0.04 BOT
  const nonce = await bountio.playerNonces(p1Addr);

  const value = {
    missionId: 1n,
    player: p1Addr,
    score: score,
    proofHash: dummyProof,
    rewardAmount: rewardAmount,
    nonce: nonce,
  };

  // 1. Rogue signature test
  const rogueSig = await rogueAdjudicatorWallet.signTypedData(domain, types, value);
  try {
    await bountio.verifyResult(1n, p1Addr, score, dummyProof, rewardAmount, nonce, rogueSig);
    assert(false, 'Should revert for unauthorized adjudicator signature');
  } catch (e) {
    assert(true, 'Reverts for unauthorized adjudicator signature (InvalidSignature)');
  }

  // 2. Tampered score test
  const validSig = await adjudicatorWallet.signTypedData(domain, types, value);
  try {
    await bountio.verifyResult(1n, p1Addr, 9999n, dummyProof, rewardAmount, nonce, validSig);
    assert(false, 'Should revert if parameters do not match signature');
  } catch (e) {
    assert(true, 'Reverts on tampered score (InvalidSignature)');
  }

  // 3. Valid verification
  const verifyTx = await bountio.verifyResult(1n, p1Addr, score, dummyProof, rewardAmount, nonce, validSig);
  await verifyTx.wait();

  const pStatus = await bountio.getPlayerStatus(missionId, p1Addr);
  assert(pStatus.verified === true, 'Player 1 result marked verified on-chain');
  assert(pStatus.claimed === false, 'Player 1 reward not yet claimed');
  assert(pStatus.score === score, 'Player 1 score recorded correctly');
  assert(pStatus.rewardAmount === rewardAmount, 'Player 1 reward recorded correctly');

  // 4. Duplicate result verification test
  try {
    await bountio.verifyResult(1n, p1Addr, score, dummyProof, rewardAmount, nonce, validSig);
    assert(false, 'Should revert on duplicate verification');
  } catch (e) {
    assert(true, 'Reverts on duplicate verification (ResultAlreadyVerified)');
  }
  console.log('');

  console.log('[Phase 6] Reward Claiming');
  // Stranger cannot claim
  try {
    await bountio.connect(stranger).claimReward(missionId);
    assert(false, 'Stranger should not claim unverified reward');
  } catch (e) {
    assert(true, 'Reverts when unverified player claims (ResultNotVerified)');
  }

  const bountioBalBefore = await provider.getBalance(bountioAddress, 'latest');
  const p1BalBefore = await provider.getBalance(p1Addr, 'latest');
  const claimTx = await bountio.connect(player1).claimReward(missionId);
  const receipt = await claimTx.wait();
  const bountioBalAfter = await provider.getBalance(bountioAddress, receipt.blockNumber);
  const p1BalAfter = await provider.getBalance(p1Addr, receipt.blockNumber);
  console.log('Balance check details:');
  console.log('  Contract Bal Before:', ethers.formatEther(bountioBalBefore));
  console.log('  Contract Bal After:', ethers.formatEther(bountioBalAfter));
  console.log('  p1BalBefore:', p1BalBefore.toString());
  console.log('  p1BalAfter:', p1BalAfter.toString());
  console.log('  gasPaid:', receipt.fee.toString());
  console.log('  rewardAmount:', rewardAmount.toString());

  assert(bountioBalBefore - bountioBalAfter === rewardAmount, 'Contract paid out exact reward amount');
  assert(p1BalAfter + receipt.fee - p1BalBefore === rewardAmount, 'Player received exact native BOT reward');

  const pStatusAfter = await bountio.getPlayerStatus(missionId, p1Addr);
  assert(pStatusAfter.claimed === true, 'Player 1 status marked claimed');

  // Double claim test
  try {
    await bountio.connect(player1).claimReward(missionId);
    assert(false, 'Should revert on double claim');
  } catch (e) {
    assert(true, 'Reverts on double claim (RewardAlreadyClaimed)');
  }
  console.log('');

  console.log('[Phase 7] Atomic Settle & Claim (settleAndClaim)');
  // Mission 2 for player 2
  await bountio.createMission(
    2n,
    entryFee,
    maxPlayers,
    startTime,
    endTime,
    rulesHash,
    { value: initialPool }
  );

  const p2Addr = await player2.getAddress();
  await bountio.connect(player2).enterMission(2n, { value: entryFee });
  const p2Proof = ethers.keccak256(ethers.toUtf8Bytes('P2_PROOF'));
  await bountio.connect(player2).submitProof(2n, p2Proof);

  const p2Nonce = await bountio.playerNonces(p2Addr);
  const p2Score = 9800n;
  const p2Reward = ethers.parseEther('0.035');

  const p2Value = {
    missionId: 2n,
    player: p2Addr,
    score: p2Score,
    proofHash: p2Proof,
    rewardAmount: p2Reward,
    nonce: p2Nonce,
  };

  const p2Sig = await adjudicatorWallet.signTypedData(domain, types, p2Value);
  const bBal2Before = await provider.getBalance(bountioAddress, 'latest');
  const settleTx = await bountio.connect(player2).settleAndClaim(2n, p2Score, p2Proof, p2Reward, p2Nonce, p2Sig);
  const settleReceipt = await settleTx.wait();
  const bBal2After = await provider.getBalance(bountioAddress, settleReceipt.blockNumber);

  assert(bBal2Before - bBal2After === p2Reward, 'settleAndClaim verified and transferred reward in 1 tx');
  const p2Status = await bountio.getPlayerStatus(2n, p2Addr);
  assert(p2Status.verified === true && p2Status.claimed === true, 'Player 2 verified and claimed state set');
  console.log('');

  console.log('[Phase 8] Security, Pause & Access Control');
  // Non-owner cannot pause
  try {
    await bountio.connect(stranger).setPaused(true);
    assert(false, 'Stranger should not pause contract');
  } catch (e) {
    assert(true, 'Reverts when non-owner pauses (Unauthorized)');
  }

  // Owner pauses
  await bountio.setPaused(true);
  assert((await bountio.paused()) === true, 'Contract paused by owner');

  // Entry blocked when paused
  try {
    await bountio.connect(stranger).enterMission(1n, { value: entryFee });
    assert(false, 'Should revert when paused');
  } catch (e) {
    assert(true, 'Reverts when paused (ContractPaused)');
  }

  // Owner unpauses
  await bountio.setPaused(false);
  assert((await bountio.paused()) === false, 'Contract unpaused by owner');

  // Owner rotates adjudicator
  const newAdjudicator = ethers.Wallet.createRandom().address;
  await bountio.setAdjudicator(newAdjudicator);
  assert((await bountio.adjudicator()).toLowerCase() === newAdjudicator.toLowerCase(), 'Adjudicator successfully rotated');

  console.log('\n====================================================');
  console.log(`ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
