// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";

contract WhistleblowerPlatform {
    struct Organization {
        uint256 groupId;
        string name;
        address admin;
        uint256 memberCount;
        uint256 createdAt;
    }

    struct Report {
        uint256 orgId;
        string ipfsCid;
        string category;
        uint256 timestamp;
        uint256 nullifier;
    }

    ISemaphore public immutable semaphore;

    uint256 public orgCount;
    uint256 public reportCount;

    mapping(uint256 => Organization) public organizations;
    mapping(uint256 => Report) public reports;

    event OrganizationCreated(
        uint256 indexed orgId,
        string name,
        address indexed admin
    );

    event MemberAdded(uint256 indexed orgId, uint256 identityCommitment);

    event ReportSubmitted(
        uint256 indexed reportId,
        uint256 indexed orgId,
        string ipfsCid,
        string category,
        uint256 timestamp,
        uint256 nullifier
    );

    error NotOrgAdmin();
    error OrgDoesNotExist();

    constructor(address _semaphore) {
        semaphore = ISemaphore(_semaphore);
    }

    function createOrganization(
        string calldata _name
    ) external returns (uint256) {
        uint256 groupId = semaphore.createGroup(address(this));

        organizations[groupId] = Organization({
            groupId: groupId,
            name: _name,
            admin: msg.sender,
            memberCount: 0,
            createdAt: block.timestamp
        });

        orgCount++;

        emit OrganizationCreated(groupId, _name, msg.sender);

        return groupId;
    }

    function joinOrganization(
        uint256 _orgId,
        uint256 _identityCommitment
    ) external {
        Organization storage org = organizations[_orgId];
        if (org.admin == address(0)) revert OrgDoesNotExist();
        if (msg.sender != org.admin) revert NotOrgAdmin();

        semaphore.addMember(_orgId, _identityCommitment);
        org.memberCount++;

        emit MemberAdded(_orgId, _identityCommitment);
    }

    function submitReport(
        uint256 _orgId,
        string calldata _ipfsCid,
        string calldata _category,
        uint256 _merkleTreeDepth,
        uint256 _merkleTreeRoot,
        uint256 _nullifier,
        uint256 _message,
        uint256[8] calldata _points
    ) external {
        Organization storage org = organizations[_orgId];
        if (org.admin == address(0)) revert OrgDoesNotExist();

        uint256 scope = uint256(
            keccak256(abi.encodePacked(_orgId, _category))
        );

        ISemaphore.SemaphoreProof memory proof = ISemaphore.SemaphoreProof(
            _merkleTreeDepth,
            _merkleTreeRoot,
            _nullifier,
            _message,
            scope,
            _points
        );

        semaphore.validateProof(_orgId, proof);

        uint256 reportId = reportCount;
        reports[reportId] = Report({
            orgId: _orgId,
            ipfsCid: _ipfsCid,
            category: _category,
            timestamp: block.timestamp,
            nullifier: _nullifier
        });
        reportCount++;

        emit ReportSubmitted(
            reportId,
            _orgId,
            _ipfsCid,
            _category,
            block.timestamp,
            _nullifier
        );
    }

    function getOrganization(
        uint256 _orgId
    ) external view returns (Organization memory) {
        return organizations[_orgId];
    }

    function getReport(
        uint256 _reportId
    ) external view returns (Report memory) {
        return reports[_reportId];
    }
}
