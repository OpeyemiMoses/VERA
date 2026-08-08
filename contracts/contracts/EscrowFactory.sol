// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Escrow.sol";

/**
 * @title EscrowFactory
 * @notice Factory for deploying Compliant Escrow contract instances with configured fee recipient treasury wallet.
 */
contract EscrowFactory {
    address public immutable complianceAttestor;
    address public feeRecipient;                  // Treasury/Owner wallet receiving platform fees
    uint256 public defaultFeeBps = 150;           // Default 1.5% platform fee (150 bps)
    address[] public deployedEscrows;

    event EscrowCreated(
        address indexed escrowAddress,
        address indexed client,
        address indexed token,
        uint256 amount,
        address feeRecipient,
        uint256 feeBps
    );
    event FeeRecipientUpdated(address indexed newFeeRecipient);

    constructor(address _complianceAttestor) {
        require(_complianceAttestor != address(0), "Invalid attestor address");
        complianceAttestor = _complianceAttestor;
        feeRecipient = _complianceAttestor;       // Default fee recipient is attestor / owner wallet
    }

    /**
     * @notice Owner/Attestor updates the treasury wallet address receiving platform fees
     */
    function setFeeRecipient(address _newFeeRecipient) external {
        require(msg.sender == complianceAttestor, "Only compliance attestor can update fee recipient");
        require(_newFeeRecipient != address(0), "Invalid fee recipient address");
        feeRecipient = _newFeeRecipient;
        emit FeeRecipientUpdated(_newFeeRecipient);
    }

    /**
     * @notice Deploy a new Escrow instance
     * @param token Address of ERC20/A-Token
     * @param amount Funding amount
     */
    function createEscrow(address token, uint256 amount) external returns (address escrowAddress) {
        return createEscrowWithFee(token, amount, defaultFeeBps);
    }

    /**
     * @notice Deploy a new Escrow instance with custom fee rate
     * @param token Address of ERC20/A-Token
     * @param amount Funding amount
     * @param feeBps Custom fee in basis points (e.g. 150 = 1.5%)
     */
    function createEscrowWithFee(
        address token,
        uint256 amount,
        uint256 feeBps
    ) public returns (address escrowAddress) {
        Escrow newEscrow = new Escrow(
            msg.sender,
            token,
            amount,
            complianceAttestor,
            feeRecipient,
            feeBps
        );
        escrowAddress = address(newEscrow);
        deployedEscrows.push(escrowAddress);

        emit EscrowCreated(escrowAddress, msg.sender, token, amount, feeRecipient, feeBps);
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
