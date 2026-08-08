// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Escrow.sol";

/**
 * @title EscrowFactory
 * @notice Factory for deploying Compliant Escrow contract instances.
 */
contract EscrowFactory {
    address public immutable complianceAttestor;
    address[] public deployedEscrows;

    event EscrowCreated(
        address indexed escrowAddress,
        address indexed client,
        address indexed token,
        uint256 amount
    );

    constructor(address _complianceAttestor) {
        require(_complianceAttestor != address(0), "Invalid attestor address");
        complianceAttestor = _complianceAttestor;
    }

    /**
     * @notice Deploy a new Escrow instance
     * @param token Address of ERC20/A-Token
     * @param amount Funding amount
     */
    function createEscrow(address token, uint256 amount) external returns (address escrowAddress) {
        Escrow newEscrow = new Escrow(msg.sender, token, amount, complianceAttestor);
        escrowAddress = address(newEscrow);
        deployedEscrows.push(escrowAddress);

        emit EscrowCreated(escrowAddress, msg.sender, token, amount);
    }

    /**
     * @notice Get list of all deployed escrows
     */
    function getDeployedEscrows() external view returns (address[] memory) {
        return deployedEscrows;
    }

    /**
     * @notice Total count of deployed escrows
     */
    function getDeployedEscrowsCount() external view returns (uint256) {
        return deployedEscrows.length;
    }
}
