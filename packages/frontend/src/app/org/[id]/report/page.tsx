"use client";

import { useState, use } from "react";
import { Identity } from "@semaphore-protocol/core";
import { useOrganization } from "@/hooks/useOrganization";
import { useSubmitReport } from "@/hooks/useSubmitReport";
import { deriveIdentity, fetchGroupMembers } from "@/lib/semaphore";
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
  const { org, loading: orgLoading } = useOrganization(orgId);
  const { state, submit, reset } = useSubmitReport();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authenticating, setAuthenticating] = useState(false);

  const isSubmitting =
    state.step !== "idle" && state.step !== "done" && state.step !== "error";

  async function handleAuthenticate(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setAuthenticating(true);
    setAuthError(null);

    try {
      const derived = deriveIdentity(email, password, orgId);
      const members = await fetchGroupMembers(orgId);
      const commitmentStr = derived.commitment.toString();

      if (members.includes(commitmentStr)) {
        setIdentity(derived);
      } else {
        setAuthError("Invalid credentials or you are not a member of this organization.");
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Authentication failed";
      setAuthError(message);
    } finally {
      setAuthenticating(false);
    }
  }

  function handleSubmit(content: ReportContent) {
    if (!identity) return;
    submit(identity, orgId, content);
  }

  function handleLogout() {
    setIdentity(null);
    setEmail("");
    setPassword("");
    setAuthError(null);
    reset();
  }

  if (orgLoading) {
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

      {!identity ? (
        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-1 text-lg font-semibold">Authenticate</h2>
          <p className="mb-4 text-sm text-zinc-500">
            Enter the credentials provided by your organization admin. Your
            identity is derived locally and never sent to any server.
          </p>
          <form onSubmit={handleAuthenticate} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={authenticating}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={authenticating}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={authenticating || !email.trim() || !password.trim()}
              className="w-full rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
            >
              {authenticating ? "Verifying membership..." : "Verify & Continue"}
            </button>
          </form>
          {authError && (
            <p className="mt-3 text-sm text-red-400">{authError}</p>
          )}
        </section>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-lg border border-green-900/50 bg-green-950/20 px-4 py-3">
            <p className="text-sm text-green-400">
              Authenticated as verified member
            </p>
            <button
              onClick={handleLogout}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              Logout
            </button>
          </div>

          <ProofStatus state={state} onReset={reset} />
          {state.step !== "done" && (
            <ReportForm
              onSubmit={handleSubmit}
              disabled={isSubmitting || !identity}
            />
          )}
        </>
      )}
    </div>
  );
}
