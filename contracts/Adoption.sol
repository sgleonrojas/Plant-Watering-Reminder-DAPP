// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PlantToken.sol"; // Import PlantToken contract

contract Adoption {
    address[16] public adopters;
    address[16] public plants;

    PlantToken public plantToken; // Declare a PlantToken instance

    // Constructor to accept the PlantToken contract address
    constructor(address _plantTokenAddress) {
        plantToken = PlantToken(_plantTokenAddress); // Initialize the PlantToken instance
    }

    // Function to reward user for watering a plant
    function waterPlant(uint256 plantId) external {
        require(plantId >= 0 && plantId < 16, "Invalid plant ID");
        
        // Call the rewardUser function from the PlantToken contract
        plantToken.rewardUser(msg.sender, plantId);
    }

    // Function to adopt a pet
    function adopt(uint256 petId) public returns (uint256) {
        require(petId >= 0 && petId < 16, "Invalid pet ID");
        adopters[petId] = msg.sender;
        return petId;
    }

    // Function to submit a plant interaction
    function handleSubmit(uint256 plantId) public returns (uint256) {
        require(plantId >= 0 && plantId < 16, "Invalid plant ID");
        plants[plantId] = msg.sender;
        return plantId;
    }

    // Function to retrieve all plants
    function getPlants() public view returns (address[16] memory) {
        return plants;
    }

    // Function to retrieve all adopters
    function getAdopters() public view returns (address[16] memory) {
        return adopters;
    }
}
