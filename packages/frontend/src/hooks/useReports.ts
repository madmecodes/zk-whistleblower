"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import {
  WHISTLEBLOWER_ABI,
  getProvider,
} from "@/lib/contracts";
import { WHISTLEBLOWER_ADDRESS } from "@/lib/constants";
import type { ReportData } from "@/lib/types";

export function useReports(orgId: bigint | null) {
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orgId === null) return;

    setLoading(true);

    const provider = getProvider();
    const contract = new ethers.Contract(
      WHISTLEBLOWER_ADDRESS,
      WHISTLEBLOWER_ABI,
      provider
    );

    const filter = contract.filters.ReportSubmitted(null, orgId);
    contract
      .queryFilter(filter)
      .then((events) => {
        const parsed: ReportData[] = events.map((e) => {
          const log = e as ethers.EventLog;
          return {
            reportId: Number(log.args[0]),
            orgId: log.args[1],
            ipfsCid: log.args[2],
            category: log.args[3],
            timestamp: log.args[4],
            nullifier: log.args[5],
          };
        });
        setReports(parsed.reverse());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orgId]);

  return { reports, loading };
}
