import { ethers } from 'ethers';
import { CONFIG } from './config';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface MissionData {
  number: string;
  title: string;
  category: string;
  difficulty: string;
  entry: string;
  prize: string;
  players: string;
  status: string;
  accent: string;
  rawEntryFee: bigint;
  rawRewardPool: bigint;
  exists: boolean;
}

export interface PlayerStatusData {
  entered: boolean;
  proof: string;
  verified: boolean;
  claimed: boolean;
  score: string;
  rewardAmount: string;
  rewardFormatted: string;
  currentNonce: string;
}

// Fallback provider for reading contract data even without wallet connected
export function getReadProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(CONFIG.RPC_URL, {
    chainId: CONFIG.CHAIN_ID,
    name: 'botchain',
  }, { staticNetwork: true });
}

export function getReadContract(): ethers.Contract {
  return new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.ABI, getReadProvider());
}

const MISSION_CONFIGS: Record<number, { title: string; category: string; difficulty: string; accent: string }> = {
  1: { title: 'Strategy Grid', category: 'TACTICAL / TURN-BASED', difficulty: 'HARD', accent: 'orange' },
  2: { title: 'Resource Run', category: 'OPTIMIZATION / SPEED', difficulty: 'MEDIUM', accent: 'sand' },
  3: { title: 'Logic Arena', category: 'PUZZLE / PRECISION', difficulty: 'EXPERT', accent: 'red' },
};

export async function fetchMainnetMission(missionId: number = 2): Promise<MissionData | null> {
  const meta = MISSION_CONFIGS[missionId] || {
    title: `Mission ${missionId}`,
    category: 'TACTICAL CHALLENGE',
    difficulty: 'MEDIUM',
    accent: 'sand',
  };

  try {
    const contract = getReadContract();
    const m = await contract.getMission(missionId);
    if (!m.exists) return null;

    const isEnded = Number(m.endTime) > 0 && Math.floor(Date.now() / 1000) > Number(m.endTime);
    let status = 'INACTIVE';
    if (isEnded) {
      status = 'ENDED';
    } else if (Number(m.status) === 1) {
      status = 'OPEN';
    } else if (Number(m.status) === 2) {
      status = 'CLOSED';
    }

    return {
      number: String(missionId).padStart(2, '0'),
      title: meta.title,
      category: meta.category,
      difficulty: meta.difficulty,
      entry: `${ethers.formatEther(m.entryFee)} BOT`,
      prize: `${ethers.formatEther(m.rewardPool)} BOT`,
      players: `${Number(m.currentPlayers)} / ${Number(m.maxPlayers)}`,
      status,
      accent: meta.accent,
      rawEntryFee: m.entryFee,
      rawRewardPool: m.rewardPool,
      exists: true,
    };
  } catch (err) {
    console.warn('Direct RPC read failed, falling back to backend API:', err);
    try {
      const res = await fetch(`/api/mission/${missionId}`);
      const data = await res.json();
      if (!data.exists) return null;

      const isEnded = Number(data.endTime) > 0 && Math.floor(Date.now() / 1000) > Number(data.endTime);
      let status = 'INACTIVE';
      if (isEnded) {
        status = 'ENDED';
      } else if (data.status === 1) {
        status = 'OPEN';
      } else if (data.status === 2) {
        status = 'CLOSED';
      }

      return {
        number: String(missionId).padStart(2, '0'),
        title: meta.title,
        category: meta.category,
        difficulty: meta.difficulty,
        entry: `${data.entryFeeFormatted} BOT`,
        prize: `${data.rewardPoolFormatted} BOT`,
        players: `${data.currentPlayers} / ${data.maxPlayers}`,
        status,
        accent: meta.accent,
        rawEntryFee: BigInt(data.entryFee),
        rawRewardPool: BigInt(data.rewardPool),
        exists: true,
      };
    } catch {
      return null;
    }
  }
}

export async function fetchPlayerStatus(address: string, missionId: number = 1): Promise<PlayerStatusData | null> {
  if (!address) return null;
  try {
    const contract = getReadContract();
    const p = await contract.getPlayerStatus(missionId, address);
    return {
      entered: p[0],
      proof: p[1],
      verified: p[2],
      claimed: p[3],
      score: p[4].toString(),
      rewardAmount: p[5].toString(),
      rewardFormatted: ethers.formatEther(p[5]),
      currentNonce: p[6].toString(),
    };
  } catch (err) {
    console.warn('Direct RPC getPlayerStatus failed, falling back to backend API:', err);
    try {
      const res = await fetch(`/api/result/${missionId}/${address}`);
      const data = await res.json();
      return data;
    } catch {
      return null;
    }
  }
}

export async function switchOrAddBotChain(): Promise<void> {
  const eth = typeof window !== 'undefined' ? (window as any).ethereum : undefined;
  if (!eth) throw new Error('No browser wallet detected. Please install MetaMask, Rabby, or OKX.');

  try {
    await eth.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CONFIG.CHAIN_ID_HEX }],
    });
  } catch (switchError: any) {
    // 4902: Chain has not been added to MetaMask
    if (switchError.code === 4902 || switchError.data?.originalError?.code === 4902) {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: CONFIG.CHAIN_ID_HEX,
            chainName: 'BOT Chain',
            nativeCurrency: { name: 'BOT', symbol: 'BOT', decimals: 18 },
            rpcUrls: [CONFIG.RPC_URL],
            blockExplorerUrls: [CONFIG.EXPLORER_URL],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}
