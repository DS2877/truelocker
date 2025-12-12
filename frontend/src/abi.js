export const ABI = [
  {
    "type": "function",
    "name": "evidenceCount",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "evidences",
    "inputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "cid", "type": "string", "internalType": "string" },
      { "name": "hashValue", "type": "string", "internalType": "string" },
      { "name": "creator", "type": "address", "internalType": "address" },
      { "name": "timestamp", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getEvidence",
    "inputs": [
      { "name": "_id", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "string", "internalType": "string" },
      { "name": "", "type": "string", "internalType": "string" },
      { "name": "", "type": "address", "internalType": "address" },
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "storeEvidence",
    "inputs": [
      { "name": "_cid", "type": "string", "internalType": "string" },
      { "name": "_hashValue", "type": "string", "internalType": "string" }
    ],
    "outputs": [
      { "name": "", "type": "uint256", "internalType": "uint256" }
    ],
    "stateMutability": "nonpayable"
  }
];