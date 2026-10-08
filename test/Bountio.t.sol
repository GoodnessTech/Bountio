// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../contracts/Bountio.sol";

contract BountioTest {
    Bountio public bountio;
    address public owner;
    address public adjudicator;
    address public player1;
    address public player2;

    uint256 internal adjudicatorPk = 0xA11CE;
    bytes32 internal constant RULES_HASH = keccak256("MISSION_001_RULES");

    function setUp() public {
        owner = address(this);
        adjudicator = vmAddr(adjudicatorPk);
        player1 = address(0x1111);
        player2 = address(0x2222);

        bountio = new Bountio(adjudicator);
    }

    function vmAddr(uint256 pk) internal pure returns (address) {
        // Mock helper for address calculation in Foundry
        return address(uint160(uint256(keccak256(abi.encodePacked(pk)))));
    }
}
