
/* eslint-disable no-unused-vars */

import { useState } from "react";
import axios from "axios";
import "./Display.css";

const Display = ({ contract, account }) => {
  const [data, setData] = useState([]);
  const [address, setAddress] = useState("");
  const [accessHistory, setAccessHistory] = useState([]);

  const getdata = async () => {
    let dataArray;
    const Otheraddress = address;

    try {
      if (Otheraddress) {
        dataArray = await contract.display(Otheraddress);
      } else {
        dataArray = await contract.display(account);
      }
    } catch (e) {
      console.log("Error:", e);
      alert("You don't have access");
      return;
    }

    const isEmpty = !dataArray || Object.keys(dataArray).length === 0;

    if (!isEmpty) {
      const str = dataArray.toString();
      const str_array = str.split(",");

      const images = str_array.map((item, i) => {
        const openFile = async (e) => {
          e.preventDefault();

          const newTab = window.open("", "_blank");

          let fileName = "Unknown File";

          try {
            const fileRes = await axios.get(
              `http://https://blockchain-image-storage.onrender.com/api/files/${encodeURIComponent(item)}`
            );

            fileName = fileRes.data.file.fileName;

            await axios.post("http://https://blockchain-image-storage.onrender.com/api/access-log", {
              fileName,
              fileHash: item,
              owner: Otheraddress || account,
              accessedBy: account,
            });

            newTab.location.href = item;
          } catch (error) {
            console.error("File access error:", error);
            newTab.location.href = item;
          }
        };

        return (
          <a
            href={item}
            key={i}
            target="_blank"
            rel="noreferrer"
            onClick={openFile}
          >
            <img
              src={`https://gateway.pinata.cloud/ipfs/${item.substring(7)}`}
              alt="uploaded"
              className="image-list"
            />
          </a>
        );
      });

      setData(images);
    } else {
      alert("No image to display");
    }
  };

  const getAccessHistory = async () => {
    try {
      const res = await axios.get(
        `http://https://blockchain-image-storage.onrender.com/api/access-history/${account}`
      );

      setAccessHistory(res.data.logs);
    } catch (error) {
      console.error("Access history error:", error);
      alert("Failed to fetch access history");
    }
  };

  return (
    <div className="display">
      <input
        type="text"
        placeholder="Enter address to view their images"
        className="address-input"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <button className="get-btn" onClick={getdata}>
        Get Images
      </button>

      <button className="get-btn" onClick={getAccessHistory}>
        View Access History
      </button>

      <div className="access-history">
        <h3>File Access History</h3>

        <p>
          <strong>Total Accesses:</strong> {accessHistory.length}
        </p>

        {accessHistory.length === 0 ? (
          <p>No access history found.</p>
        ) : (
          accessHistory.map((log, index) => (
            <div className="history-item" key={index}>
              <p>
                <strong>File:</strong>{" "}
                {log.fileName || "Unknown File"}
              </p>

              <p>
                <strong>IPFS Hash:</strong> {log.fileHash}
              </p>

              <p>
                <strong>Accessed By:</strong> {log.accessedBy}
              </p>

              <p>
                <strong>Time:</strong>{" "}
                {new Date(log.accessedAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="image-grid">{data}</div>
    </div>
  );
};

export default Display;

