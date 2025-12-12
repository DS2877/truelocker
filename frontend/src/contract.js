import { ethers } from "ethers";
import { ABI } from "./abi";

// ✏️ Lägg in min riktiga kontraktsadress här:
const CONTRACT_ADDRESS = "0xMY_CONTRACT_ADDRESS_HERE";

export async function getProvider() {
  if (!window.ethereum) {
    throw new Error("Metamask not installed");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider;
}

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("Metamask not installed");
  }

  // Begär åtkomst till kontot
  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  return accounts[0];
}

export async function getContract() {
  const provider = await getProvider();
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
}

//smart contract actions

export async function storeEvidence(cid, hash) {
  const contract = await getContract();
  const tx = await contract.storeEvidence(cid, hash);
  await tx.wait();
  return tx.hash;
}

export async function getEvidence(id) {
  const contract = await getContract();
  return await contract.getEvidence(id);
}
