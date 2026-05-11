"use client";

import { useState, useCallback } from "react";
import { Identity } from "@semaphore-protocol/core";
import { ethers } from "ethers";
import { fetchGroupMembers, generateReportProof } from "@/lib/semaphore";
import { getSigner, getWriteContract } from "@/lib/contracts";
import type { ReportContent } from "@/lib/types";

export type SubmitStep =
  | "idle"
  | "pinning"
  | "fetching-members"
  | "generating-proof"
  | "submitting-tx"
  | "confirming"
  | "done"
  | "error";

export interface SubmitState {
  step: SubmitStep;
  txHash?: string;
  reportId?: number;
  error?: string;
}

export function useSubmitReport() {
  const [state, setState] = useState<SubmitState>({ step: "idle" });

  const submit = useCallback(
    async (identity: Identity, orgId: bigint, content: ReportContent) => {
      try {
        setState({ step: "pinning" });
        const pinResponse = await fetch("/api/pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(content),
        });
        if (!pinResponse.ok) throw new Error("Failed to pin to IPFS");
        const { cid } = await pinResponse.json();

        setState({ step: "fetching-members" });
        const members = await fetchGroupMembers(orgId);

        setState({ step: "generating-proof" });
        const proof = await generateReportProof(
          identity,
          members,
          orgId,
          content.category,
          cid
        );

        setState({ step: "submitting-tx" });
        const signer = await getSigner();
        const contract = getWriteContract(signer);

        const tx = await contract.submitReport(
          orgId,
          cid,
          content.category,
          proof.merkleTreeDepth,
          proof.merkleTreeRoot,
          proof.nullifier,
          proof.message,
          proof.points
        );

        setState({ step: "confirming", txHash: tx.hash });
        const receipt = await tx.wait();

        const event = receipt.logs
          .map((log: ethers.Log) => {
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
            (e: ethers.LogDescription | null) =>
              e?.name === "ReportSubmitted"
          );

        const reportId = event ? Number(event.args[0]) : -1;
        setState({ step: "done", reportId, txHash: tx.hash });
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        setState({ step: "error", error: message });
      }
    },
    []
  );

  const reset = useCallback(() => setState({ step: "idle" }), []);

  return { state, submit, reset };
}
