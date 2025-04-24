// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract PlantToken is ERC20, Ownable, ReentrancyGuard, Pausable {
    uint256 public constant REWARD_AMOUNT = 10 * 10 ** 18; // 10 tokens
    uint256 public rewardCooldown = 24 hours;
    mapping(address => uint256) public lastRewardTime;
    mapping(uint256 => bool) public rewardSet;

    event RewardClaimed(
        address indexed user,
        uint256 indexed plantId,
        uint256 amount
    );
    event RewardSetForPlant(uint256 indexed plantId);

    error NoRewardSet(uint256 plantId);
    error RewardCooldownNotElapsed(uint256 remainingTime);
    error InvalidAddress();

    constructor() ERC20("Plant Token", "PLT") Ownable() {
        _mint(msg.sender, 1000000 * 10 ** 18); // Mint 1 million tokens to deployer
    }

    function rewardUser(
        address user,
        uint256 plantId
    ) external whenNotPaused nonReentrant {
        if (user == address(0)) revert InvalidAddress();
        if (!rewardSet[plantId]) revert NoRewardSet(plantId);

        uint256 lastReward = lastRewardTime[user];
        if (block.timestamp < lastReward + rewardCooldown) {
            revert RewardCooldownNotElapsed(
                (lastReward + rewardCooldown) - block.timestamp
            );
        }

        lastRewardTime[user] = block.timestamp;
        _mint(user, REWARD_AMOUNT);

        emit RewardClaimed(user, plantId, REWARD_AMOUNT);
    }

    function setRewardForPlant(uint256 plantId) external onlyOwner {
        rewardSet[plantId] = true;
        emit RewardSetForPlant(plantId);
    }

    function setRewardCooldown(uint256 newCooldown) external onlyOwner {
        rewardCooldown = newCooldown;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
