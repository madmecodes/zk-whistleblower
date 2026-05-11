"use client";

import { useState } from "react";
import { useIdentity } from "@/hooks/useIdentity";

export function IdentityManager() {
  const { identity, commitment, loading, create, restore, clear, getExportKey } =
    useIdentity();
  const [importKey, setImportKey] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-sm text-zinc-500">Loading identity...</p>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          ZK Identity
        </h3>
        <p className="mb-4 text-sm text-zinc-500">
          Generate a private identity to submit anonymous reports. Your identity
          never leaves your browser.
        </p>
        <div className="flex gap-3">
          <button
            onClick={create}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Generate Identity
          </button>
          <button
            onClick={() => setShowImport(!showImport)}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:border-zinc-500"
          >
            Import
          </button>
        </div>
        {showImport && (
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={importKey}
              onChange={(e) => setImportKey(e.target.value)}
              placeholder="Paste private key..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600"
            />
            <button
              onClick={() => {
                if (importKey.trim()) {
                  restore(importKey.trim());
                  setImportKey("");
                  setShowImport(false);
                }
              }}
              className="rounded-lg bg-zinc-700 px-4 py-2 text-sm text-white hover:bg-zinc-600"
            >
              Restore
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-green-900/50 bg-zinc-900 p-6">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          ZK Identity Active
        </h3>
      </div>
      <div className="mb-4 space-y-2">
        <div>
          <p className="text-xs text-zinc-500">Commitment (share with org admin)</p>
          <div className="flex items-center gap-2">
            <code className="text-xs text-zinc-300 break-all">
              {commitment?.toString().slice(0, 40)}...
            </code>
            <button
              onClick={() =>
                copyToClipboard(commitment!.toString(), "commitment")
              }
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              {copied === "commitment" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => {
            const key = getExportKey();
            if (key) copyToClipboard(key, "key");
          }}
          className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-zinc-500"
        >
          {copied === "key" ? "Copied" : "Export Key"}
        </button>
        <button
          onClick={clear}
          className="rounded-lg border border-red-900/50 px-3 py-1.5 text-xs text-red-400 hover:border-red-700"
        >
          Delete Identity
        </button>
      </div>
    </div>
  );
}
