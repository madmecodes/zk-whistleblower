import { ethers } from "hardhat";

/**
 * Seed script: creates a demo "Google Inc" org and adds 10 pre-populated
 * employees on-chain. Run after deploying the contract.
 *
 * Usage: npx hardhat run scripts/seed.ts --network sepolia
 */

const CONTRACT_ADDRESS = "0xDb62227b139d98dF70FAb1695e0b8613ea832A2D";

const DEMO_MEMBERS = [
  { email: "alice.chen@google.com", password: "alice2024" },
  { email: "bob.martinez@google.com", password: "bob2024" },
  { email: "carol.johnson@google.com", password: "carol2024" },
  { email: "david.kim@google.com", password: "david2024" },
  { email: "emma.wright@google.com", password: "emma2024" },
  { email: "frank.patel@google.com", password: "frank2024" },
  { email: "grace.lee@google.com", password: "grace2024" },
  { email: "henry.zhang@google.com", password: "henry2024" },
  { email: "iris.thompson@google.com", password: "iris2024" },
  { email: "james.wilson@google.com", password: "james2024" },
];

function deriveCommitment(email: string, password: string, orgId: bigint): bigint {
  // Must match frontend's deriveIdentity() exactly:
  // seed = keccak256(email.toLowerCase().trim() + ":" + password + ":" + orgId.toString())
  // commitment = Identity(seed).commitment
  //
  // We import Semaphore Identity here to ensure consistency.
  const { Identity } = require("@semaphore-protocol/core");
  const seed = ethers.keccak256(
    ethers.toUtf8Bytes(
      email.toLowerCase().trim() + ":" + password + ":" + orgId.toString()
    )
  );
  const identity = new Identity(seed);
  return identity.commitment;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Seeding with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH\n");

  const abi = [
    "function createOrganization(string _name) external returns (uint256)",
    "function joinOrganization(uint256 _orgId, uint256 _identityCommitment) external",
    "function getOrganization(uint256 _orgId) external view returns (tuple(uint256 groupId, string name, address admin, uint256 memberCount, uint256 createdAt))",
    "event OrganizationCreated(uint256 indexed orgId, string name, address admin)",
    "event MemberAdded(uint256 indexed orgId, uint256 identityCommitment)",
  ];

  const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, deployer);

  // Step 1: Create organization
  console.log('Creating organization "Google Inc"...');
  const createTx = await contract.createOrganization("Google Inc");
  const createReceipt = await createTx.wait();

  // Parse org ID from event
  let orgId: bigint | null = null;
  for (const log of createReceipt.logs) {
    try {
      const parsed = contract.interface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed?.name === "OrganizationCreated") {
        orgId = parsed.args[0];
        break;
      }
    } catch {
      // skip non-matching logs
    }
  }

  if (orgId === null) {
    throw new Error("Failed to parse OrganizationCreated event");
  }

  console.log(`Organization created with ID: ${orgId}\n`);

  // Step 2: Add all demo members
  for (const member of DEMO_MEMBERS) {
    const commitment = deriveCommitment(member.email, member.password, orgId);
    console.log(`Adding ${member.email}...`);
    const tx = await contract.joinOrganization(orgId, commitment);
    await tx.wait();
    console.log(`  Commitment: ${commitment.toString().slice(0, 20)}...`);
  }

  console.log(`\n--- Seed Complete ---`);
  console.log(`Organization: Google Inc`);
  console.log(`Org ID: ${orgId}`);
  console.log(`Members added: ${DEMO_MEMBERS.length}`);
  console.log(`Contract: ${CONTRACT_ADDRESS}`);
  console.log(`\nUpdate NEXT_PUBLIC_DEMO_ORG_ID=${orgId} in .env.local`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
