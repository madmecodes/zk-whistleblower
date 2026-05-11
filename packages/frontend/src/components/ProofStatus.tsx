"use client";

import type { SubmitState } from "@/hooks/useSubmitReport";

const STEPS = [
  { key: "pinning", label: "Pinning report to IPFS" },
  { key: "fetching-members", label: "Fetching group members" },
  { key: "generating-proof", label: "Generating ZK proof" },
  { key: "submitting-tx", label: "Submitting transaction" },
  { key: "confirming", label: "Waiting for confirmation" },
] as const;

interface ProofStatusProps {
  state: SubmitState;
  onReset: () => void;
}

export function ProofStatus({ state, onReset }: ProofStatusProps) {
  if (state.step === "idle") return null;

  if (state.step === "error") {
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-6">
        <h3 className="mb-2 text-sm font-semibold text-red-400">
          Submission Failed
        </h3>
        <p className="mb-4 text-sm text-red-300/70">{state.error}</p>
        <button
          onClick={onReset}
          className="rounded-lg border border-red-800 px-4 py-2 text-sm text-red-400 hover:bg-red-950"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (state.step === "done") {
    return (
      <div className="rounded-xl border border-green-900/50 bg-green-950/30 p-6">
        <h3 className="mb-2 text-sm font-semibold text-green-400">
          Report Submitted
        </h3>
        <p className="mb-1 text-sm text-green-300/70">
          Report #{state.reportId} has been submitted anonymously.
        </p>
        {state.txHash && (
          <a
            href={`https://sepolia.etherscan.io/tx/${state.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-400 hover:underline"
          >
            View on Etherscan
          </a>
        )}
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === state.step);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="mb-4 text-sm font-semibold text-zinc-300">
        Submitting Report...
      </h3>
      <div className="space-y-3">
        {STEPS.map((step, i) => {
          const isDone = i < currentIndex;
          const isCurrent = i === currentIndex;

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isDone
                    ? "bg-green-600 text-white"
                    : isCurrent
                      ? "bg-blue-600 text-white animate-pulse"
                      : "bg-zinc-800 text-zinc-600"
                }`}
              >
                {isDone ? "ok" : i + 1}
              </div>
              <span
                className={`text-sm ${
                  isDone
                    ? "text-green-400"
                    : isCurrent
                      ? "text-white"
                      : "text-zinc-600"
                }`}
              >
                {step.label}
                {isCurrent && "..."}
              </span>
            </div>
          );
        })}
      </div>
      {state.step === "confirming" && state.txHash && (
        <p className="mt-4 text-xs text-zinc-500">
          Tx: {state.txHash.slice(0, 20)}...
        </p>
      )}
    </div>
  );
}
