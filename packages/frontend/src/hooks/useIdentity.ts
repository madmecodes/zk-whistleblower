"use client";

import { useState, useEffect, useCallback } from "react";
import { Identity } from "@semaphore-protocol/core";
import {
  createIdentity,
  importIdentity,
  exportIdentity,
} from "@/lib/semaphore";
import type { IdentityExport } from "@/lib/types";

const STORAGE_KEY = "zk-whistleblower-identity";

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: IdentityExport = JSON.parse(stored);
        setIdentity(importIdentity(parsed.privateKey));
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const create = useCallback(() => {
    const id = createIdentity();
    const data: IdentityExport = {
      privateKey: exportIdentity(id),
      commitment: id.commitment.toString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setIdentity(id);
    return id;
  }, []);

  const restore = useCallback((privateKey: string) => {
    const id = importIdentity(privateKey);
    const data: IdentityExport = {
      privateKey: exportIdentity(id),
      commitment: id.commitment.toString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setIdentity(id);
    return id;
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIdentity(null);
  }, []);

  const getExportKey = useCallback((): string | null => {
    if (!identity) return null;
    return exportIdentity(identity);
  }, [identity]);

  return {
    identity,
    commitment: identity?.commitment ?? null,
    loading,
    create,
    restore,
    clear,
    getExportKey,
  };
}
