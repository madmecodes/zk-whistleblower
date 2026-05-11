# ZK Whistleblower

Anonymous whistleblowing platform on Ethereum using Semaphore V4 zero-knowledge proofs. Members prove they belong to an organization without revealing their identity. Reports are stored on IPFS and verified on-chain.

## How It Works

1. **Admin creates an organization** on-chain and registers members with email + password credentials
2. **Whistleblower authenticates** with their email + password -- the system derives a ZK identity locally (nothing leaves the browser)
3. **A Groth16 zero-knowledge proof** is generated client-side proving group membership without revealing which member
4. **The report is pinned to IPFS** for censorship-resistant storage and **verified on Ethereum** -- anyone can confirm it came from a real member, but nobody can determine who

### Why ZK Proofs?

Traditional whistleblowing platforms (SecureDrop, GlobaLeaks) rely on trusted servers for anonymity. If the server is compromised, every whistleblower is exposed. ZK-Whistleblower has **no trusted intermediary** -- anonymity is a mathematical property of the proof system, not a promise from a server operator.

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Browser (Client-Side)                          │
│                                                 │
│  email + password ──> deriveIdentity()          │
│                        │                        │
│                        ▼                        │
│              Semaphore Identity                  │
│                        │                        │
│                        ▼                        │
│           generateProof() [Groth16 WASM]        │
│                        │                        │
│                        ▼                        │
│              Submit Transaction                  │
└────────────────────────┬────────────────────────┘
                         │
            ┌────────────┼────────────┐
            ▼            ▼            ▼
    ┌──────────┐  ┌────────────┐  ┌──────────┐
    │ Ethereum │  │   IPFS     │  │ Next.js  │
    │ (Sepolia)│  │  (Pinata)  │  │   API    │
    │          │  │            │  │          │
    │ Semaphore│  │ Report     │  │ /api/pin │
    │ Verifier │  │ Content    │  │          │
    └──────────┘  └────────────┘  └──────────┘
```

**Key design decisions:**
- **Identity = hash(email + password + orgId)** -- deterministic derivation, no database needed
- **Scope = hash(orgId + category)** -- one report per member per category (spam prevention)
- **Message = hash(IPFS CID)** -- binds the proof to specific report content
- **Nullifier** -- prevents duplicate submissions without revealing identity

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.23, Hardhat |
| ZK Proofs | Semaphore V4.13.0 (Groth16, EdDSA, LeanIMT) |
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Ethereum | ethers.js v6, Sepolia testnet |
| Storage | IPFS via Pinata SDK |
| Monorepo | pnpm workspaces |

## Project Structure

```
zk-whistleblower/
  packages/
    contracts/             # Solidity smart contract
      contracts/
        WhistleblowerPlatform.sol   # Main contract (wraps Semaphore V4)
        MockSemaphore.sol           # Mock for unit tests
      deploy/deploy.ts              # Sepolia deployment script
      test/                         # Hardhat tests
    frontend/              # Next.js application
      src/
        app/
          page.tsx                  # Landing page (org listing)
          org/create/page.tsx       # Create organization
          org/[id]/page.tsx         # Admin dashboard (add members)
          org/[id]/report/page.tsx  # Submit anonymous report
          reports/[id]/page.tsx     # View verified report
          api/pin/route.ts          # IPFS pinning (server-side)
          api/report/[cid]/route.ts # Fetch report from IPFS
        lib/
          semaphore.ts              # ZK identity + proof generation
          contracts.ts              # Contract ABI + providers
```

## Prerequisites

You need free accounts on:

1. **[Alchemy](https://www.alchemy.com/)** or **[Infura](https://www.infura.io/)** -- Sepolia RPC endpoint
2. **[Pinata](https://pinata.cloud/)** -- IPFS pinning (get JWT token + gateway URL)
3. **[MetaMask](https://metamask.io/)** -- browser wallet with Sepolia ETH (use a [faucet](https://www.alchemy.com/faucets/ethereum-sepolia))
4. **[Etherscan](https://etherscan.io/apis)** -- API key for contract verification (optional)

## Setup

```bash
# Clone
git clone https://github.com/madmecodes/zk-whistleblower.git
cd zk-whistleblower

# Install dependencies
pnpm install

# Copy env template and fill in your values
cp .env.example .env
cp .env.example packages/frontend/.env.local
# Edit both files with your actual keys
```

### Deploy the Contract

```bash
# Compile
pnpm contracts:compile

# Run tests
pnpm contracts:test

# Deploy to Sepolia (needs SEPOLIA_RPC_URL + DEPLOYER_PRIVATE_KEY in .env)
pnpm contracts:deploy:sepolia
```

Copy the deployed contract address and set `NEXT_PUBLIC_WHISTLEBLOWER_ADDRESS` in `packages/frontend/.env.local`.

### Run the Frontend

```bash
pnpm frontend:dev
# Open http://localhost:3000
```

## Demo Walkthrough

### 1. Create an Organization (Admin)

- Connect MetaMask (Sepolia network)
- Go to `/org/create`, enter organization name
- Transaction creates an on-chain Semaphore group

### 2. Add Members (Admin)

- Go to the org dashboard `/org/{id}`
- Enter member email + password, click "Add Member"
- This derives a ZK identity commitment from the credentials and adds it on-chain
- Share the email + password with the member privately

### 3. Submit Anonymous Report (Whistleblower)

- Go to `/org/{id}/report`
- Enter email + password provided by admin
- System verifies membership by checking if the derived commitment exists on-chain
- Fill out the report form (title, body, category, evidence links)
- Click submit -- the pipeline runs:
  1. Report content pinned to IPFS
  2. Group members fetched from Semaphore contract
  3. Groth16 ZK proof generated in browser (proves membership without revealing identity)
  4. Transaction submitted to Ethereum
  5. On-chain verification confirms the proof is valid

### 4. View Verified Report (Anyone)

- Go to `/reports/{id}`
- See the report with a "Verified" badge
- Content loaded from IPFS, proof verified on Ethereum
- No information about which member submitted it

## Vercel Deployment

1. Push the repo to GitHub
2. Import in [Vercel](https://vercel.com/)
3. Set **Root Directory** to `packages/frontend`
4. Add environment variables:
   - `NEXT_PUBLIC_CHAIN_ID` = `11155111`
   - `NEXT_PUBLIC_SEMAPHORE_ADDRESS` = `0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D`
   - `NEXT_PUBLIC_WHISTLEBLOWER_ADDRESS` = your deployed contract address
   - `NEXT_PUBLIC_SEPOLIA_RPC_URL` = your Alchemy/Infura Sepolia URL
   - `NEXT_PUBLIC_PINATA_GATEWAY` = your Pinata gateway
   - `PINATA_JWT` = your Pinata JWT token
5. Deploy

No database or additional services required -- the blockchain is the backend.

## Security Model

| Property | Guarantee |
|----------|-----------|
| **Anonymity** | ZK proof reveals nothing about which member generated it |
| **Authenticity** | Only verified group members can produce valid proofs |
| **Content integrity** | Proof is bound to IPFS CID via hash -- cannot be swapped |
| **Spam prevention** | Scope-based nullifiers limit one report per member per category |
| **Censorship resistance** | Reports on IPFS + Ethereum -- no single point of removal |

**Limitation:** The admin sets member credentials, so the admin knows the email+password mapping. In a production system, members would set their own passwords via a self-registration flow, ensuring the admin cannot derive their identity. This demo prioritizes simplicity for presentation.

## License

MIT
