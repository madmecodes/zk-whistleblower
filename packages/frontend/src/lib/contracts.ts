import { ethers } from "ethers";
import { WHISTLEBLOWER_ADDRESS, SEPOLIA_RPC_URL } from "./constants";

export const WHISTLEBLOWER_ABI = [
  "function createOrganization(string calldata _name) external returns (uint256)",
  "function joinOrganization(uint256 _orgId, uint256 _identityCommitment) external",
  "function submitReport(uint256 _orgId, string calldata _ipfsCid, string calldata _category, uint256 _merkleTreeDepth, uint256 _merkleTreeRoot, uint256 _nullifier, uint256 _message, uint256[8] calldata _points) external",
  "function getOrganization(uint256 _orgId) external view returns (tuple(uint256 groupId, string name, address admin, uint256 memberCount, uint256 createdAt))",
  "function getReport(uint256 _reportId) external view returns (tuple(uint256 orgId, string ipfsCid, string category, uint256 timestamp, uint256 nullifier))",
  "function orgCount() external view returns (uint256)",
  "function reportCount() external view returns (uint256)",
  "event OrganizationCreated(uint256 indexed orgId, string name, address indexed admin)",
  "event MemberAdded(uint256 indexed orgId, uint256 identityCommitment)",
  "event ReportSubmitted(uint256 indexed reportId, uint256 indexed orgId, string ipfsCid, string category, uint256 timestamp, uint256 nullifier)",
] as const;

export function getProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
}

export function getReadContract(): ethers.Contract {
  return new ethers.Contract(
    WHISTLEBLOWER_ADDRESS,
    WHISTLEBLOWER_ABI,
    getProvider()
  );
}

export function getWriteContract(signer: ethers.Signer): ethers.Contract {
  return new ethers.Contract(WHISTLEBLOWER_ADDRESS, WHISTLEBLOWER_ABI, signer);
}

export async function getSigner(): Promise<ethers.Signer> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet detected");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  return provider.getSigner();
}

// Contract deployment block on Sepolia (approximate).
const DEPLOY_BLOCK = 10830000;
const CHUNK_SIZE = 2000;

/**
 * Paginated queryFilter to work within Alchemy free tier block range limits.
 */
export async function paginatedQueryFilter(
  contract: ethers.Contract,
  filter: ethers.ContractEventName,
): Promise<ethers.EventLog[]> {
  const provider = contract.runner as ethers.JsonRpcProvider;
  const currentBlock = await provider.getBlockNumber();
  const results: ethers.EventLog[] = [];

  for (let from = DEPLOY_BLOCK; from <= currentBlock; from += CHUNK_SIZE) {
    const to = Math.min(from + CHUNK_SIZE - 1, currentBlock);
    const events = await contract.queryFilter(filter, from, to);
    results.push(...(events as ethers.EventLog[]));
  }

  return results;
}
