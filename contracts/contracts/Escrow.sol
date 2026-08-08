// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title Escrow
 * @notice Identity-Gated Escrow contract requiring Cleanverse Attestation to accept jobs & automatically routing platform fees to the Protocol Treasury wallet.
 */
contract Escrow is ReentrancyGuard {
    using ECDSA for bytes32;

    enum State { Created, Funded, Accepted, Completed, Disputed, Resolved, Cancelled }

    address public immutable factory;
    address public immutable client;
    address public immutable complianceAttestor; // Protocol backend key verifying Cleanverse API
    address public immutable feeRecipient;        // Protocol Treasury / Owner wallet receiving platform fees
    uint256 public immutable feeBps;              // Platform fee in basis points (e.g., 150 = 1.5%)
    IERC20 public immutable token;
    uint256 public immutable amount;

    address public freelancer;
    State public state;

    event EscrowFunded(address indexed client, uint256 amount);
    event EscrowAccepted(address indexed freelancer);
    event EscrowReleased(address indexed freelancer, uint256 payoutAmount, uint256 feeAmount);
    event EscrowDisputed(address indexed triggeredBy);
    event EscrowResolved(address indexed winner, uint256 amount);
    event EscrowCancelled();

    modifier onlyClient() {
        require(msg.sender == client, "Only client can invoke");
        _;
    }

    modifier inState(State _state) {
        require(state == _state, "Invalid escrow state for operation");
        _;
    }

    constructor(
        address _client,
        address _token,
        uint256 _amount,
        address _attestor,
        address _feeRecipient,
        uint256 _feeBps
    ) {
        require(_client != address(0), "Invalid client address");
        require(_token != address(0), "Invalid token address");
        require(_attestor != address(0), "Invalid attestor address");
        require(_amount > 0, "Amount must be greater than zero");
        require(_feeBps <= 1000, "Fee cannot exceed 10%");

        factory = msg.sender;
        client = _client;
        token = IERC20(_token);
        amount = _amount;
        complianceAttestor = _attestor;
        feeRecipient = _feeRecipient;
        feeBps = _feeBps;
        state = State.Created;
    }

    /**
     * @notice Client deposits tokens to fund the escrow
     */
    function fund() external onlyClient inState(State.Created) nonReentrant {
        state = State.Funded;
        require(token.transferFrom(msg.sender, address(this), amount), "Token funding transfer failed");
        emit EscrowFunded(msg.sender, amount);
    }

    /**
     * @notice Freelancer accepts job using Cleanverse Attestation Signature
     * @param signature Cryptographic attestation issued by backend after Cleanverse verification
     * @param deadline Timestamp limit for signature validity
     */
    function acceptWithAttestation(
        bytes memory signature,
        uint256 deadline
    ) external inState(State.Funded) nonReentrant {
        require(block.timestamp <= deadline, "Attestation signature expired");

        bytes32 messageHash = keccak256(
            abi.encodePacked(address(this), msg.sender, deadline)
        );
        bytes32 ethSignedHash = MessageHashUtils.toEthSignedMessageHash(messageHash);

        address recoveredSigner = ethSignedHash.recover(signature);
        require(recoveredSigner == complianceAttestor, "Invalid compliance attestation signature");

        freelancer = msg.sender;
        state = State.Accepted;
        emit EscrowAccepted(msg.sender);
    }

    /**
     * @notice Releases funds to the freelancer upon successful work confirmation, routing platform fees to feeRecipient wallet.
     */
    function release() external nonReentrant {
        require(msg.sender == client || msg.sender == freelancer, "Unauthorized caller");
        require(state == State.Accepted, "Escrow is not in Accepted state");

        uint256 feeAmount = (amount * feeBps) / 10000;
        uint256 payoutAmount = amount - feeAmount;

        state = State.Completed;

        // Route platform fee to owner/treasury wallet
        if (feeAmount > 0 && feeRecipient != address(0)) {
            require(token.transfer(feeRecipient, feeAmount), "Fee transfer failed");
        }

        // Payout net balance to seller/freelancer
        require(token.transfer(freelancer, payoutAmount), "Release payout transfer failed");

        emit EscrowReleased(freelancer, payoutAmount, feeAmount);
    }

    /**
     * @notice Triggers dispute, locking state for resolution
     */
    function dispute() external inState(State.Accepted) {
        require(msg.sender == client || msg.sender == freelancer, "Unauthorized caller");
        state = State.Disputed;
        emit EscrowDisputed(msg.sender);
    }

    /**
     * @notice Arbitrator/Client resolves dispute and assigns winner
     * @param winner Address to receive escrow funds
     */
    function resolve(address winner) external nonReentrant inState(State.Disputed) {
        require(msg.sender == client || msg.sender == complianceAttestor, "Only arbitrator/client can resolve");
        require(winner == client || winner == freelancer, "Winner must be client or freelancer");

        state = State.Resolved;
        require(token.transfer(winner, amount), "Resolution transfer failed");
        emit EscrowResolved(winner, amount);
    }

    /**
     * @notice Refund client if job was never accepted
     */
    function cancel() external onlyClient inState(State.Funded) nonReentrant {
        state = State.Cancelled;
        require(token.transfer(client, amount), "Refund transfer failed");
        emit EscrowCancelled();
    }
}
