const Migrations = artifacts.require("Migrations");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Migrations, {
    from: accounts[0],
    gas: 6721975 // Match config
  }).catch(err => console.log("DEPLOY ERROR:", err));
};