"use client";

import { useState, useEffect } from "react";
import { getReadContract } from "@/lib/contracts";
import type { OrganizationData } from "@/lib/types";

export function useOrganization(orgId: bigint | null) {
  const [org, setOrg] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orgId === null) return;

    setLoading(true);
    setError(null);

    const contract = getReadContract();
    contract
      .getOrganization(orgId)
      .then((result: OrganizationData) => {
        setOrg({
          groupId: result.groupId,
          name: result.name,
          admin: result.admin,
          memberCount: result.memberCount,
          createdAt: result.createdAt,
        });
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orgId]);

  return { org, loading, error };
}
