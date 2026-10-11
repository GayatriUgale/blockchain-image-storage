

import { useState } from "react";
import "./Modal.css";

const Modal = ({ contract, account }) => {
  const [walletAddress, setWalletAddress] = useState("");
  const [revokeAddress, setRevokeAddress] = useState("");
  const [accessList, setAccessList] = useState([]);
  const [message, setMessage] = useState("");
  const [duration, setDuration] = useState("3600");
  // ADDED: Loading states
  const [isGranting, setIsGranting] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // ADDED: Validate Ethereum wallet address
  const isValidAddress = (address) =>
    /^0x[a-fA-F0-9]{40}$/.test(address.trim());

  const grantAccess = async () => {
    if (!account || !contract) {
      setMessage("Please connect your wallet first.");
      return;
    }

    if (!isValidAddress(walletAddress)) {
      setMessage("Please enter a valid wallet address.");
      return;
    }

    if (walletAddress.trim().toLowerCase() === account.toLowerCase()) {
      setMessage("You cannot share access with your own wallet.");
      return;
    }

    setIsGranting(true);
    setMessage("");

    try {
      const tx = await contract.allow(walletAddress.trim(), duration);
      await tx.wait();

      setMessage(`Access granted to ${walletAddress.trim()}.`);
      setWalletAddress("");

      // ADDED: Refresh the list after granting access
      await viewAccessList();
    } catch (err) {
      setMessage("Error: " + (err.reason || err.shortMessage || err.message));
    } finally {
      setIsGranting(false);
    }
  };

  const revokeAccess = async () => {
    if (!account || !contract) {
      setMessage("Please connect your wallet first.");
      return;
    }

    if (!isValidAddress(revokeAddress)) {
      setMessage("Please enter a valid wallet address.");
      return;
    }

    setIsRevoking(true);
    setMessage("");

    try {
      const tx = await contract.revoke(revokeAddress.trim());
      await tx.wait();

      setMessage(`Access revoked from ${revokeAddress.trim()}.`);
      setRevokeAddress("");

      // ADDED: Refresh the list after revoking access
      await viewAccessList();
    } catch (err) {
      setMessage("Error: " + (err.reason || err.shortMessage || err.message));
    } finally {
      setIsRevoking(false);
    }
  };

  const viewAccessList = async () => {
    if (!account || !contract) {
      setMessage("Please connect your wallet first.");
      return;
    }

    setIsLoadingList(true);

    try {
      const list = await contract.sharelist(account);
      setAccessList(Array.from(list));
    } catch (err) {
      setMessage("Error fetching access list.");
    } finally {
      setIsLoadingList(false);
    }
  };

  // ADDED: Display expiry and determine current access status
  const getAccessDetails = (item) => {
    const expirySeconds = Number(item.expiry);
    const expiryDate =
      expirySeconds > 0
        ? new Date(expirySeconds * 1000).toLocaleString()
        : null;

    const isExpired =
      item.access && expirySeconds > 0 && expirySeconds <= Date.now() / 1000;

    let status = "Revoked";

    if (item.access && isExpired) {
      status = "Expired";
    } else if (item.access && expirySeconds > Date.now() / 1000) {
      status = "Active";
    }

    return { expiryDate, status };
  };

  return (
    <div className="Share_container">
      <h2>Access Sharing</h2>

      {/* Grant Access */}
      <input
        disabled={!account || isGranting}
        type="text"
        id="Share_access"
        placeholder="Enter the address to grant access"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
      />

      <select
        disabled={!account || isGranting}
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
      >
        <option value="3600">1 Hour</option>
        <option value="21600">6 Hours</option>
        <option value="86400">1 Day</option>
        <option value="604800">7 Days</option>
        <option value="2592000">30 Days</option>
      </select>

      <button
        onClick={grantAccess}
        disabled={!account || !contract || isGranting}
      >
        {isGranting ? "Granting Access..." : "Share Access"}
      </button>

      {/* CHANGED: Explicit button to load or refresh access list */}
     
<button
  className="refresh-access-btn"
  onClick={viewAccessList}
  disabled={!account || !contract || isLoadingList}
>
  {isLoadingList ? "Loading Access List..." : "Refresh Access List"}
</button>

      <h3>Shared Wallet Addresses</h3>

      {accessList.length === 0 ? (
        <p>No shared addresses loaded. Refresh the access list to check.</p>
      ) : (
        <div className="shared-access-list">
          {accessList.map((item, index) => {
            const { expiryDate, status } = getAccessDetails(item);

            return (
              <div
                className="history-item"
                key={`${item.user}-${index}`}
              >
                <p>
                  <strong>Wallet:</strong> {item.user}
                </p>
                <p>
                  <strong>Status:</strong> {status}
                </p>
                <p>
                  <strong>Expiry:</strong>{" "}
                  {expiryDate || "No expiry recorded"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Revoke Access */}
      <input
        disabled={!account || isRevoking}
        type="text"
        id="revoke_access"
        placeholder="Enter address to revoke access"
        value={revokeAddress}
        onChange={(e) => setRevokeAddress(e.target.value)}
      />

      <button
        onClick={revokeAccess}
        disabled={!account || !contract || isRevoking}
      >
        {isRevoking ? "Revoking Access..." : "Revoke Access"}
      </button>

      {/* CHANGED: Clear status message */}
      {message && (
        <p className="access-message" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </div>
  );
};

export default Modal;
