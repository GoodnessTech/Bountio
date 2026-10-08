import BountioArtifact from './artifacts/Bountio.json';

export const CONFIG = {
  NETWORK_NAME: 'BOT Chain Mainnet',
  CHAIN_ID: Number(import.meta.env.VITE_BOTCHAIN_CHAIN_ID || 677),
  CHAIN_ID_HEX: '0x2a5',
  RPC_URL: import.meta.env.VITE_BOTCHAIN_RPC || 'https://rpc.botchain.ai',
  EXPLORER_URL: import.meta.env.VITE_BOTCHAIN_EXPLORER || 'https://scan.botchain.ai',
  OFFICIAL_SITE_URL: import.meta.env.VITE_BOTCHAIN_OFFICIAL || 'https://botchain.ai',
  CONTRACT_ADDRESS: import.meta.env.VITE_BOUNTIO_CONTRACT_ADDRESS || '0x53a6922a6f604c9bd6f558e17a27c0e5194d215e',
  DEPLOYMENT_TX: import.meta.env.VITE_DEPLOYMENT_TX || '0xe8b9104046a9adc9a249349d185a9d650865353ece146bd856dd91a810a70eae',
  DEPLOYER_ADDRESS: '0x34a19B30d9edD62424802d323E81c25599A9f02e',
  ABI: BountioArtifact.abi,
};
