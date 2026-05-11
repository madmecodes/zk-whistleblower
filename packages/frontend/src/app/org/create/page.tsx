"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSigner, getWriteContract } from "@/lib/contracts";

export default function CreateOrgPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const signer = await getSigner();
      const contract = getWriteContract(signer);

      const tx = await contract.createOrganization(name.trim());
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log: { topics: string[]; data: string }) => {
          try {
            return contract.interface.parseLog({
              topics: [...log.topics],
              data: log.data,
            });
          } catch {
            return null;
          }
        })
        .find(
          (e: { name: string } | null) => e?.name === "OrganizationCreated"
        );

      if (event) {
        const orgId = event.args[0].toString();
        router.push(`/org/${orgId}`);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create org";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-2 text-2xl font-bold">Create Organization</h1>
      <p className="mb-8 text-sm text-zinc-400">
        Create an on-chain organization. You will be the admin and can add
        members to the ZK group.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Organization Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            placeholder="e.g., Acme Corp"
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-950/30 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create Organization"}
        </button>
      </form>
    </div>
  );
}
