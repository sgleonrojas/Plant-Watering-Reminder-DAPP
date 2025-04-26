module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 1337, // Must match Ganache's network ID exactly
      gas: 6721975, // Match Ganache's gas limit
      gasPrice: 20000000000, // 20 Gwei (matches Ganache log)
      skipDryRun: true, // Bypass verification
      confirmations: 0 // No confirmations needed
    }
  },
  compilers: {
    solc: {
      version: "0.8.13",
      settings: {
        optimizer: {
          enabled: false, // Disable for initial migrations
          runs: 200
      }
     }
    }
  }
};