import { useState } from "react";
import "./Modal.css";

const Modal = ({ contract, account }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [revokeAddress, setRevokeAddress] = useState("");
  const [accessList, setAccessList] = useState([]);
  const [message, setMessage] = useState("");

  const grantAccess = async () => {
    if (!walletAddress) return alert("Enter a wallet address!");
    try {
      const tx = await contract.allow(walletAddress);
      await tx.wait();
      setMessage(`Access granted to ${walletAddress}`);
      setWalletAddress("");
    } catch (err) {
      setMessage(" Error: " + err.message);
    }
  };

  const revokeAccess = async () => {
    if (!revokeAddress) return alert("Enter a wallet address!");
    try {
      const tx = await contract.revoke(revokeAddress);
      await tx.wait();
      setMessage(`🚫 Access revoked from ${revokeAddress}`);
      setRevokeAddress("");
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
  };

  const viewAccessList = async () => {
    try {
      const list = await contract.sharelist(account);
      setAccessList(list);
    } catch (err) {
      setMessage("❌ Error fetching access list");
    }
  };

  return (
    <div className="Share_container">
      <h2>Access Sharing</h2>

      {/* Grant Access */}
      <input
        disabled={!account}
        type="text"
        id="Share_access"
        placeholder="Enter the address to grant access"
        name="data"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
      />
      <button onClick={grantAccess}>Share Access</button>

      {/* Dropdown — populated from sharelist() */}
      <select onClick={viewAccessList}>
        <option value="">Addresses which have access to your files</option>
        {accessList.map((item, index) => (
          <option key={index} value={item.user}>
            {item.user} — {item.access ? "✅ Active" : "🚫 Revoked"}
          </option>
        ))}
      </select>

      {/* Revoke Access */}
      <input
        disabled={!account}
        type="text"
        placeholder="Enter address to revoke access..."
        id="revoke_access"
        name="data"
        value={revokeAddress}
        onChange={(e) => setRevokeAddress(e.target.value)}
      />
      <button onClick={revokeAccess}>Revoke Access</button>
    </div>
  );
};

export default Modal;