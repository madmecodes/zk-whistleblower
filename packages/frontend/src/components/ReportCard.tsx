"use client";

import Link from "next/link";
import type { ReportData } from "@/lib/types";

interface ReportCardProps {
  report: ReportData;
}

export function ReportCard({ report }: ReportCardProps) {
  const date = new Date(Number(report.timestamp) * 1000);

  return (
    <Link
      href={`/reports/${report.reportId}`}
      className="block rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-600"
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
          {report.category.charAt(0).toUpperCase() + report.category.slice(1)}
        </span>
        <span className="text-xs text-zinc-500">
          Report #{report.reportId}
        </span>
      </div>
      <p className="mb-2 text-sm font-mono text-zinc-400">
        CID: {report.ipfsCid.slice(0, 20)}...
      </p>
      <p className="text-xs text-zinc-600">
        {date.toLocaleDateString()} {date.toLocaleTimeString()}
      </p>
    </Link>
  );
}
