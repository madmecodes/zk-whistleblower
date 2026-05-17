"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WHISTLEBLOWER_ABI, queryEvents, getLogsProvider } from "@/lib/contracts";
import { WHISTLEBLOWER_ADDRESS, DEMO_ORG_ID } from "@/lib/constants";
import { ethers } from "ethers";
import { DEMO_ORG } from "@/lib/demo";

interface OrgEntry {
  orgId: bigint;
  name: string;
  admin: string;
}

export default function Home() {
  const [orgs, setOrgs] = useState<OrgEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!WHISTLEBLOWER_ADDRESS) {
      setLoading(false);
      return;
    }

    const logsProvider = getLogsProvider();
    const contract = new ethers.Contract(
      WHISTLEBLOWER_ADDRESS,
      WHISTLEBLOWER_ABI,
      logsProvider
    );

    contract
      .queryFilter(contract.filters.OrganizationCreated())
      .then((events) => {
        const parsed = events.map((e) => {
          const log = e as ethers.EventLog;
          return {
            orgId: log.args[0],
            name: log.args[1],
            admin: log.args[2],
          };
        });
        setOrgs(parsed.reverse());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-12">
      <section className="pt-8">
        <h1 className="mb-4 text-4xl font-bold">ZK Whistleblower</h1>
        <p className="max-w-2xl text-lg text-zinc-400">
          Submit anonymous reports to organizations with cryptographic proof
          that you are a verified member -- without revealing your identity.
          Built with Semaphore V4 zero-knowledge proofs and IPFS.
        </p>
        <div className="mt-6 flex gap-4">
          {DEMO_ORG_ID && (
            <Link
              href={`/org/${DEMO_ORG_ID.toString()}`}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500"
            >
              Try Live Demo ({DEMO_ORG.name})
            </Link>
          )}
          <Link
            href="/org/create"
            className="rounded-lg border border-zinc-700 px-6 py-3 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:text-white"
          >
            Create Organization
          </Link>
        </div>
      </section>

      {DEMO_ORG_ID && (
        <section className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-6">
          <h2 className="mb-2 text-lg font-semibold text-blue-300">
            Live Demo: {DEMO_ORG.name}
          </h2>
          <p className="mb-4 text-sm text-zinc-400">
            This organization has {DEMO_ORG.members.length} pre-registered employees
            verified via corporate email domain (@{DEMO_ORG.domain}). Their ZK identity
            commitments are already on-chain. Try submitting an anonymous report as any employee.
          </p>
          <div className="mb-4 overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th className="px-4 py-2 text-left font-medium text-zinc-400">Email</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-400">Password</th>
                  <th className="px-4 py-2 text-left font-medium text-zinc-400">Role</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ORG.members.slice(0, 3).map((member) => (
                  <tr key={member.email} className="border-b border-zinc-800/50">
                    <td className="px-4 py-1.5 font-mono text-xs text-zinc-300">{member.email}</td>
                    <td className="px-4 py-1.5 font-mono text-xs text-zinc-300">{member.password}</td>
                    <td className="px-4 py-1.5 text-zinc-500">{member.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/org/${DEMO_ORG_ID.toString()}/report`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Submit Report as Employee
            </Link>
            <Link
              href={`/org/${DEMO_ORG_ID.toString()}`}
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-zinc-500"
            >
              View Admin Dashboard
            </Link>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Organizations
        </h2>
        {loading ? (
          <p className="text-sm text-zinc-600">Loading...</p>
        ) : !WHISTLEBLOWER_ADDRESS ? (
          <p className="text-sm text-zinc-600">
            Contract not deployed yet. Set NEXT_PUBLIC_WHISTLEBLOWER_ADDRESS in
            .env.local
          </p>
        ) : orgs.length === 0 ? (
          <p className="text-sm text-zinc-600">No organizations yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {orgs.map((org) => (
              <Link
                key={org.orgId.toString()}
                href={`/org/${org.orgId.toString()}`}
                className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-600"
              >
                <h3 className="mb-1 text-lg font-semibold">{org.name}</h3>
                <p className="text-xs font-mono text-zinc-500">
                  Admin: {org.admin.slice(0, 6)}...{org.admin.slice(-4)}
                </p>
                <p className="text-xs text-zinc-600">
                  Group ID: {org.orgId.toString()}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-zinc-800 pt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          How It Works
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <h3 className="mb-1 font-semibold text-zinc-200">
              1. Corporate Directory Verification
            </h3>
            <p className="text-sm text-zinc-500">
              Employees are verified via corporate email domain. Their ZK identity
              commitments are derived from credentials and registered on-chain by
              the organization admin.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-zinc-200">
              2. Authenticate & Report
            </h3>
            <p className="text-sm text-zinc-500">
              Members enter their corporate email and password to prove membership.
              A Groth16 zero-knowledge proof is generated entirely client-side --
              no server ever sees your identity.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-zinc-200">
              3. Verified Anonymous on Ethereum
            </h3>
            <p className="text-sm text-zinc-500">
              The report is pinned to IPFS and the ZK proof is verified by a Solidity
              smart contract on Ethereum. Anyone can confirm it came from a real
              employee, but nobody can determine who.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-800 pt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Security Model
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-zinc-800 p-4">
            <h3 className="mb-1 text-sm font-semibold text-zinc-200">Zero-Knowledge Proofs</h3>
            <p className="text-xs text-zinc-500">
              Semaphore V4 uses Groth16 proofs over a LeanIMT Merkle tree.
              The proof demonstrates group membership without revealing which leaf
              (identity) in the tree generated it.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 p-4">
            <h3 className="mb-1 text-sm font-semibold text-zinc-200">Nullifier-Based Spam Prevention</h3>
            <p className="text-xs text-zinc-500">
              Each identity can only submit one report per category per org
              (scope = keccak256(orgId + category)). Double-reporting is prevented
              without revealing the reporter.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 p-4">
            <h3 className="mb-1 text-sm font-semibold text-zinc-200">IPFS Content Integrity</h3>
            <p className="text-xs text-zinc-500">
              Report content is pinned to IPFS (content-addressed). The ZK proof
              binds to the IPFS CID (message = keccak256(cid)), ensuring the
              verified report cannot be tampered with.
            </p>
          </div>
          <div className="rounded-lg border border-zinc-800 p-4">
            <h3 className="mb-1 text-sm font-semibold text-zinc-200">On-Chain Verification</h3>
            <p className="text-xs text-zinc-500">
              All proof verification happens in a Solidity smart contract on Ethereum.
              No trusted server is needed -- the blockchain acts as a permissionless
              verification layer.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
