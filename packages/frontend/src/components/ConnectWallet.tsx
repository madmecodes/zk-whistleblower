"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CHAIN_ID } from "@/lib/constants";

export function ConnectWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [wrongChain, setWrongChain] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    window.ethereum
      .request({ method: "eth_accounts" })
      .then((result: unknown) => {
        const accounts = result as string[];
        if (accounts.length > 0) setAddress(accounts[0]);
      })
      .catch(() => {});

    window.ethereum
      .request({ method: "eth_chainId" })
      .then((result: unknown) => {
        const chainId = result as string;
        setWrongChain(parseInt(chainId, 16) !== CHAIN_ID);
      })
      .catch(() => {});

    const handleAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[];
      setAddress(accounts.length > 0 ? accounts[0] : null);
    };

    const handleChainChanged = (...args: unknown[]) => {
      const chainId = args[0] as string;
      setWrongChain(parseInt(chainId, 16) !== CHAIN_ID);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  async function connect() {
    if (!window.ethereum) {
      alert("Install MetaMask or another wallet");
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAddress(accounts[0]);
    } catch {
      // user rejected
    }
  }

  if (wrongChain) {
    return (
      <button
        onClick={() =>
          window.ethereum?.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
          })
        }
        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
      >
        Switch to Sepolia
      </button>
    );
  }

  if (address) {
    return (
      <div className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-mono text-zinc-300">
        {address.slice(0, 6)}...{address.slice(-4)}
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
    >
      Connect Wallet
    </button>
  );
}
