import Upload from "./artifacts/contracts/Upload.sol/Upload.json";
import "./App.css";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import FileUpload from "./components/FileUpload";
import Display from "./components/Display.js";
import Modal from "./components/Modal.js";
function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    const loadProvider = async () => {
      if (window.ethereum) {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);
        let contractAddress = "0xA79B8B1E3dd59c2CBf4D15f4812316097080Cc6C";
        const contract = new ethers.Contract(
          contractAddress,
          Upload.abi,
          signer,
        );
        setContract(contract);
        setProvider(provider);
      } else {
        console.error("MetaMask is not installed");
      }
    };
    loadProvider();
  }, []);

  return (
    <div className="App">
      <h1 className=" main_heading" style={{ color: "white" }}>
        Decentralized file storage System
      </h1>
      <div className="text_account">
        <p style={{ color: "white" }}>
          {" "}
          Account : {account ? account : "please connect to MetaMask"}
        </p>
      </div>
      <FileUpload
        account={account}
        provider={provider}
        contract={contract}
      ></FileUpload>
      <Display contract={contract} account={account}></Display>
      <Modal contract={contract} account={account}></Modal>
    </div>
  );
}

export default App;
