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

  //  ska byta detta mot min deployade kontraktsadress (GLÖM INTE)
  const CONTRACT_ADDRESS = "PASTE_CONTRACT_ADDRESS_HERE";

  // ANSLUT TILL METAMASK
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const prov = new ethers.providers.Web3Provider(window.ethereum);
        await prov.send("eth_requestAccounts", []);
        const sign = prov.getSigner();
        const acct = await sign.getAddress();
        const cont = new ethers.Contract(CONTRACT_ADDRESS, ABI, sign);

        setProvider(prov);
        setSigner(sign);
        setAccount(acct);
        setContract(cont);

        console.log("Wallet connected:", acct);
      } catch (err) {
        console.log("Error connecting wallet:", err);
      }
    } else {
      alert("Install MetaMask!");
    }
  };

  // HÄMTA EVIDENCE
  const loadEvidences = async () => {
    if (!contract) return;

    try {
      const count = await contract.evidenceCount();
      setEvidenceCount(count.toNumber());

      const evs = [];
      for (let i = 0; i < count; i++) {
        const e = await contract.getEvidence(i);
        evs.push({
          cid: e[0],
          hashValue: e[1],
          creator: e[2],
          timestamp: new Date(e[3].toNumber() * 1000).toLocaleString(),
        });
      }
      setEvidences(evs);
    } catch (err) {
      console.log("Error loading evidences:", err);
    }
  };

  //  SKICKA EVIDENCE
  const storeEvidence = async () => {
    if (!contract) return;
    if (!cid || !hashValue) {
      alert("CID och Hash måste fyllas i!");
      return;
    }

    try {
      const tx = await contract.storeEvidence(cid, hashValue);
      await tx.wait();
      alert("Evidence skickad!");
      setCid("");
      setHashValue("");
      loadEvidences();
    } catch (err) {
      console.log("Error sending evidence:", err);
    }
  };

  //ladda evidences när kontrakt är redo
  useEffect(() => {
    if (contract) {
      loadEvidences();
    }
  }, [contract]);

  return (
    <div className="App">
      <h1>TrueLocker Evidence</h1>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <p>Connected: {account}</p>
          <p>Total Evidence: {evidenceCount}</p>

          <h2>Add Evidence</h2>
          <input
            placeholder="CID"
            value={cid}
            onChange={(e) => setCid(e.target.value)}
          />
          <input
            placeholder="Hash Value"
            value={hashValue}
            onChange={(e) => setHashValue(e.target.value)}
          />
          <button onClick={storeEvidence}>Store Evidence</button>

          <h2>Evidence List</h2>
          {evidences.length === 0 ? (
            <p>No evidence yet</p>
          ) : (
            <ul>
              {evidences.map((e, idx) => (
                <li key={idx}>
                  <b>CID:</b> {e.cid} <br />
                  <b>Hash:</b> {e.hashValue} <br />
                  <b>Creator:</b> {e.creator} <br />
                  <b>Timestamp:</b> {e.timestamp} <br />
                  <hr />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default App;