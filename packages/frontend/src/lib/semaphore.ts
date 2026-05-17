import {
  Identity,
  Group,
  generateProof,
  type SemaphoreProof,
} from "@semaphore-protocol/core";
import { ethers } from "ethers";
import { SEMAPHORE_ADDRESS, SEPOLIA_RPC_URL } from "./constants";

export { type SemaphoreProof };

export function createIdentity(): Identity {
  return new Identity();
}

export function importIdentity(privateKey: string): Identity {
  return Identity.import(privateKey);
}

export function exportIdentity(identity: Identity): string {
  return identity.export();
}

/**
 * Derive a deterministic Semaphore identity from email + password + orgId.
 * Same inputs always produce the same identity, so:
 *  - Admin enters email+password -> derives commitment -> adds on-chain
 *  - Member enters same email+password -> derives same identity -> can generate proofs
 */
export function deriveIdentity(
  email: string,
  password: string,
  orgId: bigint
): Identity {
  const seed = ethers.keccak256(
    ethers.toUtf8Bytes(
      email.toLowerCase().trim() + ":" + password + ":" + orgId.toString()
    )
  );
  return new Identity(seed);
}

export async function fetchGroupMembers(groupId: bigint): Promise<string[]> {
  // Alchemy free tier has strict eth_getLogs block range limits.
  // We paginate the MemberAdded event query in chunks.
  const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  const semaphoreAbi = [
    "event MemberAdded(uint256 indexed groupId, uint256 index, uint256 identityCommitment, uint256 merkleTreeRoot)",
  ];
  const contract = new ethers.Contract(SEMAPHORE_ADDRESS, semaphoreAbi, provider);

  const currentBlock = await provider.getBlockNumber();
  const startBlock = 10830000; // Approximate deployment block
  const chunkSize = 2000;
  const members: string[] = [];

  for (let from = startBlock; from <= currentBlock; from += chunkSize) {
    const to = Math.min(from + chunkSize - 1, currentBlock);
    const filter = contract.filters.MemberAdded(groupId);
    const events = await contract.queryFilter(filter, from, to);
    for (const event of events) {
      const log = event as ethers.EventLog;
      members.push(log.args[2].toString());
    }
  }

  return members;
}

export function buildGroup(members: string[]): Group {
  return new Group(members.map((m) => BigInt(m)));
}

export function computeScope(orgId: bigint, category: string): bigint {
  const packed = ethers.solidityPacked(
    ["uint256", "string"],
    [orgId, category]
  );
  const hash = ethers.keccak256(packed);
  return BigInt(hash);
}

export function computeMessage(ipfsCid: string): bigint {
  return BigInt(ethers.keccak256(ethers.toUtf8Bytes(ipfsCid)));
}

export async function generateReportProof(
  identity: Identity,
  groupMembers: string[],
  orgId: bigint,
  category: string,
  ipfsCid: string
): Promise<SemaphoreProof> {
  const group = buildGroup(groupMembers);
  const scope = computeScope(orgId, category);
  const message = computeMessage(ipfsCid);
  return generateProof(identity, group, message, scope);
}
