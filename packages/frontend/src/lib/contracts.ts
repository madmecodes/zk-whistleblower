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

// Public Sepolia RPC with no eth_getLogs block range limits.
// Alchemy free tier restricts to 10 blocks per query, making event
// scanning impractical. We use a public node for log queries only.
const LOGS_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

export function getLogsProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(LOGS_RPC_URL);
}

/**
 * Query contract events using the public RPC (no block range limits).
 */
export async function queryEvents(
  filter: ethers.ContractEventName,
): Promise<ethers.EventLog[]> {
  const contract = new ethers.Contract(
    WHISTLEBLOWER_ADDRESS,
    WHISTLEBLOWER_ABI,
    getLogsProvider()
  );
  const events = await contract.queryFilter(filter);
  return events as ethers.EventLog[];
}
