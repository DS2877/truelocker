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

  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [txHash, setTxHash] = useState(null);
  const [networkName, setNetworkName] = useState("");

  const [activityLog, setActivityLog] = useState([]);

  const addLog = (text) => {
    setActivityLog((prev) => [
      { text, time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  };

  const [showIPFS, setShowIPFS] = useState(false);
  const [showHash, setShowHash] = useState(false);
  const [showChain, setShowChain] = useState(false);

  const CONTRACT_ADDRESS = "0x1C36D580e98a940952e7b21026BE381e223eE963";
  const SEPOLIA_CHAIN_ID = 11155111n;
  const SEPOLIA_HEX = "0xaa36a7";

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install MetaMask");

    try {
      setIsLoading(true);
      setStatus("Connecting wallet...");
      addLog("Initializing wallet connection");

      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_HEX }],
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      if (network.chainId !== SEPOLIA_CHAIN_ID) {
        alert("Please switch to Sepolia");
        return;
      }

      setNetworkName("Sepolia");
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const cont = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

      setAccount(await signer.getAddress());
      setContract(cont);
      setStatus("Wallet connected");
      addLog("Wallet connected to Sepolia");
    } catch {
      setStatus("Wallet connection failed");
      addLog("Wallet connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFileHash("");
    setCid("");
    setTxHash(null);
    addLog(`File selected: ${file.name}`);
  };

  const generateHash = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setStatus("Hashing file...");
    addLog("Generating SHA-256 hash");

    const buffer = await selectedFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    setFileHash(hashHex);
    setIsLoading(false);
    setStatus("Hash generated");
    addLog("Hash generated");
  };

  const uploadToIPFS = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setStatus("Uploading to IPFS...");
    addLog("Uploading file to IPFS");

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
    setIsLoading(false);
    setStatus("IPFS upload complete");
    addLog("File uploaded to IPFS");
  };

  const storeEvidence = async () => {
    if (!cid || !fileHash || !contract) return;
    try {
      setIsLoading(true);
      setStatus("Writing to blockchain...");
      addLog("Submitting transaction");

      const tx = await contract.storeEvidence(cid, fileHash);
      setTxHash(tx.hash);
      await tx.wait();

      loadEvidences();
      setStatus("Evidence stored");
      addLog("Evidence stored on-chain");
    } catch {
      setStatus("Transaction failed");
      addLog("Transaction failed");
    } finally {
      setIsLoading(false);
    }
  };

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

  const verifyEvidence = async () => {
    if (!verifyFile) return;
    setIsLoading(true);
    setStatus("Verifying file...");
    addLog("Verifying integrity");

    const buffer = await verifyFile.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const match = evidences.find((e) => e.hashValue === hashHex);
    setVerifyResult(match ? match : false);

    setIsLoading(false);
    setStatus(match ? "Verified" : "No match");
    addLog(match ? "Verification success" : "Verification failed");
  };

  const exportReport = () => {
    if (!verifyResult) return;

    const content = `
TRUSLOCKER – VERIFICATION REPORT

Network: ${networkName}
CID: ${verifyResult.cid}
Hash: ${verifyResult.hashValue}
Timestamp: ${verifyResult.timestamp}
Transaction: ${txHash || "N/A"}
    `;

    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "verification_report.txt";
    link.click();

    addLog("Verification report generated");
  };

  useEffect(() => {
    if (contract) loadEvidences();
  }, [contract]);

  return (
    <div className="app">
      <div className="vault">
        <div className="safe-dial"></div>
        <h1>🔐 TrusLocker</h1>

        {networkName && <div className="network-indicator">Network: {networkName}</div>}
        {status && <div className="status-bar">{status}</div>}

        {!account ? (
          <button className="connect-btn" onClick={connectWallet}>Connect Wallet</button>
        ) : (
          <>
            <div className="wallet-box">
              <p><b>Connected:</b> {account}</p>
              <p><b>Total Evidence:</b> {evidenceCount}</p>
            </div>

            <div className="main-content">
              <div className="column">
                <div className="action-box">
                  <h2>Store Evidence</h2>
                  <input className="input" type="file" onChange={handleFileSelect} />
                  <button className="store-btn" onClick={generateHash}>Generate Hash</button>
                  <button className="store-btn" onClick={uploadToIPFS} disabled={!fileHash}>Upload to IPFS</button>
                  <button className="store-btn" onClick={storeEvidence} disabled={!cid}>Store on Blockchain</button>

                  <div className="info-box" onClick={() => setShowIPFS(!showIPFS)}>What is IPFS?</div>
                  {showIPFS && <p className="info-text">IPFS stores files in a decentralized, content-addressed way.</p>}

                  <div className="info-box" onClick={() => setShowHash(!showHash)}>Why SHA-256?</div>
                  {showHash && <p className="info-text">SHA-256 creates a unique fingerprint of the file.</p>}

                  <div className="info-box" onClick={() => setShowChain(!showChain)}>Why Blockchain?</div>
                  {showChain && <p className="info-text">Blockchain ensures immutability and verifiable timestamps.</p>}
                </div>
              </div>

              <div className="column">
                <div className="action-box">
                  <h2>Verify Evidence</h2>
                  <input className="input" type="file" onChange={(e) => setVerifyFile(e.target.files[0])} />
                  <button className="verify-btn" onClick={verifyEvidence}>Verify</button>

                  {verifyResult && (
                    <>
                      <p className="verify valid">Verified</p>
                      <button className="store-btn" onClick={exportReport}>
                        Generate Verification Report
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="column">
                <div className="list-box">
                  <h2>System Activity</h2>
                  {activityLog.map((log, i) => (
                    <div key={i} className="evidence-card">
                      [{log.time}] {log.text}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;