import { PinataSDK } from "pinata";
import type { ReportContent } from "./types";

function getPinata(): PinataSDK {
  return new PinataSDK({
    pinataJwt: process.env.PINATA_JWT!,
    pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY!,
  });
}

export async function pinReport(content: ReportContent): Promise<string> {
  const pinata = getPinata();
  const upload = await pinata.upload.public
    .json(content)
    .name(`report-${Date.now()}.json`);
  return upload.cid;
}

export async function fetchReport(cid: string): Promise<ReportContent> {
  const pinata = getPinata();
  const response = await pinata.gateways.public.get(cid);
  return response.data as unknown as ReportContent;
}

export function gatewayUrl(cid: string): string {
  const gateway = process.env.NEXT_PUBLIC_PINATA_GATEWAY;
  return `https://${gateway}/ipfs/${cid}`;
}
