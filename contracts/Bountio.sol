// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Bountio - Competitive Missions Protocol on BOT Chain Mainnet
/// @notice Verifiable off-chain skill challenges settled on-chain via cryptographic proofs and AI adjudication.
contract Bountio {
    // --- Custom Errors (Gas Optimized) ---
    error Unauthorized();
    error ContractPaused();
    error InvalidAddress();
    error InvalidParameters();
    error MissionDoesNotExist();
    error MissionAlreadyExists();
    error MissionNotOpen();
    error MissionNotStarted();
    error MissionEnded();
    error MissionFull();
    error IncorrectEntryFee();
    error AlreadyEntered();
    error NotEntered();
    error ProofAlreadyUsed();
    error ResultAlreadyVerified();
    error ResultNotVerified();
    error RewardAlreadyClaimed();
    error RewardExceedsPool();
    error InvalidSignature();
    error TransferFailed();
    error ReentrancyGuardLocked();

    // --- Packed Storage Structs ---
    // Slot 1 (32 bytes): entryFee (12B) + rewardPool (12B) + maxPlayers (4B) + currentPlayers (4B)
    // Slot 2 (18 bytes): startTime (8B) + endTime (8B) + status (1B) + exists (1B)
    // Slot 3 (32 bytes): rulesHash (32B)
    struct Mission {
        uint96 entryFee;        // Native BOT entry fee (wei)
        uint96 rewardPool;      // Current reward pool available (wei)
        uint32 maxPlayers;      // Maximum capacity
        uint32 currentPlayers;  // Current entered count
        uint64 startTime;       // Start timestamp
        uint64 endTime;         // End timestamp
        uint8 status;           // 0: INACTIVE, 1: OPEN, 2: CLOSED
        bool exists;            // Existence flag
        bytes32 rulesHash;      // Off-chain content/rules commitment
    }

    // Slot 1 (22 bytes): score (8B) + rewardAmount (12B) + verified (1B) + claimed (1B)
    // Slot 2 (32 bytes): proofHash (32B)
    struct VerifiedOutcome {
        uint64 score;
        uint96 rewardAmount;
        bool verified;
        bool claimed;
        bytes32 proofHash;
    }

    // --- State Variables ---
    address public owner;
    address public adjudicator;
    bool public paused;
    uint256 private _locked = 1;

    // --- EIP-712 Typed Data ---
    bytes32 public immutable DOMAIN_SEPARATOR;
    bytes32 public constant ADJUDICATION_TYPEHASH = keccak256(
        "AdjudicationResult(uint256 missionId,address player,uint64 score,bytes32 proofHash,uint96 rewardAmount,uint256 nonce)"
    );

    // --- Mappings ---
    mapping(uint256 => Mission) public missions;
    mapping(uint256 => mapping(address => bool)) public hasEntered;
    mapping(uint256 => mapping(address => bytes32)) public submittedProofs;
    mapping(uint256 => mapping(address => VerifiedOutcome)) public outcomes;
    mapping(bytes32 => bool) public usedProofHashes;
    mapping(address => uint256) public playerNonces;

    // --- Events ---
    event MissionCreated(uint256 indexed missionId, uint96 entryFee, uint96 initialPool, uint32 maxPlayers, uint64 startTime, uint64 endTime, bytes32 rulesHash);
    event MissionStatusUpdated(uint256 indexed missionId, uint8 status);
    event MissionEntered(uint256 indexed missionId, address indexed player, uint256 amount);
    event ProofSubmitted(uint256 indexed missionId, address indexed player, bytes32 indexed proofHash);
    event ResultVerified(uint256 indexed missionId, address indexed player, uint64 score, bytes32 proofHash, uint96 rewardAmount);
    event RewardClaimed(uint256 indexed missionId, address indexed player, uint96 amount);
    event PoolFunded(uint256 indexed missionId, uint96 amount);
    event AdjudicatorUpdated(address indexed oldAdjudicator, address indexed newAdjudicator);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event PauseToggled(bool isPaused);

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier nonReentrant() {
        if (_locked == 2) revert ReentrancyGuardLocked();
        _locked = 2;
        _;
        _locked = 1;
    }

    constructor(address _adjudicator) {
        if (_adjudicator == address(0)) revert InvalidAddress();
        owner = msg.sender;
        adjudicator = _adjudicator;

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes("Bountio")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );

        emit AdjudicatorUpdated(address(0), _adjudicator);
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // --- Admin Configuration ---
    function setAdjudicator(address _newAdjudicator) external onlyOwner {
        if (_newAdjudicator == address(0)) revert InvalidAddress();
        address old = adjudicator;
        adjudicator = _newAdjudicator;
        emit AdjudicatorUpdated(old, _newAdjudicator);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert InvalidAddress();
        address old = owner;
        owner = _newOwner;
        emit OwnershipTransferred(old, _newOwner);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit PauseToggled(_paused);
    }

    // --- Mission Management ---
    function createMission(
        uint256 missionId,
        uint96 entryFee,
        uint32 maxPlayers,
        uint64 startTime,
        uint64 endTime,
        bytes32 rulesHash
    ) external payable onlyOwner {
        if (missions[missionId].exists) revert MissionAlreadyExists();
        if (maxPlayers == 0 || endTime <= startTime) revert InvalidParameters();

        missions[missionId] = Mission({
            entryFee: entryFee,
            rewardPool: uint96(msg.value),
            maxPlayers: maxPlayers,
            currentPlayers: 0,
            startTime: startTime,
            endTime: endTime,
            status: 1, // OPEN
            exists: true,
            rulesHash: rulesHash
        });

        emit MissionCreated(missionId, entryFee, uint96(msg.value), maxPlayers, startTime, endTime, rulesHash);
    }

    function setMissionStatus(uint256 missionId, uint8 newStatus) external onlyOwner {
        if (!missions[missionId].exists) revert MissionDoesNotExist();
        missions[missionId].status = newStatus;
        emit MissionStatusUpdated(missionId, newStatus);
    }

    function fundRewardPool(uint256 missionId) external payable {
        Mission storage m = missions[missionId];
        if (!m.exists) revert MissionDoesNotExist();
        m.rewardPool += uint96(msg.value);
        emit PoolFunded(missionId, uint96(msg.value));
    }

    // --- Mission Entry ---
    function enterMission(uint256 missionId) external payable nonReentrant {
        if (paused) revert ContractPaused();
        Mission storage m = missions[missionId];
        if (!m.exists) revert MissionDoesNotExist();
        if (m.status != 1) revert MissionNotOpen();
        if (block.timestamp < m.startTime) revert MissionNotStarted();
        if (block.timestamp > m.endTime) revert MissionEnded();
        if (m.currentPlayers >= m.maxPlayers) revert MissionFull();
        if (msg.value != m.entryFee) revert IncorrectEntryFee();
        if (hasEntered[missionId][msg.sender]) revert AlreadyEntered();

        hasEntered[missionId][msg.sender] = true;
        m.currentPlayers++;
        m.rewardPool += uint96(msg.value);

        emit MissionEntered(missionId, msg.sender, msg.value);
    }

    // --- Proof Submission ---
    function submitProof(uint256 missionId, bytes32 proofHash) external {
        if (paused) revert ContractPaused();
        if (!missions[missionId].exists) revert MissionDoesNotExist();
        if (!hasEntered[missionId][msg.sender]) revert NotEntered();
        if (proofHash == bytes32(0)) revert InvalidParameters();

        submittedProofs[missionId][msg.sender] = proofHash;
        emit ProofSubmitted(missionId, msg.sender, proofHash);
    }

    // --- Result Verification & Claim ---
    function verifyResult(
        uint256 missionId,
        address player,
        uint64 score,
        bytes32 proofHash,
        uint96 rewardAmount,
        uint256 nonce,
        bytes calldata signature
    ) external nonReentrant {
        _verifyResultInternal(missionId, player, score, proofHash, rewardAmount, nonce, signature);
    }

    /// @notice Atomic verification + immediate reward claim in a single gas-efficient transaction.
    function settleAndClaim(
        uint256 missionId,
        uint64 score,
        bytes32 proofHash,
        uint96 rewardAmount,
        uint256 nonce,
        bytes calldata signature
    ) external nonReentrant {
        _verifyResultInternal(missionId, msg.sender, score, proofHash, rewardAmount, nonce, signature);
        _claimRewardInternal(missionId, msg.sender);
    }

    function claimReward(uint256 missionId) external nonReentrant {
        if (paused) revert ContractPaused();
        _claimRewardInternal(missionId, msg.sender);
    }

    // --- Internal Logic ---
    function _verifyResultInternal(
        uint256 missionId,
        address player,
        uint64 score,
        bytes32 proofHash,
        uint96 rewardAmount,
        uint256 nonce,
        bytes calldata signature
    ) internal {
        if (paused) revert ContractPaused();
        Mission storage m = missions[missionId];
        if (!m.exists) revert MissionDoesNotExist();
        if (!hasEntered[missionId][player]) revert NotEntered();
        if (outcomes[missionId][player].verified) revert ResultAlreadyVerified();
        if (usedProofHashes[proofHash]) revert ProofAlreadyUsed();
        if (rewardAmount > m.rewardPool) revert RewardExceedsPool();
        if (nonce != playerNonces[player]) revert InvalidParameters();

        // EIP-712 Signature Verification
        bytes32 structHash = keccak256(
            abi.encode(
                ADJUDICATION_TYPEHASH,
                missionId,
                player,
                score,
                proofHash,
                rewardAmount,
                nonce
            )
        );
        bytes32 digest = keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));

        if (!_isValidSignature(digest, signature, adjudicator)) {
            revert InvalidSignature();
        }

        // State updates
        playerNonces[player]++;
        usedProofHashes[proofHash] = true;
        m.rewardPool -= rewardAmount;

        outcomes[missionId][player] = VerifiedOutcome({
            score: score,
            rewardAmount: rewardAmount,
            verified: true,
            claimed: false,
            proofHash: proofHash
        });

        emit ResultVerified(missionId, player, score, proofHash, rewardAmount);
    }

    function _claimRewardInternal(uint256 missionId, address player) internal {
        VerifiedOutcome storage outcome = outcomes[missionId][player];
        if (!outcome.verified) revert ResultNotVerified();
        if (outcome.claimed) revert RewardAlreadyClaimed();
        uint96 reward = outcome.rewardAmount;

        outcome.claimed = true;

        if (reward > 0) {
            (bool success, ) = player.call{value: reward}("");
            if (!success) revert TransferFailed();
        }

        emit RewardClaimed(missionId, player, reward);
    }

    function _isValidSignature(bytes32 digest, bytes calldata sig, address expectedSigner) internal pure returns (bool) {
        if (sig.length != 65) return false;
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        if (uint256(s) > 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
            return false;
        }
        if (v < 27) {
            v += 27;
        }
        if (v != 27 && v != 28) {
            return false;
        }
        return ecrecover(digest, v, r, s) == expectedSigner;
    }

    // --- Read-Only Aggregates for Frontend Optimization ---
    function getMission(uint256 missionId) external view returns (Mission memory) {
        return missions[missionId];
    }

    function getPlayerStatus(uint256 missionId, address player) external view returns (
        bool entered,
        bytes32 proof,
        bool verified,
        bool claimed,
        uint64 score,
        uint96 rewardAmount,
        uint256 currentNonce
    ) {
        entered = hasEntered[missionId][player];
        proof = submittedProofs[missionId][player];
        VerifiedOutcome memory o = outcomes[missionId][player];
        verified = o.verified;
        claimed = o.claimed;
        score = o.score;
        rewardAmount = o.rewardAmount;
        currentNonce = playerNonces[player];
    }
}
