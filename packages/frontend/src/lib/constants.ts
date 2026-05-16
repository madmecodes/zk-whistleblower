export const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 11155111;

export const SEMAPHORE_ADDRESS =
  process.env.NEXT_PUBLIC_SEMAPHORE_ADDRESS ||
  "0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D";

export const WHISTLEBLOWER_ADDRESS =
  process.env.NEXT_PUBLIC_WHISTLEBLOWER_ADDRESS || "";

export const SEPOLIA_RPC_URL =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "";

export const PINATA_GATEWAY =
  process.env.NEXT_PUBLIC_PINATA_GATEWAY || "";

export const DEMO_ORG_ID = process.env.NEXT_PUBLIC_DEMO_ORG_ID
  ? BigInt(process.env.NEXT_PUBLIC_DEMO_ORG_ID)
  : null;

export const REPORT_CATEGORIES = [
  "fraud",
  "corruption",
  "safety",
  "discrimination",
  "environmental",
  "other",
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];
