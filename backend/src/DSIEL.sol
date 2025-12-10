// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract DSIEL {


    // STRUCT: Incident / Evidence
    // ------------------------------
    struct Evidence {
        string cid;         // IPFS CID from Pinata
        string hashValue;   // SHA-256 hash of the file
        address creator;    // Address who uploaded
        uint256 timestamp;  // Block timestamp
    }

    // Mapping: ID → Evidence
    mapping(uint256 => Evidence) public evidences;

    // Counter for new incident IDs
    uint256 public evidenceCount = 0;



    // FUNCTION: Store new evidence
    // ------------------------------
    function storeEvidence(string memory _cid, string memory _hashValue)
        public
        returns (uint256)
    {
        uint256 newId = evidenceCount;

        evidences[newId] = Evidence({
            cid: _cid,
            hashValue: _hashValue,
            creator: msg.sender,
            timestamp: block.timestamp
        });

        evidenceCount++;

        return newId; // Return the ID for frontend use
    }



    // FUNCTION: Read evidence by ID
    // ------------------------------
    function getEvidence(uint256 _id)
        public
        view
        returns (
            string memory,
            string memory,
            address,
            uint256
        )
    {
        Evidence memory e = evidences[_id];
        return (e.cid, e.hashValue, e.creator, e.timestamp);
    }
}