const PlantToken = artifacts.require("PlantToken");
const Adoption = artifacts.require("Adoption");

module.exports = async function (deployer) {
    // Deploy PlantToken first
    await deployer.deploy(PlantToken);
    const plantTokenInstance = await PlantToken.deployed(); // Get the instance of the deployed PlantToken
    // Deploy Adoption with the PlantToken address
    await deployer.deploy(Adoption, plantTokenInstance.address);
};
