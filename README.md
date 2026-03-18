#  Decentralized Image Storage DApp

A blockchain-based decentralized application that allows users to securely 
upload and share images using IPFS and Ethereum smart contracts.

##  Tech Stack

- **Solidity** — Smart Contract
- **React.js** — Frontend
- **Ethers.js** — Blockchain Interaction
- **IPFS via Pinata** — Decentralized File Storage
- **Hardhat** — Development & Testing
- **MetaMask** — Wallet Integration

##  Features

- Upload images to IPFS (decentralized storage)
- Images are stored permanently and tamper-proof
- Grant access to other users to view your images
- Revoke access anytime
- View images by entering a wallet address

##  Getting Started

### Prerequisites
- Node.js installed
- MetaMask browser extension
- Pinata account (for IPFS)

### Installation

1. Clone the repo
   git clone https://github.com/GayatriUgale/blockchain-image-storage.git

2. Install dependencies
   cd Blockchain
   npm install
   cd client
   npm install

3. Add environment variables
   Create .env file inside client/ folder:
   REACT_APP_PINATA_API_KEY=your_api_key
   REACT_APP_PINATA_SECRET_KEY=your_secret_key

4. Start Hardhat node
   npx hardhat node

5. Deploy contract (in new terminal)
   npx hardhat run scripts/deploy.js --network localhost

6. Update contract address in App.js

7. Start React app
   cd client
   npm start

##  How It Works

1. User connects MetaMask wallet
2. Select an image to upload
3. Image gets uploaded to IPFS via Pinata
4. IPFS hash is stored on Ethereum blockchain
5. User can grant/revoke access to other wallet addresses
6. Anyone with access can view the images

## Project Structure

Blockchain/
├── contracts/
│   └── Upload.sol        # Smart contract
├── scripts/
│   └── deploy.js         # Deployment script
├── hardhat.config.js     # Hardhat configuration
└── client/               # React frontend
    └── src/
        ├── App.js
        ├── Display.js
        └── artifacts/    # Contract ABI

## Environment Variables

REACT_APP_PINATA_API_KEY | Your Pinata API Key |
REACT_APP_PINATA_SECRET_KEY | Your Pinata Secret Key |

##  Author
Gayatri