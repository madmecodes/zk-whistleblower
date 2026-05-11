// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

/// @dev Minimal mock for unit testing WhistleblowerPlatform.
/// Does not verify proofs -- just tracks groups and members.
contract MockSemaphore is ISemaphore {
    uint256 private _groupCounter;
    mapping(uint256 => address) private _groupAdmins;
    mapping(uint256 => uint256) private _groupMemberCount;
    mapping(uint256 => mapping(uint256 => bool)) private _usedNullifiers;

    function createGroup() external returns (uint256) {
        uint256 id = _groupCounter++;
        _groupAdmins[id] = msg.sender;
        return id;
    }

    function createGroup(address admin) external returns (uint256) {
        uint256 id = _groupCounter++;
        _groupAdmins[id] = admin;
        return id;
    }

    function createGroup(
        address admin,
        uint256
    ) external returns (uint256) {
        uint256 id = _groupCounter++;
        _groupAdmins[id] = admin;
        return id;
    }

    function addMember(uint256 groupId, uint256) external {
        _groupMemberCount[groupId]++;
    }

    function addMembers(
        uint256 groupId,
        uint256[] calldata identityCommitments
    ) external {
        _groupMemberCount[groupId] += identityCommitments.length;
    }

    function updateMember(
        uint256,
        uint256,
        uint256,
        uint256[] calldata
    ) external {}

    function removeMember(
        uint256,
        uint256,
        uint256[] calldata
    ) external {}

    function validateProof(
        uint256 groupId,
        SemaphoreProof calldata proof
    ) external {
        require(
            !_usedNullifiers[groupId][proof.nullifier],
            "Nullifier already used"
        );
        _usedNullifiers[groupId][proof.nullifier] = true;
        emit ProofValidated(
            groupId,
            proof.merkleTreeDepth,
            proof.merkleTreeRoot,
            proof.nullifier,
            proof.message,
            proof.scope,
            proof.points
        );
    }

    function verifyProof(
        uint256,
        SemaphoreProof calldata
    ) external pure returns (bool) {
        return true;
    }

    function updateGroupAdmin(uint256 groupId, address newAdmin) external {
        _groupAdmins[groupId] = newAdmin;
    }

    function acceptGroupAdmin(uint256) external {}

    function updateGroupMerkleTreeDuration(uint256, uint256) external {}

    function groupCounter() external view returns (uint256) {
        return _groupCounter;
    }

    // Events required by ISemaphore
    // ProofValidated is emitted in validateProof above
    // GroupMerkleTreeDurationUpdated is not needed for mock
}
