"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { WHISTLEBLOWER_ABI, getProvider } from "@/lib/contracts";
import { WHISTLEBLOWER_ADDRESS } from "@/lib/constants";
import { IdentityManager } from "@/components/IdentityManager";

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

    const provider = getProvider();
    const contract = new ethers.Contract(
      WHISTLEBLOWER_ADDRESS,
      WHISTLEBLOWER_ABI,
      provider
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
          <Link
            href="/org/create"
            className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500"
          >
            Create Organization
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Your Identity
        </h2>
        <IdentityManager />
      </section>

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
              1. Join an Organization
            </h3>
            <p className="text-sm text-zinc-500">
              Generate a ZK identity and share your commitment with the org
              admin. They add you to the on-chain group.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-zinc-200">
              2. Submit a Report
            </h3>
            <p className="text-sm text-zinc-500">
              Write your report. A zero-knowledge proof is generated proving
              your membership without revealing who you are.
            </p>
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-zinc-200">
              3. Verified On-Chain
            </h3>
            <p className="text-sm text-zinc-500">
              The report is stored on IPFS and verified on Ethereum. Anyone can
              confirm it came from a real member.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
