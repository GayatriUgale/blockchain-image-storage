import { useState } from "react";
import axios from "axios";
import "./FileUpload.css";

const FileUpload = ({ contract, account, provider }) => {
  const [file, setfile] = useState(null);
  const [filename, setFilename] = useState("No File Selected");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isError, setIsError] = useState(false); // ADDED

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file || !account || !contract || isUploading) {
      return;
    }

    setIsUploading(true);
    setIsError(false); // ADDED
    setUploadStatus("Uploading file to IPFS...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const resFile = await axios.post(
        "https://blockchain-image-storage.onrender.com/api/upload",
        formData,
      );

      const imgHash = `ipfs://${resFile.data.IpfsHash}`;

      setUploadStatus("Saving file on blockchain...");

      const tx = await contract.add(account, imgHash);
      await tx.wait();

      setUploadStatus("Saving file details...");

      await axios.post(
        "https://blockchain-image-storage.onrender.com/api/files",
        {
          fileName: file.name,
          fileHash: imgHash,
          owner: account,
          fileSize: file.size, // ADDED
          fileType: file.type, // ADDED
        },
      );

      setIsError(false);
      setUploadStatus("File uploaded successfully!");

      setFilename("No File Selected");
      setfile(null);
      e.target.reset();
    } catch (e) {
      console.error("Upload error:", e);
      setIsError(true); // ADDED

      // CHANGED: Show useful error messages
      if (e.response?.data?.error) {
        setUploadStatus(e.response.data.error);
      } else if (e.code === "ECONNABORTED") {
        setUploadStatus("Request timed out. Please try again.");
      } else {
        setUploadStatus(
          "Upload failed. Check your wallet connection and try again.",
        );
      }
    } finally {
      setIsUploading(false);
    }
  };

  const RetrieveFile = (e) => {
    const data = e.target.files[0];

    if (data) {
      setfile(data);
      setFilename(data.name);
      setUploadStatus("");
      setIsError(false); // ADDED
    }
  };

  return (
    <div className="top">
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="file-Upload">Choose File</label>

        <input
          disabled={!account || isUploading}
          type="file"
          id="file-Upload"
          name="data"
          accept="image/*,.pdf,.txt,.csv,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
          onChange={RetrieveFile}
        />

        <span className="text_area">File: {filename}</span>

        <button
          type="submit"
          className="upload"
          disabled={!file || !account || !contract || isUploading}
        >
          {isUploading ? "Uploading..." : "Upload File"}
        </button>

        {isUploading && (
          <div className="upload-progress" role="status" aria-live="polite">
            <span className="loader"></span>
            <p>{uploadStatus}</p>
          </div>
        )}

        {!isUploading && uploadStatus && (
          <p
            className={isError ? "upload-error" : "upload-success"}
            role="status"
            aria-live="polite"
          >
            {uploadStatus}
          </p>
        )}
      </form>
    </div>
  );
};

export default FileUpload;
