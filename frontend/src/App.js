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

  // 🔹 NEW: selected stored evidence reference
  const [selectedEvidence, setSelectedEvidence] = useState(null);

  const [activityLog, setActivityLog] = useState([]);

  const addLog = (text) => {
    setActivityLog((prev) => [
      { text, time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  };

  const CONTRACT_ADDRESS = "0x1C36D580e98a940952e7b21026BE381e223eE963";
  const SEPOLIA_CHAIN_ID = 11155111n;
  const SEPOLIA_HEX = "0xaa36a7";

  // === CONNECT WALLET ===
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
    } catch (err) {
      console.error(err);
      setStatus("Wallet connection failed");
      addLog("Wallet connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  // === FILE SELECT ===
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setFileHash("");
    setCid("");
    setTxHash(null);
    addLog(`File selected: ${file.name}`);
  };

  // === HASH FILE ===
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

  // === UPLOAD TO IPFS ===
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

  // === STORE EVIDENCE ===
  const storeEvidence = async () => {
    if (!cid || !fileHash || !contract) return;
    try {
      setIsLoading(true);
      setStatus("Writing to blockchain...");
      addLog("Submitting transaction");

      const tx = await contract.storeEvidence(cid, fileHash);
      setTxHash(tx.hash);
      await tx.wait();

      setSelectedFile(null);
      setFileHash("");
      setCid("");
      loadEvidences();

      setStatus("Evidence stored");
      addLog("Evidence stored on-chain");
    } catch (err) {
      console.error(err);
      setStatus("Transaction failed");
      addLog("Transaction failed");
    } finally {
      setIsLoading(false);
    }
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

  useEffect(() => {
    if (contract) loadEvidences();
  }, [contract]);

  const vaultLocked = !!txHash;

  return (
    <div className="app">
      <div className="vault">
        <div className="safe-dial"></div>

        <h1>🔐 TrueLocker</h1>

        <div className={`vault-status ${vaultLocked ? "locked" : "open"}`}>
          Vault Status: {vaultLocked ? "LOCKED" : "OPEN"}
        </div>

        {networkName && (
          <div className="network-indicator">Network: {networkName}</div>
        )}
        {status && <div className="status-bar">{status}</div>}

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

            <div className="main-content">
              {/* STORE */}
              <div className="column">
                <div className="action-box">
                  <h2>Store Evidence</h2>

                  <input className="input" type="file" onChange={handleFileSelect} />
                  <button className="store-btn" onClick={generateHash}>Generate Hash</button>
                  <button className="store-btn" onClick={uploadToIPFS} disabled={!fileHash}>Upload to IPFS</button>
                  <button className="store-btn" onClick={storeEvidence} disabled={!cid}>Store on Blockchain</button>

                  <div className="store-progress">
                    <p className={selectedFile ? "done" : ""}>File selected</p>
                    <p className={fileHash ? "done" : ""}>Hash generated</p>
                    <p className={cid ? "done" : ""}>Uploaded to IPFS</p>
                    <p className={txHash ? "done" : ""}>Stored on chain</p>
                  </div>

                  {txHash && (
                    <p className="hash">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View on Etherscan ↗
                      </a>
                    </p>
                  )}
                </div>
              </div>

              {/* VERIFY + REFERENCE */}
              <div className="column">
                <div className="action-box">
                  <h2>Verify Evidence</h2>

                  <input
                    className="input"
                    type="file"
                    onChange={(e) => {
                      setVerifyFile(e.target.files[0]);
                      setVerifyResult(null);
                      addLog("Verification file selected");
                    }}
                  />

                  <button className="verify-btn" onClick={verifyEvidence}>
                    Verify
                  </button>

                  {verifyResult === false && <p className="verify invalid">No match</p>}
                  {verifyResult && <p className="verify valid">Verified</p>}

                  {/* STORED EVIDENCE REFERENCE */}
                  <div className="reference-box">
                    <h3>Stored Evidence Reference</h3>

                    {evidences.length === 0 && (
                      <p className="hash">No evidence stored yet</p>
                    )}

                    {evidences.map((e, i) => (
                      <div
                        key={i}
                        className={`reference-item ${selectedEvidence === i ? "active" : ""}`}
                        onClick={() => {
                          setSelectedEvidence(i);
                          addLog(`Selected stored evidence #${i}`);
                        }}
                      >
                        <p><b>ID:</b> {i}</p>
                        <p><b>CID:</b> {e.cid.slice(0, 10)}...</p>
                        <p><b>Time:</b> {e.timestamp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTIVITY LOG */}
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