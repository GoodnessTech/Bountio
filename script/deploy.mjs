import { ethers } from 'ethers';
import fs from 'node:fs';
import path from 'node:path';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/DEPLOYER_PRIVATE_KEY\s*=\s*(0x)?([a-fA-F0-9]{64})/);
if (!match) throw new Error('Missing DEPLOYER_PRIVATE_KEY in .env');
const privateKey = '0x' + match[2];

const artifact = JSON.parse(fs.readFileSync(path.resolve('artifacts/Bountio.json'), 'utf8'));

async function rpcCall(method, params = [], retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const res = await fetch('https://rpc.botchain.ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.result;
    } catch (err) {
      console.warn(`[Attempt ${attempt}/${retries}] RPC call ${method} warning: ${err.message}. Retrying...`);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

async function waitForReceipt(txHash, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await rpcCall('eth_getTransactionReceipt', [txHash]);
    if (receipt && receipt.blockNumber) {
      return receipt;
    }
    await new Promise(r => setTimeout(r, 3000));
  }
  throw new Error(`Timeout waiting for transaction receipt: ${txHash}`);
}

async function main() {
  console.log('====================================================');
  console.log('BROADCASTING BOUNTIO TO BOT CHAIN MAINNET (CHAIN 677)');
  console.log('====================================================\n');

  const wallet = new ethers.Wallet(privateKey);
  console.log('Deployer Address:', wallet.address);

  // 1. Verify Chain ID
  const chainIdHex = await rpcCall('eth_chainId');
  const chainId = parseInt(chainIdHex, 16);
  console.log('Verified Chain ID:', chainId);
  if (chainId !== 677) throw new Error(`Invalid chain ID: ${chainId}`);

  // 2. Nonce & Gas
  const nonceHex = await rpcCall('eth_getTransactionCount', [wallet.address, 'latest']);
  const nonce = parseInt(nonceHex, 16);
  console.log('Current Nonce:', nonce);

  const gasPriceHex = await rpcCall('eth_gasPrice');
  const gasPrice = BigInt(gasPriceHex);
  console.log('Gas Price:', ethers.formatUnits(gasPrice, 'gwei'), 'Gwei');

  // 3. Prepare deployment transaction
  const iface = new ethers.Interface(artifact.abi);
  const constructorData = iface.encodeDeploy([wallet.address]);
  const deployBytecode = artifact.bytecode + constructorData.slice(2);

  const estimatedGasHex = await rpcCall('eth_estimateGas', [{
    from: wallet.address,
    data: deployBytecode,
  }]);
  const gasLimit = (BigInt(estimatedGasHex) * 120n) / 100n; // 20% safety margin
  console.log('Gas Limit (with 20% buffer):', gasLimit.toString());

  const txData = {
    to: null,
    nonce,
    gasLimit,
    gasPrice,
    data: deployBytecode,
    value: 0n,
    chainId: 677,
  };

  console.log('\nSigning deployment transaction...');
  const signedTx = await wallet.signTransaction(txData);
  console.log('Signed transaction length:', signedTx.length);

  console.log('\nBroadcasting raw transaction to BOT Chain Mainnet...');
  const txHash = await rpcCall('eth_sendRawTransaction', [signedTx]);
  console.log(`>>> DEPLOYMENT TX HASH: ${txHash}`);

  console.log('\nAwaiting block confirmation...');
  const receipt = await waitForReceipt(txHash);
  const contractAddress = receipt.contractAddress;
  console.log(`>>> BOUNTIO MAINNET CONTRACT ADDRESS: ${contractAddress}`);
  console.log('Block Number:', parseInt(receipt.blockNumber, 16));
  console.log('Gas Used:', parseInt(receipt.gasUsed, 16));
  console.log('Status:', parseInt(receipt.status, 16) === 1 ? 'SUCCESS (1)' : 'FAILED (0)');

  if (parseInt(receipt.status, 16) !== 1) {
    throw new Error('Deployment transaction reverted on-chain!');
  }

  // 4. Verify deployment state on-chain
  console.log('\nVerifying on-chain state...');
  const ownerCall = await rpcCall('eth_call', [{
    to: contractAddress,
    data: iface.encodeFunctionData('owner'),
  }, 'latest']);
  const deployedOwner = iface.decodeFunctionResult('owner', ownerCall)[0];
  console.log('On-chain Owner:', deployedOwner);

  const adjudicatorCall = await rpcCall('eth_call', [{
    to: contractAddress,
    data: iface.encodeFunctionData('adjudicator'),
  }, 'latest']);
  const deployedAdjudicator = iface.decodeFunctionResult('adjudicator', adjudicatorCall)[0];
  console.log('On-chain Adjudicator:', deployedAdjudicator);

  // 5. Initialize Live Mission 1 on-chain
  console.log('\n--- Initializing Mission 1 (Strategy Grid) on Mainnet ---');
  const mission1Id = 1n;
  const entryFee = ethers.parseEther('0.005'); // 0.005 BOT entry fee
  const maxPlayers = 50;
  const startTime = BigInt(Math.floor(Date.now() / 1000) - 300); // started 5 mins ago
  const endTime = startTime + 604800n; // 7 days duration
  const rulesHash = ethers.keccak256(ethers.toUtf8Bytes('BOUNTIO_TACTICAL_GRID_SECTOR_04_09_V1'));
  const initialPool = ethers.parseEther('0.02'); // fund pool with 0.02 BOT

  const createMissionData = iface.encodeFunctionData('createMission', [
    mission1Id,
    entryFee,
    maxPlayers,
    startTime,
    endTime,
    rulesHash,
  ]);

  const nonce2Hex = await rpcCall('eth_getTransactionCount', [wallet.address, 'latest']);
  const nonce2 = parseInt(nonce2Hex, 16);

  const createGasHex = await rpcCall('eth_estimateGas', [{
    from: wallet.address,
    to: contractAddress,
    data: createMissionData,
    value: ethers.toBeHex(initialPool),
  }]);
  const createGasLimit = (BigInt(createGasHex) * 120n) / 100n;

  const createTxData = {
    to: contractAddress,
    nonce: nonce2,
    gasLimit: createGasLimit,
    gasPrice,
    data: createMissionData,
    value: initialPool,
    chainId: 677,
  };

  const signedCreateTx = await wallet.signTransaction(createTxData);
  const createTxHash = await rpcCall('eth_sendRawTransaction', [signedCreateTx]);
  console.log(`Mission Creation Tx Hash: ${createTxHash}`);

  const createReceipt = await waitForReceipt(createTxHash);
  console.log('Mission Created Status:', parseInt(createReceipt.status, 16) === 1 ? 'SUCCESS' : 'FAILED');

  // Verify Mission 1 State on-chain
  const missionCall = await rpcCall('eth_call', [{
    to: contractAddress,
    data: iface.encodeFunctionData('getMission', [mission1Id]),
  }, 'latest']);
  const missionData = iface.decodeFunctionResult('getMission', missionCall)[0];
  console.log('Mission 1 exists:', missionData.exists);
  console.log('Mission 1 entryFee:', ethers.formatEther(missionData.entryFee), 'BOT');
  console.log('Mission 1 rewardPool:', ethers.formatEther(missionData.rewardPool), 'BOT');
  console.log('Mission 1 status:', missionData.status.toString());

  // Save deployment deployment metadata
  const deploymentInfo = {
    network: 'BOT Chain Mainnet',
    chainId: 677,
    rpc: 'https://rpc.botchain.ai',
    contractAddress,
    deploymentTxHash: txHash,
    deploymentBlock: parseInt(receipt.blockNumber, 16),
    deploymentGasUsed: parseInt(receipt.gasUsed, 16),
    deployer: wallet.address,
    adjudicator: deployedAdjudicator,
    mission1CreationTx: createTxHash,
    mission1Id: 1,
    mission1Pool: '0.02 BOT',
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('\nDeployment metadata saved to deployment.json');
  console.log('====================================================');
  console.log('MAINNET DEPLOYMENT COMPLETE');
  console.log('====================================================');
}

main().catch(err => {
  console.error('\nDEPLOYMENT FAILED:', err);
  process.exit(1);
});
