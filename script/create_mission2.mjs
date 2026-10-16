import { ethers } from 'ethers';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/DEPLOYER_PRIVATE_KEY\s*=\s*(0x)?([a-fA-F0-9]{64})/);
if (!match) throw new Error('Missing DEPLOYER_PRIVATE_KEY in .env');
const privateKey = '0x' + match[2];

const artifact = JSON.parse(fs.readFileSync(path.resolve('artifacts/Bountio.json'), 'utf8'));
const contractAddress = '0x53a6922a6f604c9bd6f558e17a27c0e5194d215e';

function rpcCall(method, params = [], retries = 5) {
  return new Promise((resolve, reject) => {
    let attempt = 0;
    function tryCall() {
      attempt++;
      const postData = JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params });
      const req = https.request('https://rpc.botchain.ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Mozilla/5.0'
        },
        timeout: 60000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.error) {
              if (attempt < retries) {
                console.warn(`[Attempt ${attempt}/${retries}] RPC error: ${JSON.stringify(json.error)}. Retrying...`);
                setTimeout(tryCall, 2000 * attempt);
              } else {
                reject(json.error);
              }
            } else {
              resolve(json.result);
            }
          } catch (e) {
            if (attempt < retries) {
              console.warn(`[Attempt ${attempt}/${retries}] JSON parse error. Retrying...`);
              setTimeout(tryCall, 2000 * attempt);
            } else {
              reject(new Error(`Failed to parse: ${data}`));
            }
          }
        });
      });

      req.on('error', (err) => {
        if (attempt < retries) {
          console.warn(`[Attempt ${attempt}/${retries}] Network error: ${err.message}. Retrying...`);
          setTimeout(tryCall, 2000 * attempt);
        } else {
          reject(err);
        }
      });

      req.on('timeout', () => {
        req.destroy();
        if (attempt < retries) {
          console.warn(`[Attempt ${attempt}/${retries}] Timeout. Retrying...`);
          setTimeout(tryCall, 2000 * attempt);
        } else {
          reject(new Error('Request timeout after 60s'));
        }
      });

      req.write(postData);
      req.end();
    }
    tryCall();
  });
}

async function waitForReceipt(txHash, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const receipt = await rpcCall('eth_getTransactionReceipt', [txHash]);
    if (receipt && receipt.blockNumber) {
      return receipt;
    }
    await new Promise(r => setTimeout(r, 4000));
  }
  throw new Error(`Timeout waiting for transaction receipt: ${txHash}`);
}

async function main() {
  console.log('====================================================');
  console.log('INITIALIZING MISSION 2 ON BOT CHAIN MAINNET (CHAIN 677)');
  console.log('====================================================\n');

  const wallet = new ethers.Wallet(privateKey);
  console.log('Deployer Address:', wallet.address);

  // 1. Verify chain ID
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

  // 3. Prepare Mission 2 data
  const iface = new ethers.Interface(artifact.abi);
  const mission2Id = 2n;
  const entryFee = ethers.parseEther('0.005'); // 0.005 BOT entry fee
  const maxPlayers = 500; // Increased capacity so more wallets can enter
  const nowSec = BigInt(Math.floor(Date.now() / 1000));
  const startTime = nowSec - 300n; // started 5 minutes ago
  const endTime = nowSec + (180n * 86400n); // 180 days duration (6 months active window)
  const rulesHash = ethers.keccak256(ethers.toUtf8Bytes('BOUNTIO_TACTICAL_GRID_SECTOR_04_09_V2'));
  const initialPool = ethers.parseEther('0.02'); // fund pool with 0.02 BOT

  console.log('\nMission 2 Configuration:');
  console.log('  Mission ID:', mission2Id.toString());
  console.log('  Entry Fee:', ethers.formatEther(entryFee), 'BOT');
  console.log('  Max Players:', maxPlayers);
  console.log('  Start Time:', new Date(Number(startTime) * 1000).toISOString());
  console.log('  End Time:', new Date(Number(endTime) * 1000).toISOString());
  console.log('  Initial Pool Funding:', ethers.formatEther(initialPool), 'BOT');

  const createMissionData = iface.encodeFunctionData('createMission', [
    mission2Id,
    entryFee,
    maxPlayers,
    startTime,
    endTime,
    rulesHash,
  ]);

  const estimatedGasHex = await rpcCall('eth_estimateGas', [{
    from: wallet.address,
    to: contractAddress,
    data: createMissionData,
    value: ethers.toBeHex(initialPool),
  }]);
  const gasLimit = (BigInt(estimatedGasHex) * 125n) / 100n;
  console.log('Estimated Gas Limit:', gasLimit.toString());

  const txData = {
    to: contractAddress,
    nonce,
    gasLimit,
    gasPrice,
    data: createMissionData,
    value: initialPool,
    chainId: 677,
  };

  console.log('\nSigning transaction...');
  const signedTx = await wallet.signTransaction(txData);

  console.log('Broadcasting raw transaction to BOT Chain Mainnet...');
  const txHash = await rpcCall('eth_sendRawTransaction', [signedTx]);
  console.log(`>>> MISSION 2 CREATION TX HASH: ${txHash}`);

  console.log('Awaiting block confirmation...');
  const receipt = await waitForReceipt(txHash);
  console.log('Block Number:', parseInt(receipt.blockNumber, 16));
  console.log('Gas Used:', parseInt(receipt.gasUsed, 16));
  console.log('Status:', parseInt(receipt.status, 16) === 1 ? 'SUCCESS (1)' : 'FAILED (0)');

  if (parseInt(receipt.status, 16) !== 1) {
    throw new Error('Transaction reverted on-chain!');
  }

  // 4. Verify on-chain state
  console.log('\nVerifying Mission 2 state on-chain...');
  const missionCall = await rpcCall('eth_call', [{
    to: contractAddress,
    data: iface.encodeFunctionData('getMission', [mission2Id]),
  }, 'latest']);
  const missionData = iface.decodeFunctionResult('getMission', missionCall)[0];

  console.log('Mission 2 exists:', missionData.exists);
  console.log('Mission 2 entryFee:', ethers.formatEther(missionData.entryFee), 'BOT');
  console.log('Mission 2 rewardPool:', ethers.formatEther(missionData.rewardPool), 'BOT');
  console.log('Mission 2 maxPlayers:', missionData.maxPlayers.toString());
  console.log('Mission 2 status:', missionData.status.toString());
  console.log('Mission 2 endTime:', new Date(Number(missionData.endTime) * 1000).toISOString());

  // 5. Update deployment.json
  const deploymentPath = path.resolve('deployment.json');
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  deploymentInfo.mission2CreationTx = txHash;
  deploymentInfo.mission2Id = 2;
  deploymentInfo.mission2Pool = '0.02 BOT';
  deploymentInfo.mission2MaxPlayers = maxPlayers;
  deploymentInfo.mission2EndTime = new Date(Number(endTime) * 1000).toISOString();
  deploymentInfo.activeMissionId = 2;

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log('\nUpdated deployment.json with Mission 2 info.');
  console.log('====================================================');
  console.log('MISSION 2 INITIALIZATION COMPLETE');
  console.log('====================================================');
}

main().catch(err => {
  console.error('\nINITIALIZATION FAILED:', err);
  process.exit(1);
});
