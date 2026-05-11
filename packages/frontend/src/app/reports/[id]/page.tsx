"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { getReadContract } from "@/lib/contracts";
import { PINATA_GATEWAY } from "@/lib/constants";
import type { ReportContent, ReportData, OrganizationData } from "@/lib/types";

export default function ViewReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const reportId = Number(id);

  const [report, setReport] = useState<ReportData | null>(null);
  const [org, setOrg] = useState<OrganizationData | null>(null);
  const [content, setContent] = useState<ReportContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const contract = getReadContract();

        const r = await contract.getReport(reportId);
        const reportData: ReportData = {
          reportId,
          orgId: r.orgId,
          ipfsCid: r.ipfsCid,
          category: r.category,
          timestamp: r.timestamp,
          nullifier: r.nullifier,
        };
        setReport(reportData);

        const o = await contract.getOrganization(r.orgId);
        setOrg({
          groupId: o.groupId,
          name: o.name,
          admin: o.admin,
          memberCount: o.memberCount,
          createdAt: o.createdAt,
        });

        const res = await fetch(`/api/report/${r.ipfsCid}`);
        if (res.ok) {
          setContent(await res.json());
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load report";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [reportId]);

  if (loading) return <p className="text-sm text-zinc-500">Loading report...</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!report) return <p className="text-sm text-zinc-500">Report not found.</p>;

  const date = new Date(Number(report.timestamp) * 1000);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <div className="mb-4 flex items-center gap-3">
          <span className="rounded-md bg-green-900/50 px-3 py-1 text-xs font-medium text-green-400">
            Verified
          </span>
          <span className="rounded-md bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
            {report.category.charAt(0).toUpperCase() +
              report.category.slice(1)}
          </span>
          <span className="text-xs text-zinc-500">Report #{reportId}</span>
        </div>

        <h1 className="mb-2 text-3xl font-bold">
          {content?.title || "Untitled Report"}
        </h1>

        {org && (
          <p className="text-sm text-zinc-400">
            Submitted to{" "}
            <Link
              href={`/org/${report.orgId.toString()}`}
              className="text-blue-400 hover:underline"
            >
              {org.name}
            </Link>{" "}
            by a verified member
          </p>
        )}

        <p className="mt-1 text-xs text-zinc-600">
          {date.toLocaleDateString()} {date.toLocaleTimeString()}
        </p>
      </div>

      <div className="rounded-xl border border-green-900/30 bg-green-950/10 p-4">
        <p className="text-sm text-green-300/70">
          This report was submitted by a cryptographically verified member of{" "}
          {org?.name || "the organization"}. The zero-knowledge proof guarantees
          membership without revealing the author&apos;s identity.
        </p>
      </div>

      {content && (
        <div className="prose prose-invert max-w-none">
          <div className="whitespace-pre-wrap rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-sm leading-relaxed text-zinc-300">
            {content.body}
          </div>

          {content.evidenceLinks.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-semibold text-zinc-400">
                Evidence Links
              </h3>
              <ul className="space-y-1">
                {content.evidenceLinks.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:underline break-all"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="text-sm font-semibold text-zinc-400">
          On-Chain Metadata
        </h3>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-zinc-600">IPFS CID</p>
            {PINATA_GATEWAY ? (
              <a
                href={`https://${PINATA_GATEWAY}/ipfs/${report.ipfsCid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-400 hover:underline break-all"
              >
                {report.ipfsCid}
              </a>
            ) : (
              <p className="font-mono text-xs text-zinc-400 break-all">
                {report.ipfsCid}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-zinc-600">Nullifier</p>
            <p className="font-mono text-xs text-zinc-400 break-all">
              {report.nullifier.toString(16).slice(0, 32)}...
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-600">Organization ID</p>
            <p className="font-mono text-xs text-zinc-400">
              {report.orgId.toString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-600">Timestamp</p>
            <p className="font-mono text-xs text-zinc-400">
              {report.timestamp.toString()} (unix)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
