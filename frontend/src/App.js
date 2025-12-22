import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ABI } from "./abi";
import "./App.css";

function App() {
  // === STATE ===
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  const [evidenceCount, setEvidenceCount] = useState(0);
  const [evidences, setEvidences] = useState([]);

  const [cid, setCid] = useState("");
  const [hashValue, setHashValue] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileHash, setFileHash] = useState("");

  const [verifyFile, setVerifyFile] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);

  //  BYT TILL MIN DEPLOYADE ADRESS (GLÖM EJ)
  const CONTRACT_ADDRESS = "ADDRESS_HERE";

  // === CONNECT WALLET ===
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    try {
      const prov = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const sign = await prov.getSigner();
      const acct = await sign.getAddress();
      const cont = new ethers.Contract(CONTRACT_ADDRESS, ABI, sign);

      setProvider(prov);
      setSigner(sign);
      setAccount(acct);
      setContract(cont);
    } catch (err) {
      console.error("Wallet connection error:", err);
    }
  };

  // === FILE SELECT ===
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setFileHash("");
    setHashValue("");
  };

  // === HASH FILE (SHA-256) ===
  const generateHash = async () => {
    if (!selectedFile) return;

    const buffer = await selectedFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    setFileHash(hashHex);
    setHashValue(hashHex);
  };

  // === LOAD EVIDENCE ===
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
      console.error("Load error:", err);
    }
  };

  // === STORE EVIDENCE ===
  const storeEvidence = async () => {
    if (!contract || !hashValue) return;

    try {
      const tx = await contract.storeEvidence(cid, hashValue);
      await tx.wait();

      setCid("");
      setHashValue("");
      setSelectedFile(null);
      setFileHash("");
      loadEvidences();
    } catch (err) {
      console.error("Store error:", err);
    }
  };

  // === VERIFY FILE ===
  const verifyEvidence = async () => {
    if (!verifyFile || evidences.length === 0) return;

    const buffer = await verifyFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const match = evidences.find(
      (e) => e.hashValue.toLowerCase() === hashHex.toLowerCase()
    );

    if (match) {
      setVerifyResult({ status: "valid", evidence: match });
    } else {
      setVerifyResult({ status: "invalid" });
    }
  };

  useEffect(() => {
    if (contract) {
      loadEvidences();
    }
  }, [contract]);

  // === UI ===
  return (
    <div className="app">
      <div className="vault">
        <header className="header">
          <h1>🔐 TrueLocker</h1>
          <p className="subtitle">Decentralized Evidence Vault</p>
        </header>

        <div className="wallet-box">
          {!account ? (
            <button className="connect-btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          ) : (
            <>
              <p><b>Status:</b> Connected</p>
              <p className="address">{account}</p>
              <p><b>Total Evidence:</b> {evidenceCount}</p>
            </>
          )}
        </div>

        {account && (
          <div className="action-box">
            <h2>Store New Evidence</h2>

            <input type="file" className="input" onChange={handleFileSelect} />

            {selectedFile && (
              <p>
                <b>File:</b> {selectedFile.name} (
                {Math.round(selectedFile.size / 1024)} KB)
              </p>
            )}

            <button className="store-btn" onClick={generateHash}>
              Generate Hash
            </button>

            {fileHash && (
              <p className="hash">
                <b>SHA-256:</b><br />
                {fileHash}
              </p>
            )}

            <input
              className="input"
              placeholder="CID (IPFS)"
              value={cid}
              onChange={(e) => setCid(e.target.value)}
            />

            <button
              className="store-btn"
              onClick={storeEvidence}
              disabled={!fileHash}
            >
              🔒 Store Evidence
            </button>
          </div>
        )}

        {account && (
          <div className="action-box">
            <h2>Verify Evidence</h2>

            <input
              type="file"
              className="input"
              onChange={(e) => {
                setVerifyFile(e.target.files[0]);
                setVerifyResult(null);
              }}
            />

            <button className="store-btn" onClick={verifyEvidence}>
              Verify File
            </button>

            {verifyResult?.status === "valid" && (
              <div className="verify valid">
                <p>✅ Evidence verified</p>
                <p><b>CID:</b> {verifyResult.evidence.cid}</p>
                <p><b>Stored:</b> {verifyResult.evidence.timestamp}</p>
              </div>
            )}

            {verifyResult?.status === "invalid" && (
              <div className="verify invalid">
                <p>❌ No matching evidence found</p>
              </div>
            )}
          </div>
        )}

        {account && (
          <div className="list-box">
            <h2>Stored Evidence</h2>

            {evidences.length === 0 ? (
              <p className="empty">No evidence stored yet</p>
            ) : (
              evidences.map((e, i) => (
                <div key={i} className="evidence-card">
                  <p><b>CID:</b> {e.cid}</p>
                  <p><b>Hash:</b> {e.hashValue}</p>
                  <p><b>Creator:</b> {e.creator}</p>
                  <p><b>Timestamp:</b> {e.timestamp}</p>
                </div>
              ))
            )}
          </div>
        )}

        <footer className="footer">
          TrueLocker © Integrity • Immutability • Trust
        </footer>
      </div>
    </div>
  );
}

export default App;