
import { useState } from "react";
import axios from "axios";
import "./Display.css";

const BACKEND_URL = "https://blockchain-image-storage.onrender.com";
const IPFS_GATEWAY = "https://gateway.pinata.cloud/ipfs/";

const Display = ({ contract, account }) => {
  const [files, setFiles] = useState([]);
  const [address, setAddress] = useState("");
  const [accessHistory, setAccessHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ADDED: Audit-history search and loaded state
  const [historySearch, setHistorySearch] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const getdata = async () => {
    if (!contract || !account) {
      setStatus("Please connect your wallet first.");
      return;
    }

    setIsLoading(true);
    setStatus("");

    try {
      const targetAddress = address.trim() || account;
      const dataArray = await contract.display(targetAddress);

      const hashes = Array.from(dataArray || []).filter(
        (item) => typeof item === "string" && item.startsWith("ipfs://")
      );

      if (hashes.length === 0) {
        setFiles([]);
        setStatus("No files found for this wallet.");
        return;
      }

      const fileDetails = await Promise.all(
        hashes.map(async (hash) => {
          try {
            const response = await axios.get(
              `${BACKEND_URL}/api/files/${encodeURIComponent(hash)}`
            );

            const details = response.data.file || {};
            const fileName = details.fileName || hash.substring(7);
            const extension = fileName.includes(".")
              ? fileName.split(".").pop().toLowerCase()
              : "";

            let fileType = details.fileType || extension || "unknown";

            if (fileType.includes("/")) {
              fileType = fileType.split("/").pop();
            }

            return {
              fileHash: hash,
              fileName,
              fileType,
              fileSize: details.fileSize ?? null,
              createdAt: details.createdAt || null,
            };
          } catch (error) {
            // Keep files visible if MongoDB metadata is unavailable
            return {
              fileHash: hash,
              fileName: hash.substring(7),
              fileType: "unknown",
              fileSize: null,
              createdAt: null,
            };
          }
        })
      );

      setFiles(fileDetails);
      setStatus(`${fileDetails.length} file(s) found.`);
    } catch (error) {
      console.error("File retrieval error:", error);
      setFiles([]);
      setStatus("Unable to retrieve files. Check access and wallet address.");
    } finally {
      setIsLoading(false);
    }
  };

  // Existing file search and type filter
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.fileName
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesType =
      typeFilter === "all" ||
      (typeFilter === "image" &&
        ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(file.fileType)) ||
      (typeFilter === "pdf" && file.fileType === "pdf") ||
      (typeFilter === "document" &&
        ["doc", "docx", "txt", "csv", "xls", "xlsx", "ppt", "pptx"].includes(
          file.fileType
        ));

    return matchesSearch && matchesType;
  });

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`${label} copied successfully.`);
    } catch (error) {
      console.error("Copy error:", error);
      setStatus("Unable to copy. Please copy the value manually.");
    }
  };

  const openFile = async (file) => {
    const fileUrl = `${IPFS_GATEWAY}${file.fileHash.substring(7)}`;

    // Open the file immediately
    window.open(fileUrl, "_blank", "noopener,noreferrer");

    try {
      await axios.post(`${BACKEND_URL}/api/access-log`, {
        fileName: file.fileName,
        fileHash: file.fileHash,
        owner: address.trim() || account,
        accessedBy: account,
      });
    } catch (error) {
      console.error("File access logging error:", error);
    }
  };

  const getAccessHistory = async () => {
    if (!account) {
      setStatus("Please connect your wallet first.");
      return;
    }

    setHistoryLoading(true);

    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/access-history/${account}`
      );

      setAccessHistory(res.data.logs || []);
      setHistoryLoaded(true);
      setStatus("Access history refreshed.");
    } catch (error) {
      console.error("Access history error:", error);
      setStatus("Failed to fetch access history. Please try again.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // ADDED: Search audit records by filename, wallet, or IPFS hash
  const filteredHistory = accessHistory.filter((log) => {
    const query = historySearch.trim().toLowerCase();

    return (
      (log.fileName || "").toLowerCase().includes(query) ||
      (log.accessedBy || "").toLowerCase().includes(query) ||
      (log.fileHash || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="display">
      <input
        type="text"
        placeholder="Enter wallet address to view files"
        className="address-input"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <button
        className="get-btn"
        onClick={getdata}
        disabled={isLoading || !account || !contract}
      >
        {isLoading ? "Loading Files..." : "Get Files"}
      </button>

      {status && (
        <p className="display-status" role="status" aria-live="polite">
          {status}
        </p>
      )}

      <div className="file-filters">
        <input
          type="text"
          className="address-input"
          placeholder="Search by filename..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="address-input"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter files by type"
        >
          <option value="all">All file types</option>
          <option value="image">Images</option>
          <option value="pdf">PDF files</option>
          <option value="document">Documents and spreadsheets</option>
        </select>
      </div>

      <div className="file-grid">
        {filteredFiles.map((file) => (
          <div className="file-card" key={file.fileHash}>
            <div className="file-icon">
              {file.fileType === "pdf"
                ? "PDF"
                : ["jpg", "jpeg", "png", "gif", "webp"].includes(
                    file.fileType
                  )
                ? "IMG"
                : "FILE"}
            </div>

            <h4 className="file-name" title={file.fileName}>
              {file.fileName}
            </h4>

            <p>Type: {file.fileType.toUpperCase()}</p>
            <p>
              Size:{" "}
              {file.fileSize != null
                ? `${(file.fileSize / 1024).toFixed(1)} KB`
                : "—"}
            </p>
            <p>
              Uploaded:{" "}
              {file.createdAt
                ? new Date(file.createdAt).toLocaleDateString()
                : "—"}
            </p>

            <button
              className="file-action-btn"
              onClick={() => openFile(file)}
            >
              Open File
            </button>

            <button
              className="file-action-btn secondary"
              onClick={() => copyText(file.fileHash, "CID")}
            >
              Copy CID
            </button>

            <button
              className="file-action-btn secondary"
              onClick={() =>
                copyText(
                  `${IPFS_GATEWAY}${file.fileHash.substring(7)}`,
                  "File link"
                )
              }
            >
              Copy Link
            </button>
          </div>
        ))}
      </div>

      {files.length > 0 && filteredFiles.length === 0 && (
        <p className="empty-state">No files match your search or filter.</p>
      )}

      {files.length === 0 && !isLoading && (
        <p className="empty-state">
          Retrieve files using a wallet address to see them here.
        </p>
      )}

      {/* CHANGED: Improved audit-history section */}
      <div className="access-history">
        <h3>File Access History</h3>
        <p className="history-description">
          Review file access recorded by the application.
        </p>

        <button
          className="get-btn"
          onClick={getAccessHistory}
          disabled={historyLoading || !account}
        >
          {historyLoading ? "Refreshing History..." : "Refresh History"}
        </button>

        <div className="history-summary">
          <span>
            Total records: <strong>{accessHistory.length}</strong>
          </span>
          <span>
            Matching records: <strong>{filteredHistory.length}</strong>
          </span>
        </div>

        {/* ADDED: Audit-log search */}
        <input
          type="text"
          className="address-input history-search"
          placeholder="Search filename, wallet address, or IPFS hash..."
          value={historySearch}
          onChange={(e) => setHistorySearch(e.target.value)}
        />

        {historyLoading ? (
          <p className="empty-state">Loading access history...</p>
        ) : !historyLoaded ? (
          <p className="empty-state">
            Click Refresh History to load the audit records.
          </p>
        ) : filteredHistory.length === 0 ? (
          <p className="empty-state">
            {accessHistory.length === 0
              ? "No access records found for this wallet."
              : "No records match your search."}
          </p>
        ) : (
          <div className="history-table-wrapper">
            <table className="history-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Accessed By</th>
                  <th>Access Time</th>
                  <th>IPFS CID</th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.map((log, index) => (
                  <tr key={`${log._id || log.fileHash}-${index}`}>
                    <td className="history-filename">
                      {log.fileName || "Unknown File"}
                    </td>

                    <td className="wallet-cell">
                      {log.accessedBy || "Unknown"}
                    </td>

                    <td>
                      {log.accessedAt
                        ? new Date(log.accessedAt).toLocaleString()
                        : "Unknown"}
                    </td>

                    <td>
                      <button
                        className="file-action-btn secondary"
                        onClick={() => copyText(log.fileHash, "CID")}
                        disabled={!log.fileHash}
                      >
                        Copy CID
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Display;
