import { ethers } from 'ethers';
import fs from 'node:fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/DEPLOYER_PRIVATE_KEY\s*=\s*(0x)?([a-fA-F0-9]{64})/);
if (!match) {
  console.error('DEPLOYER_PRIVATE_KEY not found in .env');
  process.exit(1);
}
const privateKey = '0x' + match[2];

const wallet = new ethers.Wallet(privateKey);
console.log('Deployer Address:', wallet.address);

// Raw JSON-RPC call
async function rpcCall(method, params = []) {
  const res = await fetch('https://rpc.botchain.ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
  return data.result;
}

const balHex = await rpcCall('eth_getBalance', [wallet.address, 'latest']);
const balanceWei = BigInt(balHex);
const balanceBOT = ethers.formatEther(balanceWei);

console.log('Balance Hex:', balHex);
console.log('Balance Wei:', balanceWei.toString());
console.log('Balance BOT:', balanceBOT);

const nonceHex = await rpcCall('eth_getTransactionCount', [wallet.address, 'latest']);
console.log('Deployer Nonce:', parseInt(nonceHex, 16));

const gasPriceHex = await rpcCall('eth_gasPrice');
const gasPriceWei = BigInt(gasPriceHex);
console.log('Gas Price (Gwei):', ethers.formatUnits(gasPriceWei, 'gwei'));
