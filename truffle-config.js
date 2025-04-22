module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",  
      port: 7545,  // Change this back to 7545
      network_id: "5777",  // This matches Ganache’s default network
    }
  },
  compilers: {
    solc: {
      version: "0.8.20",  // Use the correct Solidity version
    }
  }
};
