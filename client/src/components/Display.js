import { useState } from "react";
import "./Display.css";

const Display = ({ contract, account }) => {
  const [data, setData] = useState([]);
  const [address, setAddress] = useState("");

  const getdata = async () => {
    let dataArray;
    const Otheraddress = address;
    try {
      if (Otheraddress) {
        dataArray = await contract.display(Otheraddress);
      } else {
        dataArray = await contract.display(account);
      }
      const isEmpty = Object.keys(dataArray).length === 0;
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
        return (
          <a href={item} key={i} target="_blank" rel="noreferrer">
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
      <div className="image-grid">{data}</div>
    </div>
  );
};

export default Display;
