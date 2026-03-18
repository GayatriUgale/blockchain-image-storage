const hre = require("hardhat");

async function main() {
  const Upload = await hre.ethers.getContractFactory("Upload"); 
  const upload = await Upload.deploy();
  await upload.deployed();
  console.log("Upload contract deployed to:", upload.address); // lowercase .address, no await
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
//0xbc9Cb33211A88B81355a92248785E768606B08dF