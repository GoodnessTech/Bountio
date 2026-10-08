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

async function main() {
  console.log('--- BOT CHAIN MAINNET PRE-DEPLOYMENT SAFETY CHECK ---');
  const wallet = new ethers.Wallet(privateKey);
  console.log('Deployer Address:', wallet.address);

  const chainIdHex = await rpcCall('eth_chainId');
  const chainId = parseInt(chainIdHex, 16);
  console.log('Target Chain ID:', chainId);
  if (chainId !== 677) throw new Error(`Wrong chain ID! Expected 677, got ${chainId}`);

  const balHex = await rpcCall('eth_getBalance', [wallet.address, 'latest']);
  const balanceWei = BigInt(balHex);
  console.log('Deployer Balance:', ethers.formatEther(balanceWei), 'BOT');

  const gasPriceHex = await rpcCall('eth_gasPrice');
  const gasPrice = BigInt(gasPriceHex);
  console.log('Current Gas Price:', ethers.formatUnits(gasPrice, 'gwei'), 'Gwei');

  const iface = new ethers.Interface(artifact.abi);
  const constructorData = iface.encodeDeploy([wallet.address]);
  const deployBytecode = artifact.bytecode + constructorData.slice(2);

  console.log('Deploy Bytecode Length (hex chars):', deployBytecode.length);

  const estimatedGasHex = await rpcCall('eth_estimateGas', [{
    from: wallet.address,
    data: deployBytecode,
  }]);
  const estimatedGas = BigInt(estimatedGasHex);
  console.log('Estimated Deployment Gas:', estimatedGas.toString());

  const estimatedCost = estimatedGas * gasPrice;
  console.log('Estimated Deployment Cost:', ethers.formatEther(estimatedCost), 'BOT');

  if (balanceWei < estimatedCost) {
    throw new Error(`Insufficient BOT! Need ${ethers.formatEther(estimatedCost)}, have ${ethers.formatEther(balanceWei)}`);
  }

  console.log('SAFETY CHECK PASSED! Wallet has sufficient BOT for deployment.');
}

main().catch(err => {
  console.error('Estimate failed:', err);
  process.exit(1);
});
