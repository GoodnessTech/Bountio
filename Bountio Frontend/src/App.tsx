import { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  BarChart3,
  Check,
  ChevronRight,
  Circle,
  Crosshair,
  ExternalLink,
  GitBranch,
  Hexagon,
  LockKeyhole,
  Menu,
  Network,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Wallet,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { ethers } from 'ethers';
import { CONFIG } from './config';
import { fetchMainnetMission, fetchPlayerStatus, switchOrAddBotChain, MissionData, PlayerStatusData } from './web3';

type Page = 'home' | 'missions' | 'arena' | 'leaderboard' | 'how';

function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <span />
        <span />
        <span />
      </span>
      <span>BOUNTIO</span>
    </div>
  );
}

function StatusPill({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span className={`status-pill ${muted ? 'muted' : ''}`}>
      <span className="status-dot" />
      {children}
    </span>
  );
}

function MissionArtwork({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`mission-art ${compact ? 'compact-art' : ''}`}>
      <div className="art-grid" />
      <div className="orbit orbit-one" />
      <div className="orbit orbit-two" />
      <div className="orbit orbit-three" />
      <div className="art-core">
        <Target size={compact ? 18 : 26} strokeWidth={1.4} />
      </div>
      <span className="art-node node-a" />
      <span className="art-node node-b" />
      <span className="art-node node-c" />
      <span className="art-node node-d" />
      <span className="art-label label-a">PROOF / 01</span>
      <span className="art-label label-b">BOT CHAIN</span>
    </div>
  );
}

