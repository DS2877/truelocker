import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ABI } from "./abi";
import "./App.css";

function App() {
  // STATE
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);

  const [evidenceCount, setEvidenceCount] = useState(0);
  const [evidences, setEvidences] = useState([]);

  const [cid, setCid] = useState("");
  const [hashValue, setHashValue] = useState("");

  // Byt till min deployade kontraktsadress senare! (GLÖM EJ DETTA PHILIP!)
  const CONTRACT_ADDRESS = "ADDRESS_HERE";

  //== CONNECT WALLET ===
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

      console.log("Connected:", acct);
    } catch (err) {
      console.error("Wallet connection error:", err);
    }
  };

  // == LOAD EVIDENCES ===
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

  // == STORE EVIDENCE ==
  const storeEvidence = async () => {
    if (!contract) return;

    if (!cid || !hashValue) {
      alert("CID and Hash are required");
      return;
    }

    try {
      const tx = await contract.storeEvidence(cid, hashValue);
      await tx.wait();

      setCid("");
      setHashValue("");
      loadEvidences();
    } catch (err) {
      console.error("Store error:", err);
    }
  };

  // load contract when ready
  useEffect(() => {
    if (contract) {
      loadEvidences();
    }
  }, [contract]);

  // == UI ===
  return (
    <div className="app">
      <div className="vault">

        {/* HEADER */}
        <header className="header">
          <h1>🔐 Truelocker</h1>
          <p className="subtitle">Secure Evidence Vault</p>
        </header>

        {/* WALLET */}
        <div className="wallet-box">
          {!account ? (
            <button className="connect-btn" onClick={connectWallet}>
              Connect Wallet
            </button>
          ) : (
            <>
              <p><strong>Status:</strong> Connected</p>
              <p className="address">{account}</p>
              <p><strong>Total Evidence:</strong> {evidenceCount}</p>
            </>
          )}
        </div>

        {/* EVIDENCE */}
        {account && (
          <div className="action-box">
            <h2>Store New Evidence</h2>

            <input
              className="input"
              placeholder="CID (IPFS)"
              value={cid}
              onChange={(e) => setCid(e.target.value)}
            />

            <input
              className="input"
              placeholder="Hash Value"
              value={hashValue}
              onChange={(e) => setHashValue(e.target.value)}
            />

            <button className="store-btn" onClick={storeEvidence}>
              🔒 Store Evidence
            </button>
          </div>
        )}

        {/* EVIDENCE List  */}
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
          Truelocker © Integrity • Immutability • Trust
        </footer>
      </div>
    </div>
  );
}

export default App;