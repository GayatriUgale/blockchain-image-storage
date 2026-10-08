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

          // CHANGED: send file to our backend instead of Pinata directly
          url: "http://https://blockchain-image-storage.onrender.com/api/upload",

          data: formData,

          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const imgHash = `ipfs://${resFile.data.IpfsHash}`;
        await contract.add(account, imgHash);
        await axios.post("http://https://blockchain-image-storage.onrender.com/api/files", {
          fileName: file.name,
          fileHash: imgHash,
          owner: account,
        });
        alert("Sucessfully image Uploaded");

        setFilename("No image Selected");
        setfile(null);
      } catch (e) {
        alert("Unable to upload image");

        console.error("Upload error:", e);
      }
    }
  };

  const RetrieveFile = (e) => {
    const data = e.target.files[0];
    setfile(data);
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
