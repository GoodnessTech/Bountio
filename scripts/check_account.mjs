import crypto from 'node:crypto';
import fs from 'node:fs';

const envFile = fs.readFileSync('.env', 'utf-8');
const match = envFile.match(/DEPLOYER_PRIVATE_KEY\s*=\s*(0x)?([a-fA-F0-9]{64})/);
if (!match) {
  console.error('DEPLOYER_PRIVATE_KEY not found in .env');
  process.exit(1);
}
const privateKeyHex = match[2];

const ecdh = crypto.createECDH('secp256k1');
ecdh.setPrivateKey(Buffer.from(privateKeyHex, 'hex'));
const uncompressedPubKey = ecdh.getPublicKey().subarray(1); // strip 0x04 prefix, 64 bytes

// keccak256 of uncompressed public key
// Node 20+ supports createHash('sha3-256') or keccak? Node crypto might not have keccak256 natively by that name, but let's check
// Or we can check if viem/ethers can be installed.
console.log('Uncompressed PubKey length:', uncompressedPubKey.length);
