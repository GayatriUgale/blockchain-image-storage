import Upload from "./artifacts/contracts/Upload.sol/Upload.json";
import './App.css';
import { useState,useEffect } from "react";
import {ethers} from "ethers";
import FileUpload from "./components/FileUpload";
import Display from "./components/Display.js";
import Modal  from "./components/Modal.js";
function App() {

  const [account,setAccount]=useState("");
  const [contract,setContract]=useState(null);
  const [provider,setProvider]=useState(null);
  const [modalOpen,setmodalOpen]=useState(false);

  useEffect(() => {
  const loadProvider = async () => {
    if (window.ethereum) {

      // 👇 ADD THIS BLOCK
      
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      setAccount(address);

      let contractAddress = "0xbEe55697922861dB64517647D66aEAd8d0a89E74";
      const contract = new ethers.Contract(contractAddress, Upload.abi, signer);
      setContract(contract);
      setProvider(provider);

    } else {
      console.error("MetaMask is not installed");
    }
  };
  loadProvider();
}, []);

  return <div className="App">
    <h1 className =" main_heading"style={{color : "white"}}>Decentralized file storage System</h1>
    <div className="text_account">
      <p style={{color : "white"}}> Account : {account ? account :"please connect to MetaMask"}</p>
    </div>
      console.log("pinata_api_key:", process.env.REACT_APP_PINATA_API_KEY);
   <FileUpload account={account} provider={provider} contract={contract}></FileUpload> 
   <Display contract={contract} account={account}></Display>
  </div>;

}

export default App;
