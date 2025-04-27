module.exports = {
  networks: {
    development: {
<<<<<<< HEAD
      host: "127.0.0.1",
      port: 7545,
      network_id: 1337, // Must match Ganache's network ID exactly
      gas: 6721975, // Match Ganache's gas limit
      gasPrice: 20000000000, // 20 Gwei (matches Ganache log)
      skipDryRun: true, // Bypass verification
      confirmations: 0 // No confirmations needed
=======
      host: "127.0.0.1",  
      port: 7545,  // Change this back to 7545
      network_id: "5777",  // This matches Ganache’s default network
>>>>>>> a04412d (chore: update Truffle configuration for Ganache compatibility and set Solidity version)
    }
  },
  compilers: {
    solc: {
<<<<<<< HEAD
      version: "0.8.13",
      settings: {
        optimizer: {
          enabled: false, // Disable for initial migrations
          runs: 200
      }
     }
=======
      version: "0.8.20",  // Use the correct Solidity version
>>>>>>> a04412d (chore: update Truffle configuration for Ganache compatibility and set Solidity version)
    }
  }
};