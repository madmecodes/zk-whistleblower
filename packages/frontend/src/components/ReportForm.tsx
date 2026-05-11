"use client";

import { useState } from "react";
import { REPORT_CATEGORIES } from "@/lib/constants";
import type { ReportContent } from "@/lib/types";

interface ReportFormProps {
  onSubmit: (content: ReportContent) => void;
  disabled: boolean;
}

export function ReportForm({ onSubmit, disabled }: ReportFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>(REPORT_CATEGORIES[0]);
  const [evidenceLinks, setEvidenceLinks] = useState<string[]>([""]);

  function addLink() {
    setEvidenceLinks([...evidenceLinks, ""]);
  }

  function updateLink(index: number, value: string) {
    const updated = [...evidenceLinks];
    updated[index] = value;
    setEvidenceLinks(updated);
  }

  function removeLink(index: number) {
    setEvidenceLinks(evidenceLinks.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      title,
      body,
      category,
      evidenceLinks: evidenceLinks.filter((l) => l.trim() !== ""),
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={disabled}
          placeholder="Brief description of the issue"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={disabled}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
        >
          {REPORT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Report Details
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          disabled={disabled}
          rows={8}
          placeholder="Describe what happened, when, and any relevant details..."
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-300">
          Evidence Links (optional)
        </label>
        {evidenceLinks.map((link, i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input
              type="url"
              value={link}
              onChange={(e) => updateLink(i, e.target.value)}
              disabled={disabled}
              placeholder="https://..."
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
            {evidenceLinks.length > 1 && (
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={addLink}
          disabled={disabled}
          className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
        >
          + Add link
        </button>
      </div>

      <button
        type="submit"
        disabled={disabled || !title.trim() || !body.trim()}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Submit Anonymous Report
      </button>
    </form>
  );
}
