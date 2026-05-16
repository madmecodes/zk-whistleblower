# ZK Whistleblower

A decentralized anonymous whistleblowing platform built on Ethereum. Organization members submit reports with cryptographic proof that they are verified insiders -- without revealing which member they are. Zero-knowledge proofs (Semaphore V4) guarantee anonymity, IPFS provides censorship-resistant storage, and Ethereum provides on-chain verification.

## Table of Contents

- [Problem](#problem)
- [Solution](#solution)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [Demo Walkthrough](#demo-walkthrough)
- [Vercel Deployment](#vercel-deployment)
- [Smart Contract](#smart-contract)
- [Security Model](#security-model)
- [Outcome](#outcome)

## Problem

Whistleblowing is critical for exposing fraud, corruption, and safety violations. But whistleblowers face severe retaliation -- 83% experience termination, demotion, or legal threats (Government Accountability Project, 2023).

Existing platforms like SecureDrop and GlobaLeaks rely on **trusted servers** for anonymity. If the server is compromised, every whistleblower is exposed. These platforms also cannot prove that a report came from an actual insider vs. a random outsider fabricating claims.

## Solution

ZK-Whistleblower solves both problems using zero-knowledge proofs:

- **Anonymity without trust**: A ZK proof mathematically guarantees the reporter's identity is hidden. No server, admin, or Ethereum miner can deanonymize them.
- **Verifiable authenticity**: The proof demonstrates the reporter is a confirmed member of the organization. Anyone can verify this on-chain.
- **Censorship resistance**: Reports live on IPFS (distributed storage) and Ethereum (immutable blockchain). No single party can delete or modify them.
- **No database needed**: The blockchain itself serves as the membership registry. Identity is derived deterministically from credentials.

## How It Works

```
Admin Flow:
  1. Admin connects wallet, creates organization on-chain
  2. Admin adds members by entering their email + password
     -> System derives a ZK identity commitment from credentials
     -> Commitment is added to the on-chain Semaphore group via admin's wallet

Whistleblower Flow:
  3. Member visits the report page, enters email + password
     -> System re-derives the same identity locally (nothing sent to server)
     -> Checks if the commitment exists in the on-chain group
     -> If yes: member is authenticated
  4. Member writes report (title, body, category, evidence links)
  5. Report content is pinned to IPFS (censorship-resistant storage)
  6. A Groth16 ZK proof is generated in the browser proving:
     - "I am a member of this organization"
     - "This proof is bound to this specific report content"
     - WITHOUT revealing which member generated the proof
  7. Proof + report metadata submitted to Ethereum smart contract
  8. Contract verifies the proof on-chain using Semaphore V4

Viewer Flow:
  9. Anyone visits the report page
  10. Sees "Verified" badge -- cryptographic guarantee it came from a real member
  11. Cannot determine which member submitted it
```

### The ZK Magic

The core primitive is **Semaphore V4** -- a zero-knowledge group membership protocol:

- Each member has an **EdDSA identity** (private key + public commitment)
- All commitments are stored in a **Lean Incremental Merkle Tree** on-chain
- To prove membership, a member generates a **Groth16 zk-SNARK** proving they know a private key whose commitment is a leaf in the tree -- without revealing which leaf
- A **nullifier** (deterministic hash of private key + scope) prevents duplicate reports while preserving anonymity across categories

**Identity derivation**: `Identity = Semaphore(keccak256(email + password + orgId))`. Same inputs always produce the same identity, so the admin can register members and members can authenticate -- all without a database.

**Scope mechanism**: `scope = keccak256(orgId + category)`. This means:
- Same member, same category = same nullifier (duplicate detected, rejected)
- Same member, different category = different nullifier (reports are unlinkable)

## Architecture

```
+---------------------------------------------------+
|                  Browser (Client)                  |
|                                                    |
|  email + password ----> deriveIdentity()           |
|                           |                        |
|                           v                        |
|                  Semaphore Identity                 |
|                           |                        |
|                           v                        |
|              generateProof() [Groth16 WASM]        |
|                           |                        |
|                           v                        |
|                  Submit Transaction                 |
+--------------------------+------------------------+
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
      +-----------+  +-----------+  +-----------+
      | Ethereum  |  |   IPFS    |  | Next.js   |
      | (Sepolia) |  | (Pinata)  |  |   API     |
      |           |  |           |  |           |
      | Semaphore |  |  Report   |  | /api/pin  |
      | V4 verify |  |  content  |  | /api/read |
      +-----------+  +-----------+  +-----------+
```

**Data flow summary:**
- Report **content** (title, body, evidence) lives on **IPFS** -- identified by content hash (CID)
- Report **metadata** (orgId, CID, category, timestamp, nullifier) lives on **Ethereum**
- The **ZK proof** binds the two: `message = keccak256(CID)`, verified on-chain
- **No data** is stored on any centralized server

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Smart Contract | Solidity 0.8.23, Hardhat | On-chain org/report management, wraps Semaphore V4 |
| ZK Proofs | Semaphore V4.13.0 | EdDSA identities, LeanIMT Merkle trees, Groth16 proofs |
| Frontend | Next.js 16, React 19 | Server-side rendering, API routes, client app |
| Styling | Tailwind CSS v4 | Utility-first dark-themed UI |
| Ethereum | ethers.js v6 | Wallet connection, contract interaction, event queries |
| IPFS | Pinata SDK | Server-side report pinning and retrieval |
| Monorepo | pnpm workspaces | Unified dependency management |
| Testnet | Ethereum Sepolia | Free deployment and testing |

## Project Structure

```
zk-whistleblower/
  package.json                    # Root workspace scripts
  pnpm-workspace.yaml             # Monorepo config
  .env.example                    # Environment variables template
  README.md
  packages/
    contracts/
      contracts/
        WhistleblowerPlatform.sol # Main contract -- wraps Semaphore V4
        MockSemaphore.sol         # Mock for unit tests (no real ZK)
      deploy/
        deploy.ts                 # Sepolia deployment + Etherscan verify
      test/
        WhistleblowerPlatform.test.ts  # 5 unit tests
      hardhat.config.ts           # Solidity 0.8.23, optimizer, Sepolia network
    frontend/
      next.config.ts              # Turbopack + webpack WASM fallbacks
      src/
        app/
          page.tsx                # Landing -- lists organizations
          org/create/page.tsx     # Create new organization (admin)
          org/[id]/page.tsx       # Org dashboard -- add members (admin)
          org/[id]/report/page.tsx  # Submit anonymous report (member)
          reports/[id]/page.tsx   # View verified report (anyone)
          api/pin/route.ts        # POST -- pin report JSON to IPFS
          api/report/[cid]/route.ts  # GET -- fetch report from IPFS
        components/
          Header.tsx              # Nav bar with wallet connection
          ConnectWallet.tsx       # MetaMask connect/switch chain
          ReportForm.tsx          # Title, body, category, evidence fields
          ReportCard.tsx          # Report preview card
          ProofStatus.tsx         # Step-by-step proof generation progress
        lib/
          semaphore.ts            # deriveIdentity(), generateProof(), fetchGroupMembers()
          contracts.ts            # ABI, provider, signer, contract instances
          constants.ts            # Chain ID, addresses, report categories
          types.ts                # TypeScript interfaces
          pinata.ts               # Server-side Pinata SDK wrapper
        hooks/
          useOrganization.ts      # Fetch org data from contract
          useReports.ts           # Fetch reports via event logs
          useSubmitReport.ts      # 5-step submission pipeline with state machine
```

## Local Setup

### Prerequisites

| Requirement | How to Get It |
|------------|---------------|
| **Node.js 22+** | [nodejs.org](https://nodejs.org/) |
| **pnpm 9+** | `npm install -g pnpm@9` |
| **MetaMask** | [metamask.io](https://metamask.io/) -- browser extension |
| **Sepolia ETH** | Free from [Google Cloud faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) or [Chainlink faucet](https://faucets.chain.link/sepolia) |
| **Alchemy account** (free) | [alchemy.com](https://www.alchemy.com/) -- create app, enable Ethereum Sepolia, copy the endpoint URL |
| **Pinata account** (free) | [pinata.cloud](https://pinata.cloud/) -- create API key (get JWT), note your gateway URL |

### Step 1: Clone and Install

```bash
git clone https://github.com/madmecodes/zk-whistleblower.git
cd zk-whistleblower
pnpm install
```

### Step 2: Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Alchemy Sepolia RPC URL (from your Alchemy dashboard)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY

# MetaMask private key (export from MetaMask -- testnet wallet only!)
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY

# Optional: Etherscan API key for contract verification
ETHERSCAN_API_KEY=
```

### Step 3: Compile and Test the Contract

```bash
# Compile Solidity
pnpm contracts:compile

# Run unit tests (5 tests, uses local Hardhat network)
pnpm contracts:test
```

Expected output:
```
WhistleblowerPlatform
  createOrganization
    > should create an org and emit OrganizationCreated
  joinOrganization
    > should add a member when called by admin
    > should revert when called by non-admin
    > should revert for non-existent org
  submitReport
    > should revert for non-existent org

5 passing
```

### Step 4: Deploy to Sepolia

```bash
pnpm contracts:deploy:sepolia
```

This will output something like:
```
WhistleblowerPlatform deployed to: 0xAa0ec97Ba464f381408b2a696cD6850C8139Fceb
```

Copy the deployed address.

### Step 5: Configure the Frontend

Create `packages/frontend/.env.local`:

```env
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_SEMAPHORE_ADDRESS=0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D
NEXT_PUBLIC_WHISTLEBLOWER_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
NEXT_PUBLIC_PINATA_GATEWAY=your-gateway.mypinata.cloud
PINATA_JWT=your_pinata_jwt_token
```

### Step 6: Run the Frontend

```bash
pnpm frontend:dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser with MetaMask installed.

## Live Demo

**Deployed at**: https://frontend-one-pied-56.vercel.app

The live demo features a pre-populated **Google Inc** organization (Org ID: 543) with 10 registered employees on Ethereum Sepolia. You can immediately test the full flow without setting up anything.

### Demo Credentials

| Email | Password | Role | Department |
|-------|----------|------|------------|
| alice.chen@google.com | alice2024 | Software Engineer | Search |
| bob.martinez@google.com | bob2024 | Product Manager | Cloud |
| carol.johnson@google.com | carol2024 | Data Scientist | AI Research |
| david.kim@google.com | david2024 | Security Engineer | Trust & Safety |
| emma.wright@google.com | emma2024 | Engineering Manager | Ads |
| frank.patel@google.com | frank2024 | Site Reliability Engineer | Infrastructure |
| grace.lee@google.com | grace2024 | UX Researcher | Hardware |
| henry.zhang@google.com | henry2024 | Staff Engineer | Android |
| iris.thompson@google.com | iris2024 | Legal Counsel | Legal |
| james.wilson@google.com | james2024 | Finance Analyst | Finance |

### Quick Demo Steps

1. Open the deployed URL, click **"Try Live Demo (Google Inc)"**
2. Click **"Submit Anonymous Report"**
3. Enter any employee credentials above (e.g., `alice.chen@google.com` / `alice2024`)
4. Fill in a report and submit -- you need MetaMask on Sepolia with some ETH
5. View the submitted report -- it shows "Verified" but reveals nothing about which employee submitted it

### Admin Dashboard Demo

Visit the org dashboard to see the full employee directory pre-registered on-chain. The admin view shows all 10 members with their roles and departments, alongside existing reports.

## Demo Walkthrough (Custom Org)

### 1. Create an Organization (Admin)

1. Open the app, connect MetaMask (must be on Sepolia network)
2. Click **"Create Organization"**
3. Enter a name (e.g., "Acme Corp"), submit
4. MetaMask asks to confirm the transaction -- confirm it
5. You're redirected to the org dashboard

### 2. Register Members (Admin)

1. On the org dashboard, find the **"Add Member"** section
2. Enter the member's email (e.g., `alice@acme.com`) and a password (e.g., `secret123`)
3. Click **"Add Member"** -- MetaMask confirms the transaction
4. Behind the scenes: `identity = hash(email + password + orgId)` is computed, and the commitment is added to the on-chain Semaphore group
5. Share the email + password with the member privately (in person, encrypted message, etc.)

### 3. Submit an Anonymous Report (Whistleblower)

1. The member opens `/org/{id}/report`
2. Enters their email + password in the **"Authenticate"** section
3. System derives the identity locally, checks if the commitment exists on-chain
4. If valid: the report form appears
5. Fill in the report: title, body, category (fraud/corruption/safety/etc.), evidence links
6. Click **"Submit Anonymous Report"**
7. The proof pipeline runs (visible progress indicator):
   - Pinning report to IPFS...
   - Fetching group members...
   - Generating ZK proof... (3-8 seconds, runs in browser via WASM)
   - Submitting transaction...
   - Confirming...
8. MetaMask asks to confirm -- confirm it
9. Report is now on-chain and on IPFS

### 4. View a Verified Report (Anyone)

1. Go to `/reports/{id}` (linked from the org dashboard)
2. See the report with a green **"Verified"** badge
3. This means: cryptographic proof confirmed the submitter is a real org member
4. The viewer sees: title, body, evidence, category, timestamp, IPFS CID, nullifier
5. The viewer **cannot** determine which member submitted it

## Vercel Deployment

The frontend deploys to Vercel with zero additional infrastructure (no database needed).

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com/), import the repository
3. Set **Root Directory** to `packages/frontend`
4. Set **Framework Preset** to Next.js
5. Add these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` |
| `NEXT_PUBLIC_SEMAPHORE_ADDRESS` | `0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D` |
| `NEXT_PUBLIC_WHISTLEBLOWER_ADDRESS` | Your deployed contract address |
| `NEXT_PUBLIC_SEPOLIA_RPC_URL` | Your Alchemy Sepolia URL |
| `NEXT_PUBLIC_PINATA_GATEWAY` | Your Pinata gateway (e.g., `xyz.mypinata.cloud`) |
| `PINATA_JWT` | Your Pinata JWT token |

6. Click **Deploy**

The contract must already be deployed to Sepolia (Step 4 above) before the app will work.

## Smart Contract

`WhistleblowerPlatform.sol` is a thin wrapper around the canonical Semaphore V4 contract deployed on Sepolia (`0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D`).

### Functions

| Function | Access | Description |
|----------|--------|-------------|
| `createOrganization(name)` | Anyone | Creates a Semaphore group, caller becomes admin |
| `joinOrganization(orgId, commitment)` | Admin only | Adds an identity commitment to the group |
| `submitReport(orgId, cid, category, ...)` | Anyone with valid proof | Verifies ZK proof, stores report metadata |
| `getOrganization(orgId)` | Public view | Returns org name, admin, member count, timestamp |
| `getReport(reportId)` | Public view | Returns report metadata (CID, category, nullifier) |

### Proof Verification Flow (submitReport)

```
1. Compute scope = keccak256(orgId + category)
2. Build SemaphoreProof struct with all proof fields
3. Call semaphore.validateProof(groupId, proof)
   -> Checks Merkle root matches the group
   -> Verifies Groth16 proof (pairing check on BN254)
   -> Checks nullifier hasn't been used (prevents duplicates)
4. If valid: store report, emit ReportSubmitted event
5. If invalid: transaction reverts
```

## Security Model

| Property | How It's Achieved |
|----------|-------------------|
| **Anonymity** | Groth16 ZK proof reveals nothing about which group member generated it. The Merkle tree root commits to all members without exposing which leaf was used. |
| **Authenticity** | Only someone with a private key whose commitment is in the group's Merkle tree can generate a valid proof. Outsiders cannot forge proofs. |
| **Content integrity** | The proof's message field = `keccak256(IPFS CID)`. Changing the report content changes the CID, invalidating the proof. |
| **Spam prevention** | Nullifier = `hash(privateKey + scope)`. Same member + same category = same nullifier = rejected as duplicate. Different categories produce different nullifiers (unlinkable). |
| **Censorship resistance** | Report content on IPFS (distributed, content-addressed). Metadata on Ethereum (immutable, decentralized). No single party can remove a report. |
| **Front-running resistance** | A mempool observer who copies the proof transaction cannot change the CID (bound to message hash) or claim authorship (nullifier tied to prover's key). |

### Known Limitations and Edge Cases

**Q: The admin sets the password. Can the admin deanonymize members?**

In this demo, yes -- the admin derives commitments from known credentials. In production, the fix is straightforward: members self-register by choosing their own passwords via an email domain verification flow (e.g., send a confirmation code to `alice@google.com`). The admin never sees the password, only the resulting commitment. The demo simplifies this to avoid needing an email server.

**Q: The Ethereum transaction sender (tx.origin) is visible. Doesn't that reveal the whistleblower?**

The transaction sender's wallet address is visible on-chain, but this only proves someone submitted the transaction. In production, this is solved by gas relayers (meta-transactions) or privacy networks like Aztec. The ZK proof itself never leaks the member's identity -- the wallet is just a gas payment mechanism. For this demo, the whistleblower's MetaMask address is unrelated to their corporate identity.

**Q: IPFS content is unencrypted. Can someone censor or read it?**

IPFS is content-addressed and distributed. Once pinned, the content is available from any IPFS gateway. Reports could optionally be encrypted with a public key before pinning. The CID binding in the ZK proof ensures tamper-proofing regardless.

**Q: What if the anonymity set is small? (e.g., only 2-3 members)**

Smaller groups weaken anonymity. With 10 members (demo), there's a 1-in-10 chance of guessing correctly. With 100+ members (production), k-anonymity is much stronger. The ZK proof guarantees are mathematical regardless of group size -- it's the practical inference risk that changes.

**Q: Can two reports from the same person be linked?**

Reports in the same category produce the same nullifier (by design -- spam prevention). Reports in different categories produce different nullifiers and are cryptographically unlinkable. An observer cannot tell if two reports across categories came from the same person.

**Q: How does this compare to SecureDrop / GlobaLeaks?**

SecureDrop relies on Tor + a trusted server. If the server is compromised, all sources are exposed. GlobaLeaks uses server-side encryption. ZK-Whistleblower has no trusted server -- verification is on-chain, storage is on IPFS, and anonymity is a mathematical guarantee rather than a trust assumption.

**Q: What about front-running in the mempool?**

A mempool observer who copies a pending proof transaction cannot: (a) change the report content (bound to IPFS CID via message hash), (b) claim authorship (nullifier is tied to the prover's private key), or (c) extract the identity (the proof reveals nothing). The worst case is a miner censoring the transaction, which the user can retry.

**Q: How does Google (or any corporation) actually register employees?**

In production, the flow would be: (1) Organization registers a domain (google.com), (2) Employee visits the platform and enters their corporate email, (3) Platform sends a verification code to that email, (4) Employee enters the code + chooses a password, (5) Platform derives the ZK commitment and adds it on-chain. The admin never touches individual passwords. This demo pre-populates employees to skip the email verification infrastructure.

- **Proof generation time**: Groth16 proof generation takes 3-8 seconds on modern hardware (laptop/desktop). Mobile devices may take longer.
- **One report per category**: The nullifier mechanism limits each member to one report per category. A future enhancement could use time-windowed scopes to allow periodic reporting.

## Outcome

When fully running, the platform demonstrates:

1. **An admin** can create organizations and onboard members using simple email + password credentials -- no cryptographic key management required from users
2. **A whistleblower** authenticates with their credentials and submits a report. The entire ZK proof pipeline runs in the browser -- no server ever sees their identity. The proof is verified on Ethereum, and the report is stored permanently on IPFS.
3. **Any viewer** can see the report and verify it came from a legitimate organization member, but **cannot determine which member** submitted it -- this is a mathematical guarantee from the zero-knowledge proof, not a trust assumption
4. **The smart contract** enforces that only valid proofs are accepted (no fake reports) and that no member can spam (one report per category per member via nullifiers)
5. **No centralized infrastructure** is needed beyond a standard web host (Vercel). The blockchain is the membership database, IPFS is the content store, and ZK proofs replace traditional authentication -- making the system resistant to server compromise, censorship, and insider threats

This architecture proves that **trustless anonymous whistleblowing is practical today** using commodity hardware (a browser + wallet), free testnet infrastructure, and open-source cryptographic primitives.

## License

MIT
