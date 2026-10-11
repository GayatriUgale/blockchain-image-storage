require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: process.env.ALCHEMY_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  paths: {
    artifacts: "./client/src/artifacts",
  },
};