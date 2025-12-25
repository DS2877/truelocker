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

    // Måste vara senaste via Anvil
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Install MetaMask");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const cont = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      setAccount(await signer.getAddress());
      setContract(cont);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFileHash("");
    setCid("");
  };

  const generateHash = async () => {
    if (!selectedFile) return;
    const buffer = await selectedFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    setFileHash(hashHex);
  };

  const uploadToIPFS = async () => {
    if (!selectedFile) return;
    try {
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
    } catch (err) {
      console.error("IPFS upload failed:", err);
    }
  };

  const storeEvidence = async () => {
    if (!cid || !fileHash || !contract) return;
    try {
      const tx = await contract.storeEvidence(cid, fileHash);
      await tx.wait();
      setSelectedFile(null);
      setFileHash("");
      setCid("");
      loadEvidences();
    } catch (err) {
      console.error("Store evidence failed:", err);
    }
  };

  const loadEvidences = async () => {
    if (!contract) return;
    try {
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
    } catch (err) {
      console.error("Load evidence failed:", err);
    }
  };

  const verifyEvidence = async () => {
    if (!verifyFile) return;
    const buffer = await verifyFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    const match = evidences.find((e) => e.hashValue.toLowerCase() === hashHex.toLowerCase());
    setVerifyResult(match ? match : false);
  };

  useEffect(() => {
    if (contract) loadEvidences();
  }, [contract]);

  return (
    <div className="app">
      <div className="vault">
        <div className="safe-dial"></div>
        <h1>🔐 TrueLocker</h1>

        {!account ? (
          <button className="connect-btn" onClick={connectWallet}>
            Connect Wallet
          </button>
        ) : (
          <>
            <div className="wallet-box">
              <p><b>Connected:</b> {account}</p>
              <p><b>Total Evidence:</b> {evidenceCount}</p>
            </div>

            {/* === MAIN  === */}
            <div className="main-content">

              {/* --- STORE --- */}
              <div className="column">
                <div className="action-box">
                  <h2>Store Evidence</h2>
                  <input className="input" type="file" onChange={handleFileSelect} />
                  <button className="store-btn" onClick={generateHash}>Generate Hash</button>
                  <button className="store-btn" onClick={uploadToIPFS}>Upload to IPFS</button>
                  {fileHash && <p className="hash"><b>Hash:</b> {fileHash}</p>}
                  {cid && <p className="hash"><b>CID:</b> {cid}</p>}
                  <button className="store-btn" onClick={storeEvidence} disabled={!cid}>Store on Blockchain</button>
                </div>
              </div>

              {/* --- VERIFY --- */}
              <div className="column">
                <div className="action-box">
                  <h2>Verify Evidence</h2>
                  <input className="input" type="file" onChange={(e) => { setVerifyFile(e.target.files[0]); setVerifyResult(null); }} />
                  <button className="verify-btn" onClick={verifyEvidence}>Verify</button>
                  {verifyResult === false && <p className="verify invalid"> No match</p>}
                  {verifyResult && <p className="verify valid">✅ Evidence verified: {verifyResult.cid}</p>}
                </div>
              </div>

              {/* --- STORED --- */}
              <div className="column">
                <div className="list-box">
                  <h2>Stored Evidence</h2>
                  {evidences.map((e, i) => (
                    <div key={i} className="evidence-card">
                      <p><b>CID:</b> {e.cid}</p>
                      <p><b>Hash:</b> {e.hashValue}</p>
                      <p><b>Creator:</b> {e.creator}</p>
                      <p><b>Timestamp:</b> {e.timestamp}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
            <div className="footer"></div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;