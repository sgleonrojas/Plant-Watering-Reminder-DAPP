// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PlantToken is ERC20 {
    address public owner;
    mapping(uint => uint) public plantRewards; // Plant ID => Reward Amount

    constructor() ERC20("Plant Token", "PLT") {
        owner = msg.sender;
        // Set initial rewards for each plant
        plantRewards[0] = 10; // Reward for plant 0
        plantRewards[1] = 20; // Reward for plant 1
        plantRewards[2] = 30; // Reward for plant 2
        // ... Continue for other plants as needed
    }

    function setPlantReward(uint plantId, uint rewardAmount) external {
        require(msg.sender == owner, "Only owner can set rewards");
        plantRewards[plantId] = rewardAmount;
    }

    function rewardUser(address user, uint plantId) external {
        require(plantRewards[plantId] > 0, "Invalid plant ID");
        _mint(user, plantRewards[plantId] * 1e18); // Mint tokens based on plant type
    }
}
