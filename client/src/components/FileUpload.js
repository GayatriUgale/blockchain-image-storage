import { useState } from "react";
import axios from "axios";
import "./FileUpload.css";


const FileUpload = ({ contract, account, provider }) => {
  const [file, setfile] = useState(null);
  const [filename, setFilename] = useState("No File Selected");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const resFile = await axios({
          method: "post",
          url: "https://api.pinata.cloud/pinning/pinFileToIPFS",
          data: formData,
          headers: {
            pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
            pinata_secret_api_key: process.env.REACT_APP_PINATA_SECRET_KEY,
            "Content-Type": "multipart/form-data",
          },
        });

        const imgHash = `ipfs://${resFile.data.IpfsHash}`;
        await contract.add(account, imgHash);
        alert("Sucessfully image Uploaded");
        setFilename("No image Selected");
        setfile(null);
      } catch (e) {
        alert("Unable to upload image to pinata");
        console.error("Pinata error:", e);
      }
    }
  };
 const RetrieveFile = (e) => {
  const data = e.target.files[0]; // this is already the file
  setfile(data);                   // just save it directly
  setFilename(data.name);
  e.preventDefault();
};
  return (
    <div className="top">
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="file-Upload" style={{ color: "white" }}>
          choose Image
        </label>
        <input
          disabled={!account}
          type="file"
          id="file-Upload"
          name="data"
          onChange={RetrieveFile}
        />
        <span className="text_area" style={{ color: "white" }}>
          Image:{filename}
        </span>
        <button type="submit" className="upload" disabled={!file}>
          Upload File
        </button>
      </form>
    </div>
  );
};
export default FileUpload;
