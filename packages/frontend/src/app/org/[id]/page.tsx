"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useOrganization } from "@/hooks/useOrganization";
import { useReports } from "@/hooks/useReports";
import { getSigner, getWriteContract } from "@/lib/contracts";
import { deriveIdentity } from "@/lib/semaphore";
import { DEMO_ORG_ID } from "@/lib/constants";
import { DEMO_ORG } from "@/lib/demo";
import { ReportCard } from "@/components/ReportCard";

export default function OrgDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orgId = BigInt(id);
  const { org, loading: orgLoading, error: orgError } = useOrganization(orgId);
  const { reports, loading: reportsLoading } = useReports(orgId);

  const isDemoOrg = DEMO_ORG_ID !== null && orgId === DEMO_ORG_ID;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState<string | null>(null);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setAddingMember(true);
    setMemberError(null);
    setMemberSuccess(null);

    try {
      const identity = deriveIdentity(email, password, orgId);
      const commitment = identity.commitment;

      const signer = await getSigner();
      const contract = getWriteContract(signer);
      const tx = await contract.joinOrganization(orgId, commitment);
      await tx.wait();
      setMemberSuccess(email.trim());
      setEmail("");
      setPassword("");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to add member";
      setMemberError(message);
    } finally {
      setAddingMember(false);
    }
  }

  if (orgLoading) {
    return <p className="text-sm text-zinc-500">Loading organization...</p>;
  }

  if (orgError || !org) {
    return (
      <p className="text-sm text-red-400">
        {orgError || "Organization not found"}
      </p>
    );
  }

  const createdDate = new Date(Number(org.createdAt) * 1000);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-1 text-3xl font-bold">{org.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
          <span>Group ID: {org.groupId.toString()}</span>
          <span>Members: {org.memberCount.toString()}</span>
          <span>Created: {createdDate.toLocaleDateString()}</span>
        </div>
        <p className="mt-1 text-xs font-mono text-zinc-600">
          Admin: {org.admin}
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href={`/org/${id}/report`}
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500"
        >
          Submit Anonymous Report
        </Link>
      </div>

      {isDemoOrg && (
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Registered Employees ({DEMO_ORG.members.length})
          </h2>
          <p className="mb-3 text-xs text-zinc-500">
            Employees verified via corporate email domain (@{DEMO_ORG.domain}).
            Each member&apos;s ZK identity commitment is registered on-chain.
          </p>
          <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900">
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Email</th>
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Role</th>
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Department</th>
                  <th className="px-4 py-2.5 text-left font-medium text-zinc-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_ORG.members.map((member) => (
                  <tr key={member.email} className="border-b border-zinc-800/50">
                    <td className="px-4 py-2 font-mono text-xs text-zinc-300">{member.email}</td>
                    <td className="px-4 py-2 text-zinc-400">{member.role}</td>
                    <td className="px-4 py-2 text-zinc-500">{member.department}</td>
                    <td className="px-4 py-2">
                      <span className="rounded-full bg-green-950/50 px-2 py-0.5 text-xs text-green-400">
                        On-chain
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Add Member (Admin Only)
        </h2>
        <p className="mb-3 text-xs text-zinc-500">
          Enter credentials for the organization member. Share these credentials
          with them privately -- they will use them to authenticate when
          submitting anonymous reports.
        </p>
        <form onSubmit={handleAddMember} className="space-y-3">
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Member email"
              disabled={addingMember}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={addingMember}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={addingMember || !email.trim() || !password.trim()}
            className="rounded-lg bg-zinc-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-50"
          >
            {addingMember ? "Adding Member..." : "Add Member"}
          </button>
        </form>
        {memberError && (
          <p className="mt-2 text-sm text-red-400">{memberError}</p>
        )}
        {memberSuccess && (
          <p className="mt-2 text-sm text-green-400">
            Member {memberSuccess} added. Share the credentials with them.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Reports ({reports.length})
        </h2>
        {reportsLoading ? (
          <p className="text-sm text-zinc-600">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-zinc-600">No reports submitted yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reports.map((r) => (
              <ReportCard key={r.reportId} report={r} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
