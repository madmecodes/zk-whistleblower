"use client";

import { use } from "react";
import { useIdentity } from "@/hooks/useIdentity";
import { useOrganization } from "@/hooks/useOrganization";
import { useSubmitReport } from "@/hooks/useSubmitReport";
import { IdentityManager } from "@/components/IdentityManager";
import { ReportForm } from "@/components/ReportForm";
import { ProofStatus } from "@/components/ProofStatus";
import type { ReportContent } from "@/lib/types";

export default function SubmitReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const orgId = BigInt(id);
  const { identity, loading: idLoading } = useIdentity();
  const { org, loading: orgLoading } = useOrganization(orgId);
  const { state, submit, reset } = useSubmitReport();

  const isSubmitting = state.step !== "idle" && state.step !== "done" && state.step !== "error";

  function handleSubmit(content: ReportContent) {
    if (!identity) return;
    submit(identity, orgId, content);
  }

  if (orgLoading || idLoading) {
    return <p className="text-sm text-zinc-500">Loading...</p>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="mb-1 text-2xl font-bold">Submit Anonymous Report</h1>
        {org && (
          <p className="text-sm text-zinc-400">
            To: <span className="text-zinc-300">{org.name}</span>
          </p>
        )}
      </div>

      <section>
        <IdentityManager />
      </section>

      {!identity && (
        <div className="rounded-xl border border-yellow-900/50 bg-yellow-950/20 p-4">
          <p className="text-sm text-yellow-400">
            You need a ZK identity to submit a report. Generate one above, then
            ask your org admin to add your commitment to the group.
          </p>
        </div>
      )}

      {identity && (
        <>
          <ProofStatus state={state} onReset={reset} />
          {state.step !== "done" && (
            <ReportForm onSubmit={handleSubmit} disabled={isSubmitting || !identity} />
          )}
        </>
      )}
    </div>
  );
}
