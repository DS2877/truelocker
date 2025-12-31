# 🔐 TrustLocker

TrustLocker is a decentralized application (dApp) for storing and verifying digital evidence using Ethereum, IPFS, and cryptographic hashing.

The project demonstrates how blockchain technology can be used to ensure data integrity and proof-of-existence without storing sensitive files directly on-chain.

---

## Features

- Connect wallet using MetaMask
- Store evidence by:
  - Hashing a file locally (SHA-256)
  - Uploading the file to IPFS
  - Storing the file hash and IPFS CID on Ethereum
- Verify evidence by re-hashing a file and comparing it to stored on-chain data
- View transaction hash and Etherscan link
- Network indicator (Sepolia)
- Activity log showing system actions
- Visual “vault” metaphor with status indicators

---

## Architecture Overview

### 1. Smart Contract (Solidity)
- Stores:
  - IPFS CID
  - SHA-256 file hash
  - Creator address
  - Timestamp
- Deployed on **Ethereum Sepolia testnet**
- Written using Solidity ^0.8.x

### 2. Frontend (React)
- Handles:
  - File hashing in the browser
  - MetaMask wallet connection
  - Smart contract interaction via `ethers.js`
- No backend server required

### 3. Decentralized Storage (IPFS)
- Files are uploaded to IPFS via Pinata
- Only references (CID + hash) are stored on-chain

---

## Why This Design?

- **No file data on-chain**  
  Storing files on Ethereum is expensive and unnecessary. Hashes are enough to prove integrity.

- **Client-side hashing**  
  Files never leave the user’s device unencrypted before hashing.

- **IPFS for decentralization**  
  Files remain accessible without relying on a traditional server.

- **Blockchain for immutability**  
  Once evidence is stored, it cannot be altered or removed.

---

## Network & Deployment

- **Network:** Ethereum Sepolia Testnet
- **Wallet:** MetaMask
- **Contract Address:**  

---

##  Setup Instructions

### Prerequisites
- Node.js
- MetaMask browser extension
- Sepolia ETH (testnet)
- Pinata account (API keys)

### Install & Run Locally

```bash
npm install
npm start

Create .env file
REACT_APP_PINATA_API_KEY=your_key_here
REACT_APP_PINATA_API_SECRET=your_secret_here
