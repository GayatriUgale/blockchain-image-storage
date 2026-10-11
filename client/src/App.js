
import Upload from "./artifacts/contracts/Upload.sol/Upload.json";
import "./App.css";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import FileUpload from "./components/FileUpload";
import Display from "./components/Display.js";
import Modal from "./components/Modal.js";

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const contractAddress =
    "0xbEe55697922861dB64517647D66aEAd8d0a89E74";

  // Load the wallet only when an account is already available.
  const loadWallet = useCallback(async (address) => {
    if (!window.ethereum || !address) {
      setAccount("");
      setContract(null);
      setProvider(null);
      return;
    }

    try {
      const web3Provider = new ethers.providers.Web3Provider(
        window.ethereum
      );

      const signer = web3Provider.getSigner(address);

      const uploadContract = new ethers.Contract(
        contractAddress,
        Upload.abi,
        signer
      );

      setAccount(address);
      setProvider(web3Provider);
      setContract(uploadContract);
    } catch (error) {
      console.error("Unable to load wallet:", error);
      setAccount("");
      setContract(null);
      setProvider(null);
    }
  }, []);

  // Connect only after the user clicks the button.
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install the MetaMask extension.");
      return;
    }

    setIsConnecting(true);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        await loadWallet(accounts[0]);
      }
    } catch (error) {
      console.error("MetaMask connection failed:", error);

      if (error.code === 4001) {
        alert("Connection request was rejected in MetaMask.");
      } else {
        alert("Could not connect to MetaMask. Please try again.");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    if (!window.ethereum) {
      console.error("MetaMask is not installed.");
      return;
    }

    let active = true;

    // Check existing permission without opening a connection prompt.
    const checkAccounts = async () => {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (!active) return;

        if (accounts.length > 0) {
          await loadWallet(accounts[0]);
        } else {
          setAccount("");
          setContract(null);
          setProvider(null);
        }
      } catch (error) {
        console.error("Unable to check MetaMask accounts:", error);
      }
    };

    const handleAccountsChanged = (accounts) => {
      if (!active) return;

      if (accounts.length > 0) {
        loadWallet(accounts[0]);
      } else {
        setAccount("");
        setContract(null);
        setProvider(null);
      }
    };

    const handleChainChanged = () => {
      // Reload provider and contract for the currently selected account.
      checkAccounts();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    checkAccounts();

    return () => {
      active = false;
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
      window.ethereum.removeListener(
        "chainChanged",
        handleChainChanged
      );
    };
  }, [loadWallet]);

  return (
    <div className="App">
      <h1 className="main_heading" style={{ color: "#23466B" }}>
        Decentralized file storage System
      </h1>

      <div className="text_account">
        {account ? (
          <p style={{ color: "#23466B" }}>
            Account: {account}
          </p>
        ) : (
          <div>
            <p style={{ color: "#23466B" }}>
              Please connect to MetaMask
            </p>

            <button
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting
                ? "Connecting..."
                : "Connect MetaMask"}
            </button>
          </div>
        )}
      </div>

      <FileUpload
        account={account}
        provider={provider}
        contract={contract}
      />

      <Display
        contract={contract}
        account={account}
      />

      <Modal
        contract={contract}
        account={account}
      />
    </div>
  );
}

export default App;
