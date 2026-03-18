require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    ganache: {
      url: "http://127.0.0.1:8545",
      accounts: {
        mnemonic: "skin sample bulb nest achieve unfold escape firm quantum connect just jungle"
      }
    }
  },
  paths: {
    artifacts: "./client/src/artifacts",
  },
};