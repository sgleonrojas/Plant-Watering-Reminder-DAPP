const Wallet = {
    web3: null,
    account: null,
  
    connect: async function() {
      if (window.ethereum) {
        Wallet.web3 = new Web3(window.ethereum);
        try {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          Wallet.account = accounts[0];
          document.getElementById("walletAddress").innerText = `Connected: ${Wallet.account}`;
          return Wallet.account;
        } catch (error) {
          console.error("User denied account access", error);
        }
      } else {
        alert("MetaMask is not installed!");
      }
    },
  
    getAccount: async function() {
      if (!Wallet.account) {
        const accounts = await Wallet.web3.eth.getAccounts();
        Wallet.account = accounts[0];
      }
      return Wallet.account;
    }
  };
  
  window.Wallet = Wallet;
  