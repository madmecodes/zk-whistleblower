export interface OrganizationData {
  groupId: bigint;
  name: string;
  admin: string;
  memberCount: bigint;
  createdAt: bigint;
}

export interface ReportData {
  reportId: number;
  orgId: bigint;
  ipfsCid: string;
  category: string;
  timestamp: bigint;
  nullifier: bigint;
}

export interface ReportContent {
  title: string;
  body: string;
  category: string;
  evidenceLinks: string[];
  createdAt: string;
}

export interface IdentityExport {
  privateKey: string;
  commitment: string;
}
