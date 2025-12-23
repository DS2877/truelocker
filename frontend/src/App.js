import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ABI } from "./abi";
import "./App.css";

function App() {
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  const [evidences, setEvidences] = useState([]);
  const [evidenceCount, setEvidenceCount] = useState(0);

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileHash, setFileHash] = useState("");
  const [cid, setCid] = useState("");

  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  // BYT TILL DEPLOYAD ADRESS
  const CONTRACT_ADDRESS = "ADDRESS_HERE";

  // === CONNECT WALLET ===
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Install MetaMask");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const signer = await provider.getSigner();
    const cont = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    setAccount(await signer.getAddress());
    setContract(cont);
  };

  // === FILE SELECT ===
  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
    setFileHash("");
    setCid("");
  };

  // === HASH FILE ===
  const generateHash = async () => {
    if (!selectedFile) return;

    const buffer = await selectedFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    setFileHash(hashHex);
  };

  // === UPLOAD TO PINATA ===
  const uploadToIPFS = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: process.env.REACT_APP_PINATA_API_KEY,
        pinata_secret_api_key: process.env.REACT_APP_PINATA_API_SECRET,
      },
      body: formData,
    });

    const data = await res.json();
    setCid(data.IpfsHash);
  };

  // === STORE EVIDENCE ===
  const storeEvidence = async () => {
    if (!cid || !fileHash) return;

    const tx = await contract.storeEvidence(cid, fileHash);
    await tx.wait();

    setSelectedFile(null);
    setFileHash("");
    setCid("");
    loadEvidences();
  };

  // === LOAD EVIDENCE ===
  const loadEvidences = async () => {
    if (!contract) return;

    const count = await contract.evidenceCount();
    setEvidenceCount(Number(count));

    const list = [];
    for (let i = 0; i < count; i++) {
      const e = await contract.getEvidence(i);
      list.push({
        cid: e[0],
        hashValue: e[1],
        creator: e[2],
        timestamp: new Date(Number(e[3]) * 1000).toLocaleString(),
      });
    }
    setEvidences(list);
  };

  // === VERIFY FILE ===
  const verifyEvidence = async () => {
    if (!verifyFile) return;

    const buffer = await verifyFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    const match = evidences.find(e => e.hashValue === hashHex);
    setVerifyResult(match ? match : false);
  };

  useEffect(() => {
    if (contract) loadEvidences();
  }, [contract]);

  return (
    <div className="app">
      <h1>🔐 TrueLocker</h1>

      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <>
          <p><b>Connected:</b> {account}</p>
          <p><b>Total Evidence:</b> {evidenceCount}</p>

          <h2>Store Evidence</h2>
          <input type="file" onChange={handleFileSelect} />
          <button onClick={generateHash}>Generate Hash</button>
          <button onClick={uploadToIPFS}>Upload to IPFS</button>

          {fileHash && <p><b>Hash:</b> {fileHash}</p>}
          {cid && <p><b>CID:</b> {cid}</p>}

          <button onClick={storeEvidence} disabled={!cid}>
            Store on Blockchain
          </button>

          <h2>Verify Evidence</h2>
          <input type="file" onChange={(e) => setVerifyFile(e.target.files[0])} />
          <button onClick={verifyEvidence}>Verify</button>

          {verifyResult === false && <p>❌ No match</p>}
          {verifyResult && <p>✅ Evidence verified</p>}

          <h2>Stored Evidence</h2>
          {evidences.map((e, i) => (
            <div key={i}>
              <p><b>CID:</b> {e.cid}</p>
              <p><b>Hash:</b> {e.hashValue}</p>
              <p><b>Creator:</b> {e.creator}</p>
              <p><b>Timestamp:</b> {e.timestamp}</p>
              <hr />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;