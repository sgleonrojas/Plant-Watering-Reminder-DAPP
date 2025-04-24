module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 5777, // Must match Ganache's network ID exactly
      gas: 6721975, // Match Ganache's gas limit
      gasPrice: 20000000000 // 20 Gwei (matches Ganache log)
    }
  },
  compilers: {
    solc: {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};