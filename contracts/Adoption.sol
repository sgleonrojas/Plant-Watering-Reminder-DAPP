// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./PlantToken.sol"; // Import PlantToken contract
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Adoption is ReentrancyGuard, Pausable, Ownable {
    address[16] public adopters;
    address[16] public plants;
    PlantToken public plantToken;

    uint256 public constant MAX_PLANTS = 16;
    uint256 public wateringCooldown = 24 hours;
    mapping(address => uint256) public lastWateringTime;
    mapping(uint256 => bool) public plantExists;

    event PlantAdopted(address indexed adopter, uint256 indexed plantId);
    event PlantWatered(address indexed user, uint256 indexed plantId);
    event PlantSubmitted(address indexed user, uint256 indexed plantId);

    error InvalidPlantId(uint256 plantId);
    error WateringCooldownNotElapsed(uint256 remainingTime);
    error PlantAlreadyExists(uint256 plantId);
    error PlantDoesNotExist(uint256 plantId);

    constructor(address _plantTokenAddress) Ownable() {
        require(_plantTokenAddress != address(0), "Invalid PlantToken address");
        plantToken = PlantToken(_plantTokenAddress);
    }

    modifier validPlantId(uint256 plantId) {
        if (plantId >= MAX_PLANTS) revert InvalidPlantId(plantId);
        _;
    }

    function waterPlant(
        uint256 plantId
    ) external nonReentrant whenNotPaused validPlantId(plantId) {
        if (!plantExists[plantId]) revert PlantDoesNotExist(plantId);

        uint256 lastWatering = lastWateringTime[msg.sender];
        if (block.timestamp < lastWatering + wateringCooldown) {
            revert WateringCooldownNotElapsed(
                (lastWatering + wateringCooldown) - block.timestamp
            );
        }

        lastWateringTime[msg.sender] = block.timestamp;
        plantToken.rewardUser(msg.sender, plantId);

        emit PlantWatered(msg.sender, plantId);
    }

    function registerPlant(
        uint256 plantId
    ) external whenNotPaused nonReentrant validPlantId(plantId) {
        if (plantExists[plantId]) revert PlantAlreadyExists(plantId);

        plantExists[plantId] = true;
        plants[plantId] = msg.sender;

        emit PlantSubmitted(msg.sender, plantId);
    }

    function adopt(
        uint256 plantId
    ) external whenNotPaused nonReentrant validPlantId(plantId) {
        if (plantExists[plantId]) revert PlantAlreadyExists(plantId);

        adopters[plantId] = msg.sender;
        plantExists[plantId] = true;

        emit PlantAdopted(msg.sender, plantId);
    }

    function getPlants() public view returns (address[16] memory) {
        return plants;
    }

    function getAdopters() public view returns (address[16] memory) {
        return adopters;
    }

    function setWateringCooldown(uint256 newCooldown) external onlyOwner {
        require(newCooldown > 0, "Cooldown must be positive");
        wateringCooldown = newCooldown;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