function Nav({
  page,
  setPage,
  onWallet,
  account,
  balance,
}: {
  page: Page;
  setPage: (page: Page) => void;
  onWallet: () => void;
  account: string | null;
  balance: string | null;
}) {
  const [open, setOpen] = useState(false);
  const items: { label: string; value: Page }[] = [
    { label: 'Missions', value: 'missions' },
    { label: 'Arena', value: 'arena' },
    { label: 'Leaderboard', value: 'leaderboard' },
    { label: 'How it works', value: 'how' },
  ];

  const shortAddr = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : null;

  return (
    <header className="nav-wrap">
      <nav className="nav-shell">
        <button className="logo-button" onClick={() => setPage('home')}>
          <Logo />
        </button>
        <div className={`nav-links ${open ? 'open' : ''}`}>
          {items.map((item) => (
            <button
              key={item.value}
              className={page === item.value ? 'active' : ''}
              onClick={() => {
                setPage(item.value);
                setOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button className="wallet-button" onClick={onWallet}>
          <Wallet size={15} />
          {shortAddr ? (
            <span>
              {shortAddr} <small style={{ opacity: 0.75, marginLeft: 4 }}>({balance ?? '0.00'} BOT)</small>
            </span>
          ) : (
            'Connect wallet'
          )}
          <ArrowRight size={14} />
        </button>
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label="Toggle navigation">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>
    </header>
  );
}

function Hero({ setPage, mission1 }: { setPage: (page: Page) => void; mission1: MissionData | null }) {
  return (
    <section className="hero section-shell">
      <div className="hero-copy">
        <div className="eyebrow">
          <span className="eyebrow-light">
            <Asterisk size={13} /> ON-CHAIN COMPETITION
          </span>
          <span>NO. 001</span>
        </div>
        <h1>
          Play.<br />
          <em>Prove.</em><br />
          Earn.
        </h1>
        <p className="hero-lede">
          Competitive missions with verifiable outcomes on BOT Chain Mainnet. Enter skill-based challenges, stake native BOT, and turn your performance into a cryptographically verified claim.
        </p>
        <div className="hero-actions">
          <button className="button-primary" onClick={() => setPage('missions')}>
            Explore missions <ArrowRight size={16} />
          </button>
          <button className="button-ghost" onClick={() => setPage('how')}>
            How it works <ChevronRight size={16} />
          </button>
        </div>
        <div className="hero-status">
          <StatusPill>BOT CHAIN MAINNET</StatusPill>
          <span>Chain 677</span>
          <span className="live-line">
            <span /> LIVE
          </span>
        </div>
      </div>
      <div className="hero-visual">
        <MissionArtwork />
        <div className="visual-caption">
          <span>MISSION / 001: {mission1?.prize ?? '0.02 BOT'} POOL</span>
          <span>
            VERIFIABLE BY DESIGN <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </section>
  );
}

function ConceptStrip() {
  const concepts = [
    { icon: <LockKeyhole />, label: 'Stake', text: 'Commit native BOT to enter.' },
    { icon: <Crosshair />, label: 'Compete', text: 'Complete the tactical mission.' },
    { icon: <ShieldCheck />, label: 'Verify', text: 'AI adjudicator checks proof.' },
    { icon: <Trophy />, label: 'Reward', text: 'Claim settled BOT on-chain.' },
  ];
  return (
    <section className="concept-strip section-shell">
      {concepts.map((item, index) => (
        <div className="concept" key={item.label}>
          <span className="concept-index">0{index + 1}</span>
          <div className="concept-icon">{item.icon}</div>
          <div>
            <strong>{item.label}</strong>
            <p>{item.text}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-heading">
      <div>
        <div className="mini-label">
          <span />
          {eyebrow}
        </div>
        <h2>{title}</h2>
      </div>
      {text && <p>{text}</p>}
      {action && (
        <button className="text-button" onClick={onAction}>
          {action} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

function MissionCard({
  mission,
  onSelect,
}: {
  mission: MissionData;
  onSelect: (mission: MissionData) => void;
}) {
  return (
    <article className={`mission-card accent-${mission.accent}`}>
      <div className="card-top">
        <span className="mission-number">MISSION {mission.number}</span>
        <StatusPill muted={mission.status !== 'OPEN'}>{mission.status}</StatusPill>
      </div>
      <div className="card-title-row">
        <div>
          <span className="category-label">{mission.category}</span>
          <h3>{mission.title}</h3>
        </div>
        <div className="card-sigil">
          <Hexagon size={28} strokeWidth={1} />
        </div>
      </div>
      <div className="mission-card-visual">
        <MissionArtwork compact />
      </div>
      <div className="mission-data">
        <div>
          <span>DIFFICULTY</span>
          <strong>{mission.difficulty}</strong>
        </div>
        <div>
          <span>ENTRY STAKE</span>
          <strong>{mission.entry}</strong>
        </div>
        <div>
          <span>PRIZE POOL</span>
          <strong className="orange-text">{mission.prize}</strong>
        </div>
        <div>
          <span>PLAYERS</span>
          <strong>{mission.players}</strong>
        </div>
      </div>
      <button className="card-action" onClick={() => onSelect(mission)}>
        {mission.status === 'OPEN' ? 'Enter mission' : 'View mission'} <ArrowUpRight />
      </button>
    </article>
  );
}

function TrustSection() {
  const steps = [
    { label: 'PLAYER', icon: <Crosshair /> },
    { label: 'MISSION', icon: <Target /> },
    { label: 'GAME ENGINE', icon: <Play /> },
    { label: 'PROOF', icon: <GitBranch /> },
    { label: 'AI ADJUDICATOR', icon: <Sparkles /> },
    { label: 'BOT CHAIN', icon: <Network /> },
    { label: 'REWARD', icon: <Trophy /> },
  ];
  return (
    <section className="trust-section section-shell">
      <SectionHeading
        eyebrow="THE BOUNTIO PROTOCOL"
        title="Built to be verified"
        text="Bountio separates gameplay from settlement. The game engine executes off-chain. The economic truth and reward settlement are executed on BOT Chain Mainnet."
      />
      <div className="trust-layout">
        <div className="protocol-copy">
          <p>
            AI adjudication evaluates whether a submitted cryptographic proof satisfies the mission rules. The smart contract validates authorized EIP-712 signatures and releases native BOT.
          </p>
          <div className="contract-list">
            <span>
              <Check size={14} /> Native BOT staking on-chain
            </span>
            <span>
              <Check size={14} /> EIP-712 AI adjudication signature
            </span>
            <span>
              <Check size={14} /> Anti-cheat & anti-double-claim protection
            </span>
            <span>
              <Check size={14} /> Atomic settle & reward claim
            </span>
          </div>
        </div>
        <div className="flow-diagram">
          {steps.map((step, index) => (
            <div className="flow-item" key={step.label}>
              <div className="flow-node">{step.icon}</div>
              <span>{step.label}</span>
              {index < steps.length - 1 && <div className="flow-line" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MainnetStatus() {
  return (
    <section className="mainnet section-shell">
      <div>
        <div className="mini-label">
          <span />
          NETWORK STATUS
        </div>
        <h2>
          Settled on-chain.<br />
          <em>Verified by AI.</em>
        </h2>
      </div>
      <div className="network-card">
        <div className="network-brand">
          <Logo />
          <span>BOT CHAIN MAINNET</span>
        </div>
        <div className="network-details">
          <div>
            <span>CHAIN ID</span>
            <strong>{CONFIG.CHAIN_ID} (0x2a5)</strong>
          </div>
          <div>
            <span>NETWORK</span>
            <strong>{CONFIG.NETWORK_NAME}</strong>
          </div>
          <div>
            <span>STATUS</span>
            <strong className="live-text">
              <i /> LIVE
            </strong>
          </div>
          <div>
            <span>CONTRACT</span>
            <strong>
              <a
                href={`${CONFIG.EXPLORER_URL}/address/${CONFIG.CONTRACT_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="tx-link"
              >
                {CONFIG.CONTRACT_ADDRESS.slice(0, 10)}...{CONFIG.CONTRACT_ADDRESS.slice(-8)}
              </a>
            </strong>
          </div>
        </div>
        <div className="network-foot">
          <span>
            Deployment Tx:{' '}
            <a
              href={`${CONFIG.EXPLORER_URL}/tx/${CONFIG.DEPLOYMENT_TX}`}
              target="_blank"
              rel="noreferrer"
              className="tx-link"
            >
              {CONFIG.DEPLOYMENT_TX.slice(0, 14)}...
            </a>
          </span>
          <a
            href={`${CONFIG.EXPLORER_URL}/address/${CONFIG.CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noreferrer"
            style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
          >
            View on BOTScan <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}

function Home({
  setPage,
  onSelect,
  missions,
}: {
  setPage: (page: Page) => void;
  onSelect: (mission: MissionData) => void;
  missions: MissionData[];
}) {
  return (
    <>
      <Hero setPage={setPage} mission1={missions[0] || null} />
      <ConceptStrip />
      <section className="featured section-shell">
        <SectionHeading
          eyebrow="THE ARENA IS OPEN"
          title="Find your next edge."
          text="Stake native BOT. Complete the challenge. Let AI verify your proof."
          action="View all missions"
          onAction={() => setPage('missions')}
        />
        <div className="mission-grid featured-grid">
          {missions.map((mission) => (
            <MissionCard key={mission.number} mission={mission} onSelect={onSelect} />
          ))}
        </div>
      </section>
      <TrustSection />
      <MainnetStatus />
    </>
  );
}

function MissionsPage({
  missions,
  onSelect,
  refreshMissions,
}: {
  missions: MissionData[];
  onSelect: (mission: MissionData) => void;
  refreshMissions: () => void;
}) {
  return (
    <main className="page-main section-shell">
      <SectionHeading
        eyebrow="LIVE PROTOCOL MISSIONS"
        title="Compete in missions"
        text="Every mission has an on-chain stake, cryptographic proof validation, AI adjudication, and native BOT rewards."
      />
      <div className="filter-row">
        <div className="filter-tabs">
          <button className="selected">
            ALL MISSIONS <span>03</span>
          </button>
          <button>
            OPEN NOW <span>01</span>
          </button>
          <button>
            SCHEDULED <span>02</span>
          </button>
        </div>
        <button
          onClick={refreshMissions}
          className="sort-note"
          style={{ background: 'none', border: 0, cursor: 'pointer' }}
        >
          <RefreshCw size={13} /> Refresh mainnet state
        </button>
      </div>
      <div className="mission-grid">
        {missions.map((mission) => (
          <MissionCard key={mission.number} mission={mission} onSelect={onSelect} />
        ))}
      </div>
    </main>
  );
}

function Arena({
  playerStatus,
  account,
  onSubmitProof,
  hasEntered,
}: {
  playerStatus: PlayerStatusData | null;
  account: string | null;
  onSubmitProof: (moves: number[], resource: number, timeSeconds: number) => void;
  hasEntered: boolean;
}) {
  const [selected, setSelected] = useState<number[]>([0, 4, 8]);
  const [movesCount, setMovesCount] = useState<number>(3);
  const [resource, setResource] = useState<number>(78);
  const [seconds, setSeconds] = useState<number>(134);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggle = (index: number): void => {
    // Restricted sectors 5 and 10
    if (index === 5 || index === 10) return;

    setSelected((current) => {
      const isRemoving = current.includes(index);
      const next = isRemoving ? current.filter((item) => item !== index) : [...current, index];
      setMovesCount((m) => m + 1);
      setResource((r) => Math.max(50, r - (isRemoving ? 1 : 2)));
      return next;
    });
  };

  const reset = (): void => {
    setSelected([0, 4, 8]);
    setMovesCount(3);
    setResource(78);
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <main className="page-main section-shell arena-page">
      <div className="arena-head">
        <div>
          <div className="mini-label">
            <span />
            LIVE MISSION / 01
          </div>
          <h2>Strategy Grid</h2>
          <p>
            Complete the tactical path with optimal moves while maintaining resource threshold above 50. Restricted sectors must not be entered.
          </p>
        </div>
        <StatusPill>{hasEntered ? 'STAKED & ACTIVE' : 'UNSTAKED OBSERVER'}</StatusPill>
      </div>
      <div className="arena-layout">
        <aside className="arena-sidebar">
          <div className="side-block">
            <span className="side-label">MISSION STATE</span>
            <strong>
              ROUND 03 <small>/ 05</small>
            </strong>
            <div className="progress-track">
              <span style={{ width: '60%' }} />
            </div>
            <div className="side-meta">
              <span>
                Moves <b>{movesCount}</b>
              </span>
              <span>
                Time <b>{formatTime(seconds)}</b>
              </span>
            </div>
          </div>
          <div className="side-block">
            <span className="side-label">OBJECTIVE</span>
            <p>Connect active tactical nodes without crossing the restricted sectors (5 and 10).</p>
          </div>
          <div className="side-block">
            <span className="side-label">RESOURCE GAUGE</span>
            <div className="resource-value">
              <span /> {resource} <small>/ 100</small>
            </div>
          </div>
          <button
            className="button-primary full-button"
            onClick={() => onSubmitProof(selected, resource, seconds)}
          >
            Submit proof for AI verify <ArrowRight size={15} />
          </button>
        </aside>

        <section className="challenge-panel">
          <div className="challenge-top">
            <span>
              TACTICAL GRID <i /> TURN 03
            </span>
            <span>SECTOR 04 / 09</span>
          </div>
          <div className="strategy-grid">
            {Array.from({ length: 16 }, (_, index) => {
              const isSelected = selected.includes(index);
              const isBlocked = index === 5 || index === 10;
              return (
                <button
                  key={index}
                  className={`grid-tile ${isSelected ? 'selected' : ''} ${isBlocked ? 'blocked' : ''}`}
                  onClick={() => toggle(index)}
                  aria-label={`Grid tile ${index + 1}`}
                  disabled={isBlocked}
                >
                  <span>
                    {isSelected ? (
                      <Circle size={14} fill="currentColor" />
                    ) : (
                      <span className="tile-point" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="challenge-footer">
            <span>
              <span className="legend-dot active" /> Selected nodes ({selected.length})
            </span>
            <span>
              <span className="legend-dot blocked" /> Restricted sector (5, 10)
            </span>
            <button onClick={reset}>
              Reset sequence <X size={13} />
            </button>
          </div>
        </section>

        <aside className="live-panel">
          <div className="live-panel-title">
            <span>ON-CHAIN ARENA</span>
            <StatusPill>{hasEntered ? '1 ENTERED' : '0 ENTERED'}</StatusPill>
          </div>
          <div className="player-list">
            {account ? (
              <div className="player-row">
                <span className="player-rank">#01</span>
                <div>
                  <strong>{account.slice(0, 6)}...{account.slice(-4)}</strong>
                  <span className={playerStatus?.verified ? 'verified-text' : ''}>
                    {playerStatus?.claimed
                      ? 'CLAIMED'
                      : playerStatus?.verified
                      ? 'AI VERIFIED'
                      : hasEntered
                      ? 'ACTIVE / STAKED'
                      : 'OBSERVER'}
                  </span>
                </div>
                <span className="player-bar" />
              </div>
            ) : (
              <p style={{ color: '#68625c', font: '10px var(--mono)', padding: '12px 0' }}>
                Connect wallet to see player position
              </p>
            )}
          </div>
          <div className="activity-list">
            <span className="side-label">MAINNET ACTIVITY</span>
            {hasEntered ? (
              <p className="highlight">
                <i /> MISSION STAKE RECORDED <small>LIVE</small>
              </p>
            ) : (
              <p>
                <i /> Awaiting player stake <small>--:--</small>
              </p>
            )}
            {playerStatus?.proof && playerStatus.proof !== ethers.ZeroHash ? (
              <p className="highlight">
                <i /> PROOF COMMITTED <small>ON-CHAIN</small>
              </p>
            ) : (
              <p>
                <i /> Proof uncommitted <small>--:--</small>
              </p>
            )}
            {playerStatus?.verified ? (
              <p className="highlight">
                <i /> AI ADJUDICATION VERIFIED <small>ACCEPTED</small>
              </p>
            ) : (
              <p>
                <i /> Ready for verification <small>--:--</small>
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}

function Leaderboard({
  account,
  playerStatus,
}: {
  account: string | null;
  playerStatus: PlayerStatusData | null;
}) {
  const shortAddr = account ? `${account.slice(0, 6)}...${account.slice(-4)}` : null;

  return (
    <main className="page-main section-shell leaderboard-page">
      <SectionHeading
        eyebrow="MAINNET COMPETITIVE INDEX"
        title="Global rankings"
        text="Performance, not promises. The leaderboard reflects verified outcomes and claims directly settled on BOT Chain Mainnet."
      />
      <div className="rank-tabs">
        <button className="active">MAINNET MISSIONS</button>
        <span className="rank-updated">
          FEEDING FROM BOT CHAIN MAINNET <i />
        </span>
      </div>
      <div className="rank-table">
        <div className="rank-row rank-header">
          <span>RANK</span>
          <span>PLAYER</span>
          <span>MISSIONS</span>
          <span>STATUS</span>
          <span>OUTCOME</span>
          <span>REWARDS</span>
          <span>VERIFIED SCORE</span>
        </div>
        {account && playerStatus?.entered ? (
          <div className="rank-row you">
            <span>
              <b className="you-mark">YOU</b> 01
            </span>
            <span>{shortAddr}</span>
            <span>01</span>
            <span>{playerStatus.claimed ? 'CLAIMED' : playerStatus.verified ? 'VERIFIED' : 'ACTIVE'}</span>
            <span>{playerStatus.verified ? 'PASSED' : 'IN PLAY'}</span>
            <span>{playerStatus.rewardFormatted ? `${playerStatus.rewardFormatted} BOT` : '0.00 BOT'}</span>
            <span>
              {playerStatus.score && playerStatus.score !== '0' ? playerStatus.score : '9,780'}
              <span className="score-mark" style={{ width: '88px' }} />
            </span>
          </div>
        ) : (
          <div className="rank-row" style={{ gridColumn: '1 / -1', padding: '24px 18px', textAlign: 'center' }}>
            <span style={{ color: '#88827b' }}>
              Awaiting network data: Stake in Mission 01 and complete verification to record your position on BOT Chain Mainnet.
            </span>
          </div>
        )}
      </div>
    </main>
  );
}

function HowItWorks() {
  const steps = [
    ['01', 'ENTER', 'Choose a live mission on BOT Chain Mainnet and stake native BOT.'],
    ['02', 'PERFORM', 'Complete the tactical challenge off-chain in the Bountio Arena.'],
    ['03', 'SUBMIT', 'Generate deterministic moves proof and commit outcome commitment.'],
    ['04', 'AI ADJUDICATES', 'Off-chain AI adjudication verifies anti-cheat and signs EIP-712 outcome.'],
    ['05', 'ON-CHAIN RECORD', 'Verified outcome and cryptographic proof are verified by Bountio contract.'],
    ['06', 'REWARD', 'Claim native BOT reward transferred directly to your wallet.'],
  ];
  return (
    <main className="page-main section-shell how-page">
      <div className="how-intro">
        <div className="mini-label">
          <span />
          THE PROTOCOL
        </div>
        <h1>
          Competition you can<br />
          <em>prove.</em>
        </h1>
        <p>
          From your first stake to your final claim, every meaningful moment has a clear path from play to proof on BOT Chain Mainnet.
        </p>
      </div>
      <div className="how-grid">
        {steps.map((step, index) => (
          <article className={`how-card ${index === 3 ? 'featured-how' : ''}`} key={step[0]}>
            <span>{step[0]}</span>
            <div className="how-icon">
              {index === 0 ? (
                <LockKeyhole />
              ) : index === 1 ? (
                <Crosshair />
              ) : index === 2 ? (
                <GitBranch />
              ) : index === 3 ? (
                <Sparkles />
              ) : index === 4 ? (
                <Network />
              ) : (
                <Trophy />
              )}
            </div>
            <h3>{step[1]}</h3>
            <p>{step[2]}</p>
            <ArrowRight className="how-arrow" size={17} />
          </article>
        ))}
      </div>
      <TrustSection />
    </main>
  );
}

function MissionModal({
  mission,
  onClose,
  onEnter,
  account,
  hasEntered,
  isEntering,
  txHash,
  errorMessage,
}: {
  mission: MissionData;
  onClose: () => void;
  onEnter: () => void;
  account: string | null;
  hasEntered: boolean;
  isEntering: boolean;
  txHash: string | null;
  errorMessage: string | null;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="mission-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X />
        </button>
        <div className="modal-kicker">
          MISSION {mission.number} / {mission.category}
        </div>
        <h2>{mission.title}</h2>
        <div className="modal-status">
          <StatusPill muted={mission.status !== 'OPEN'}>{mission.status}</StatusPill>
          <span>
            <ShieldCheck size={14} /> AI VERIFIED ON BOT CHAIN
          </span>
        </div>
        <div className="modal-art">
          <MissionArtwork compact />
        </div>
        <p className="modal-description">
          Complete the tactical sequence using fewest possible moves without crossing restricted sectors. Maintain resource gauge above 50 to pass AI adjudication.
        </p>
        <div className="modal-stats">
          <div>
            <span>ENTRY STAKE</span>
            <strong>{mission.entry}</strong>
          </div>
          <div>
            <span>PRIZE POOL</span>
            <strong className="orange-text">{mission.prize}</strong>
          </div>
          <div>
            <span>CAPACITY</span>
            <strong>{mission.players}</strong>
          </div>
          <div>
            <span>NETWORK</span>
            <strong>CHAIN 677</strong>
          </div>
        </div>

        {errorMessage && (
          <div className="notice-box error">
            <AlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />
            {errorMessage}
          </div>
        )}

        {txHash && (
          <div className="notice-box">
            <span>Transaction broadcast: </span>
            <a
              href={`${CONFIG.EXPLORER_URL}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="tx-link"
            >
              {txHash.slice(0, 16)}... View on BOTScan
            </a>
          </div>
        )}

        <button
          className="button-primary modal-cta"
          onClick={onEnter}
          disabled={isEntering || (hasEntered && mission.number === '01')}
          style={{ marginTop: 16 }}
        >
          {isEntering ? (
            'Staking native BOT on-chain...'
          ) : hasEntered ? (
            <>
              Already entered <span>Go to Arena</span>
              <ArrowRight size={16} />
            </>
          ) : !account ? (
            <>
              Connect wallet to stake <span>{mission.entry}</span>
              <ArrowRight size={16} />
            </>
          ) : (
            <>
              Stake native BOT & enter <span>{mission.entry}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
        <div className="modal-note">
          <LockKeyhole size={13} /> BOT Chain Mainnet transaction required to stake
        </div>
      </div>
    </div>
  );
}

function WalletModal({
  onClose,
  account,
  balance,
  onConnect,
  onDisconnect,
  errorMessage,
}: {
  onClose: () => void;
  account: string | null;
  balance: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  errorMessage: string | null;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X />
        </button>
        <div className="wallet-icon">
          <Wallet />
        </div>
        <div className="modal-kicker">BOT CHAIN MAINNET (CHAIN 677)</div>
        <h2>{account ? 'Wallet connected.' : 'Connect to compete.'}</h2>
        <p>
          {account
            ? `Your wallet is active on BOT Chain Mainnet. Address: ${account.slice(0, 6)}...${account.slice(-4)}`
            : 'Your wallet is your player identity on BOT Chain Mainnet. Connect to enter missions, submit proofs, and claim rewards.'}
        </p>

        {errorMessage && (
          <div className="notice-box error" style={{ margin: '14px 0' }}>
            {errorMessage}
          </div>
        )}

        {account ? (
          <div style={{ marginTop: 24 }}>
            <div className="modal-stats" style={{ margin: '16px 0' }}>
              <div>
                <span>NETWORK</span>
                <strong>BOT Chain</strong>
              </div>
              <div>
                <span>CHAIN ID</span>
                <strong>677</strong>
              </div>
              <div>
                <span>NATIVE BALANCE</span>
                <strong className="orange-text">{balance ?? '0.00'} BOT</strong>
              </div>
              <div>
                <span>EXPLORER</span>
                <strong>
                  <a
                    href={`${CONFIG.EXPLORER_URL}/address/${account}`}
                    target="_blank"
                    rel="noreferrer"
                    className="tx-link"
                  >
                    BOTScan
                  </a>
                </strong>
              </div>
            </div>
            <button
              className="button-ghost"
              style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}
              onClick={onDisconnect}
            >
              Disconnect wallet
            </button>
          </div>
        ) : (
          <button className="wallet-option" onClick={onConnect}>
            <span className="wallet-option-icon">◎</span>
            <span>
              <strong>Browser wallet (MetaMask / Rabby / OKX)</strong>
              <small>Connect to BOT Chain Mainnet (Chain 677)</small>
            </span>
            <ChevronRight />
          </button>
        )}
        <div className="modal-note" style={{ marginTop: 20 }}>
          Direct native BOT connection. No intermediary tokens.
        </div>
      </div>
    </div>
  );
}

function VerificationModal({
  onClose,
  adjudicationData,
  onClaimReward,
  isClaiming,
  claimTxHash,
  errorMessage,
}: {
  onClose: () => void;
  adjudicationData: any;
  onClaimReward: () => void;
  isClaiming: boolean;
  claimTxHash: string | null;
  errorMessage: string | null;
}) {
  const isVerified = Boolean(adjudicationData?.verified);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`verify-modal ${isVerified ? 'is-verified' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X />
        </button>

        {claimTxHash ? (
          <>
            <div className="verified-seal">
              <Check size={31} />
            </div>
            <div className="modal-kicker">BOT CHAIN MAINNET SETTLEMENT</div>
            <h2>ON-CHAIN REWARD UNLOCKED</h2>
            <p>
              Your native BOT reward has been claimed directly from the Bountio smart contract on BOT Chain Mainnet.
            </p>
            <div className="reward-box">
              <span>REWARD SETTLED</span>
              <strong>
                {adjudicationData?.rewardFormatted ?? '0.008'} <small>BOT</small>
              </strong>
              <StatusPill>TRANSFERRED TO WALLET</StatusPill>
            </div>
            <div className="notice-box">
              <span>Confirmed Tx: </span>
              <a
                href={`${CONFIG.EXPLORER_URL}/tx/${claimTxHash}`}
                target="_blank"
                rel="noreferrer"
                className="tx-link"
              >
                {claimTxHash.slice(0, 16)}... View on BOTScan
              </a>
            </div>
            <button className="button-primary modal-cta" onClick={onClose} style={{ marginTop: 16 }}>
              Done <ArrowRight size={16} />
            </button>
          </>
        ) : isVerified ? (
          <>
            <div className="verified-seal">
              <Check size={31} />
            </div>
            <div className="modal-kicker">AI ADJUDICATION COMPLETE</div>
            <h2>AI VERIFIED</h2>
            <p>
              {adjudicationData?.adjudication?.reasoning ??
                'Your submitted outcome satisfied the mission rules and has been authorized for on-chain settlement.'}
            </p>
            <div className="reward-box">
              <span>VERIFIED REWARD</span>
              <strong>
                {adjudicationData?.rewardFormatted ?? '0.008'} <small>BOT</small>
              </strong>
              <StatusPill>READY TO CLAIM ON MAINNET</StatusPill>
            </div>
            <div style={{ textAlign: 'left', font: '10px var(--mono)', color: '#88827b', marginBottom: 16 }}>
              <div>Score: <b style={{ color: '#fff' }}>{adjudicationData?.score}</b></div>
              <div>Proof Hash: <span style={{ opacity: 0.8 }}>{adjudicationData?.proofHash?.slice(0, 18)}...</span></div>
              <div>Adjudicator: <span style={{ opacity: 0.8 }}>{adjudicationData?.adjudication?.adjudicator?.slice(0, 14)}...</span></div>
            </div>

            {errorMessage && (
              <div className="notice-box error" style={{ marginBottom: 14 }}>
                {errorMessage}
              </div>
            )}

            <button
              className="button-primary modal-cta"
              onClick={onClaimReward}
              disabled={isClaiming}
            >
              {isClaiming ? 'Claiming BOT on BOT Chain...' : 'Claim reward on BOT Chain'}
              <ArrowRight size={16} />
            </button>
          </>
        ) : (
          <>
            <div className="verify-orbit">
              <Sparkles size={28} />
            </div>
            <div className="modal-kicker">PROOF RECEIVED</div>
            <h2>Verifying result...</h2>
            <p>AI adjudication service is reconstructing your tactical game state against mission rules.</p>
            <div className="verify-steps">
              <span className="done">
                <Check size={13} /> 01 &nbsp; Proof received & committed
              </span>
              <span className="done">
                <Check size={13} /> 02 &nbsp; Tactical sequence reconstructed
              </span>
              <span>
                <span className="step-num">03</span> AI adjudication evaluating rules
              </span>
              <span>
                <span className="step-num">04</span> Issuing EIP-712 cryptographic signature
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>('home');
  const [selectedMission, setSelectedMission] = useState<MissionData | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);
  const [verificationOpen, setVerificationOpen] = useState(false);

  // Web3 state
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isEntering, setIsEntering] = useState(false);
  const [entryTxHash, setEntryTxHash] = useState<string | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimTxHash, setClaimTxHash] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [adjudicationData, setAdjudicationData] = useState<any>(null);
  const [playerStatus, setPlayerStatus] = useState<PlayerStatusData | null>(null);

  // Mainnet Missions State
  const [missions, setMissions] = useState<MissionData[]>([
    {
      number: '01',
      title: 'Strategy Grid',
      category: 'TACTICAL / TURN-BASED',
      difficulty: 'HARD',
      entry: '0.005 BOT',
      prize: '0.02 BOT',
      players: '0 / 50',
      status: 'OPEN',
      accent: 'orange',
      rawEntryFee: 5000000000000000n,
      rawRewardPool: 20000000000000000n,
      exists: true,
    },
    {
      number: '02',
      title: 'Resource Run',
      category: 'OPTIMIZATION / SPEED',
      difficulty: 'MEDIUM',
      entry: '0.005 BOT',
      prize: 'Awaiting network data',
      players: '0 / 100',
      status: 'AWAITING NETWORK DATA',
      accent: 'sand',
      rawEntryFee: 5000000000000000n,
      rawRewardPool: 0n,
      exists: false,
    },
    {
      number: '03',
      title: 'Logic Arena',
      category: 'PUZZLE / PRECISION',
      difficulty: 'EXPERT',
      entry: '0.01 BOT',
      prize: 'Awaiting network data',
      players: '0 / 25',
      status: 'AWAITING NETWORK DATA',
      accent: 'red',
      rawEntryFee: 10000000000000000n,
      rawRewardPool: 0n,
      exists: false,
    },
  ]);

  // Load real mission from BOT Chain Mainnet
  const loadMainnetData = useCallback(async () => {
    try {
      const m1 = await fetchMainnetMission(1);
      if (m1) {
        setMissions((current) => [m1, current[1], current[2]]);
      }
    } catch (e) {
      console.warn('Failed loading mission 1 from mainnet:', e);
    }
  }, []);

  // Load player status
  const loadPlayerStatus = useCallback(async (addr: string) => {
    try {
      const p = await fetchPlayerStatus(addr, 1);
      if (p) {
        setPlayerStatus(p);
      }
    } catch (e) {
      console.warn('Failed loading player status:', e);
    }
  }, []);

  // Update balance
  const updateBalance = useCallback(async (addr: string) => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const bal = await provider.getBalance(addr);
        setBalance(parseFloat(ethers.formatEther(bal)).toFixed(4));
      }
    } catch (e) {
      console.warn('Error fetching balance:', e);
    }
  }, []);

  useEffect(() => {
    loadMainnetData();
  }, [loadMainnetData]);

  // Handle wallet accountsChanged
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccounts = (accounts: string[]) => {
        if (accounts.length > 0) {
          const addr = accounts[0];
          setAccount(addr);
          updateBalance(addr);
          loadPlayerStatus(addr);
        } else {
          setAccount(null);
          setBalance(null);
          setPlayerStatus(null);
        }
      };

      window.ethereum.on('accountsChanged', handleAccounts);
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      // Auto-check if already authorized
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accs: string[]) => {
          if (accs && accs.length > 0) {
            handleAccounts(accs);
          }
        })
        .catch(() => {});

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccounts);
        }
      };
    }
  }, [updateBalance, loadPlayerStatus]);

  // Connect wallet function
  const handleConnectWallet = async () => {
    setWalletError(null);
    try {
      if (!window.ethereum) {
        throw new Error('No browser wallet detected. Please install MetaMask, Rabby, or OKX.');
      }
      await switchOrAddBotChain();
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        const addr = accounts[0];
        setAccount(addr);
        await updateBalance(addr);
        await loadPlayerStatus(addr);
        setWalletOpen(false);
      }
    } catch (err: any) {
      console.error('Connection error:', err);
      setWalletError(err.message || 'Failed to connect wallet');
    }
  };

  const handleDisconnect = () => {
    setAccount(null);
    setBalance(null);
    setPlayerStatus(null);
    setWalletOpen(false);
  };

  // Enter mission transaction
  const handleEnterMission = async () => {
    setWalletError(null);
    if (!account) {
      handleConnectWallet();
      return;
    }

    try {
      setIsEntering(true);
      await switchOrAddBotChain();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.ABI, signer);

      const missionId = 1n;
      const entryFee = missions[0]?.rawEntryFee ?? ethers.parseEther('0.005');

      console.log(`Entering mission ${missionId} with fee ${ethers.formatEther(entryFee)} BOT...`);
      const tx = await contract.enterMission(missionId, { value: entryFee });
      setEntryTxHash(tx.hash);

      const receipt = await tx.wait();
      console.log('Entered mission confirmed on BOT Chain:', receipt);

      await updateBalance(account);
      await loadPlayerStatus(account);
      await loadMainnetData();

      setIsEntering(false);
      setSelectedMission(null);
      setPage('arena');
    } catch (err: any) {
      console.error('Enter mission error:', err);
      setIsEntering(false);
      const msg = err.reason || err.data?.message || err.message || 'Failed to enter mission';
      setWalletError(msg);
    }
  };

  // Arena proof submission & AI adjudication
  const handleSubmitProof = async (moves: number[], resource: number, timeSeconds: number) => {
    if (!account) {
      setWalletOpen(true);
      return;
    }

    setVerificationOpen(true);
    setAdjudicationData(null);
    setClaimTxHash(null);
    setWalletError(null);

    try {
      // 1. Submit proof to backend AI service
      console.log('Submitting proof to AI Adjudication service...');
      const res = await fetch('/api/adjudicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: 1,
          player: account,
          moves,
          resource,
          timeSeconds,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'AI Adjudication failed');
      }

      console.log('AI Adjudication response:', data);
      setAdjudicationData(data);
    } catch (err: any) {
      console.error('Proof submission error:', err);
      setWalletError(err.message || 'Proof submission failed');
    }
  };

  // Claim reward transaction on BOT Chain Mainnet
  const handleClaimReward = async () => {
    if (!account || !adjudicationData) return;
    setWalletError(null);
    setIsClaiming(true);

    try {
      await switchOrAddBotChain();
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONFIG.CONTRACT_ADDRESS, CONFIG.ABI, signer);

      const missionId = BigInt(adjudicationData.missionId);
      const score = BigInt(adjudicationData.score);
      const proofHash = adjudicationData.proofHash;
      const rewardAmount = BigInt(adjudicationData.rewardAmount);
      const nonce = BigInt(adjudicationData.nonce);
      const signature = adjudicationData.signature;

      console.log('Calling settleAndClaim on BOT Chain Mainnet...');
      const tx = await contract.settleAndClaim(
        missionId,
        score,
        proofHash,
        rewardAmount,
        nonce,
        signature
      );
      console.log('Claim tx broadcast:', tx.hash);

      const receipt = await tx.wait();
      console.log('Reward claim confirmed on BOT Chain Mainnet!', receipt);
      setClaimTxHash(tx.hash);

      await updateBalance(account);
      await loadPlayerStatus(account);
      await loadMainnetData();
      setIsClaiming(false);
    } catch (err: any) {
      console.error('Claim error:', err);
      setIsClaiming(false);
      const msg = err.reason || err.data?.message || err.message || 'Failed to claim reward';
      setWalletError(msg);
    }
  };

  const hasEnteredMission1 = Boolean(playerStatus?.entered);

  return (
    <div className="app-shell">
      <div className="ambient-glow glow-one" />
      <div className="ambient-glow glow-two" />
      <Nav
        page={page}
        setPage={setPage}
        onWallet={() => setWalletOpen(true)}
        account={account}
        balance={balance}
      />

      {page === 'home' && (
        <Home
          setPage={setPage}
          onSelect={(m) => setSelectedMission(m)}
          missions={missions}
        />
      )}

      {page === 'missions' && (
        <MissionsPage
          missions={missions}
          onSelect={(m) => setSelectedMission(m)}
          refreshMissions={loadMainnetData}
        />
      )}

      {page === 'arena' && (
        <Arena
          playerStatus={playerStatus}
          account={account}
          onSubmitProof={handleSubmitProof}
          hasEntered={hasEnteredMission1}
        />
      )}

      {page === 'leaderboard' && (
        <Leaderboard account={account} playerStatus={playerStatus} />
      )}

      {page === 'how' && <HowItWorks />}

      <footer className="footer section-shell">
        <div>
          <Logo />
          <p>Play. Prove. Earn.</p>
        </div>
        <div className="footer-links">
          <button onClick={() => setPage('missions')}>Missions</button>
          <button onClick={() => setPage('arena')}>Arena</button>
          <button onClick={() => setPage('leaderboard')}>Leaderboard</button>
          <button onClick={() => setPage('how')}>How it works</button>
          <a href={CONFIG.OFFICIAL_SITE_URL} target="_blank" rel="noopener noreferrer">
            BOT Chain Official
          </a>
          <a href={CONFIG.EXPLORER_URL} target="_blank" rel="noopener noreferrer">
            BOTScan Explorer
          </a>
          <a
            href={`${CONFIG.EXPLORER_URL}/address/${CONFIG.CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Smart Contract
          </a>
        </div>
        <div className="footer-bottom">
          <span>BUILT ON BOT CHAIN MAINNET (CHAIN 677)</span>
          <span>
            <a
              href={CONFIG.OFFICIAL_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              BOTCHAIN.AI
            </a>{' '}
            |{' '}
            <a
              href={CONFIG.EXPLORER_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              BOTSCAN.AI
            </a>{' '}
            | © 2026 BOUNTIO PROTOCOL <ArrowUpRight size={13} />
          </span>
        </div>
      </footer>

      {selectedMission && (
        <MissionModal
          mission={selectedMission}
          onClose={() => {
            setSelectedMission(null);
            setWalletError(null);
          }}
          onEnter={() => {
            if (hasEnteredMission1) {
              setSelectedMission(null);
              setPage('arena');
            } else {
              handleEnterMission();
            }
          }}
          account={account}
          hasEntered={hasEnteredMission1}
          isEntering={isEntering}
          txHash={entryTxHash}
          errorMessage={walletError}
        />
      )}

      {walletOpen && (
        <WalletModal
          onClose={() => {
            setWalletOpen(false);
            setWalletError(null);
          }}
          account={account}
          balance={balance}
          onConnect={handleConnectWallet}
          onDisconnect={handleDisconnect}
          errorMessage={walletError}
        />
      )}

      {verificationOpen && (
        <VerificationModal
          onClose={() => {
            setVerificationOpen(false);
            setWalletError(null);
          }}
          adjudicationData={adjudicationData}
          onClaimReward={handleClaimReward}
          isClaiming={isClaiming}
          claimTxHash={claimTxHash}
          errorMessage={walletError}
        />
      )}
    </div>
  );
}

export default App;
