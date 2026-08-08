// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockAToken
 * @notice Standard ERC20 token representing Cleanverse A-Tokens for testnet escrow funding.
 *         Includes a public faucet with a 24-hour per-wallet cooldown.
 */
contract MockAToken is ERC20, Ownable {
    uint256 public constant FAUCET_AMOUNT  = 10_000 * 10 ** 18; // 10,000 cATKN
    uint256 public constant FAUCET_COOLDOWN = 24 hours;

    mapping(address => uint256) public lastFaucetClaim;

    event FaucetClaimed(address indexed recipient, uint256 amount);

    constructor(string memory name, string memory symbol)
        ERC20(name, symbol)
        Ownable(msg.sender)
    {
        _mint(msg.sender, 1_000_000 * 10 ** decimals());
    }

    /// @notice Owner-only mint for seeding / test wallets
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Public faucet — any wallet can claim 10,000 cATKN once every 24 h
    function faucet() external {
        require(
            block.timestamp >= lastFaucetClaim[msg.sender] + FAUCET_COOLDOWN,
            "Faucet: cooldown not elapsed (24h)"
        );
        lastFaucetClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    /// @notice Returns seconds until the caller can claim again (0 = ready now)
    function timeUntilNextClaim(address wallet) external view returns (uint256) {
        uint256 next = lastFaucetClaim[wallet] + FAUCET_COOLDOWN;
        if (block.timestamp >= next) return 0;
        return next - block.timestamp;
    }
}
