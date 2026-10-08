import fs from 'node:fs';
import path from 'node:path';
import solc from 'solc';

const sourcePath = path.resolve('contracts/Bountio.sol');
const sourceContent = fs.readFileSync(sourcePath, 'utf8');

const input = {
  language: 'Solidity',
  sources: {
    'Bountio.sol': {
      content: sourceContent,
    },
  },
  settings: {
    optimizer: {
      enabled: true,
      runs: 200,
    },
    evmVersion: 'paris',
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode', 'evm.deployedBytecode', 'evm.gasEstimates', 'evm.methodIdentifiers'],
      },
    },
  },
};

console.log('Compiling contracts/Bountio.sol with solc 0.8.28 (optimizer enabled, runs=200)...');
const output = JSON.parse(solc.compile(JSON.stringify(input)));

let hasErrors = false;
if (output.errors) {
  for (const error of output.errors) {
    if (error.severity === 'error') {
      console.error('COMPILE ERROR:', error.formattedMessage);
      hasErrors = true;
    } else {
      console.warn('WARNING:', error.formattedMessage);
    }
  }
}

if (hasErrors) {
  process.exit(1);
}

const contract = output.contracts['Bountio.sol']['Bountio'];
const bytecode = contract.evm.bytecode.object;
const deployedBytecode = contract.evm.deployedBytecode.object;
const abi = contract.abi;

console.log('Compilation SUCCESS!');
console.log('Creation Bytecode size:', bytecode.length / 2, 'bytes');
console.log('Deployed Bytecode size:', deployedBytecode.length / 2, 'bytes');

const outDir = path.resolve('artifacts');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const artifact = {
  contractName: 'Bountio',
  abi,
  bytecode: '0x' + bytecode,
  deployedBytecode: '0x' + deployedBytecode,
  gasEstimates: contract.evm.gasEstimates,
};

fs.writeFileSync(path.join(outDir, 'Bountio.json'), JSON.stringify(artifact, null, 2));
console.log('Saved artifact to artifacts/Bountio.json');
