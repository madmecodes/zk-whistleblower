"use client";

import Link from "next/link";
import { ConnectWallet } from "./ConnectWallet";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-white">
          ZK Whistleblower
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/org/create"
            className="text-sm text-zinc-400 hover:text-white"
          >
            Create Org
          </Link>
          <ConnectWallet />
        </nav>
      </div>
    </header>
  );
}
