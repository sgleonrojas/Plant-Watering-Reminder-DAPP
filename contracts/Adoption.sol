pragma solidity ^0.5.0;

contract Adoption {
address[16] public adopters;
address[16] public plants;
// Adopting a pet
function adopt(uint petId) public returns (uint) {
  require(petId >= 0 && petId <= 16);

  adopters[petId] = msg.sender;

  return petId;
}

function handleSubmit(uint plantId) public returns (uint) {
  require(plantId >= 0 && plantId <= 16);

  plants[plantId] = msg.sender;

  return plantId;
}

function getplants() public view returns (address[16] memory) {
  
  return plants;
}
// Retrieving the adopters
function getAdopters() public view returns (address[16] memory) {
  
  return adopters;
}


}