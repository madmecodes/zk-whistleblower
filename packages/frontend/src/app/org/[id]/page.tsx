"use client";

import { useState, use } from "react";
import Link from "next/link";
import { useOrganization } from "@/hooks/useOrganization";
import { useReports } from "@/hooks/useReports";
import { getSigner, getWriteContract } from "@/lib/contracts";
import { IdentityManager } from "@/components/IdentityManager";
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

  const [commitment, setCommitment] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSuccess, setMemberSuccess] = useState(false);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!commitment.trim()) return;

    setAddingMember(true);
    setMemberError(null);
    setMemberSuccess(false);

    try {
      const signer = await getSigner();
      const contract = getWriteContract(signer);
      const tx = await contract.joinOrganization(orgId, BigInt(commitment.trim()));
      await tx.wait();
      setMemberSuccess(true);
      setCommitment("");
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

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Your Identity
        </h2>
        <IdentityManager />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Add Member (Admin Only)
        </h2>
        <form onSubmit={handleAddMember} className="flex gap-3">
          <input
            type="text"
            value={commitment}
            onChange={(e) => setCommitment(e.target.value)}
            placeholder="Identity commitment (uint256)"
            disabled={addingMember}
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={addingMember || !commitment.trim()}
            className="rounded-lg bg-zinc-700 px-6 py-2.5 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-50"
          >
            {addingMember ? "Adding..." : "Add Member"}
          </button>
        </form>
        {memberError && (
          <p className="mt-2 text-sm text-red-400">{memberError}</p>
        )}
        {memberSuccess && (
          <p className="mt-2 text-sm text-green-400">Member added.</p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Reports ({reports.length})
        </h2>
        {reportsLoading ? (
          <p className="text-sm text-zinc-600">Loading reports...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-zinc-600">No reports yet.</p>
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
