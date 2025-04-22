window.addEventListener("load", async () => {
    if (typeof window.ethereum !== "undefined") {
        console.log("MetaMask detected!");

        const web3 = new Web3(window.ethereum);

        document.getElementById("connectWallet").addEventListener("click", async () => {
            try {
                const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
                document.getElementById("walletAddress").innerText = `Connected: ${accounts[0]}`;
            } catch (error) {
                console.error("User denied account access", error);
            }
        });
    } else {
        console.log("MetaMask is not installed.");
    }
});
