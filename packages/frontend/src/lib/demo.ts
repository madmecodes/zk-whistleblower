/**
 * Pre-populated demo organization and members.
 * In production, members self-register via email domain verification.
 * These credentials simulate what a verified corporate directory would provide.
 */

export interface DemoMember {
  email: string;
  password: string;
  role: string;
  department: string;
}

export interface DemoOrg {
  name: string;
  domain: string;
  members: DemoMember[];
}

export const DEMO_ORG: DemoOrg = {
  name: "Google Inc",
  domain: "google.com",
  members: [
    { email: "alice.chen@google.com", password: "alice2024", role: "Software Engineer", department: "Search" },
    { email: "bob.martinez@google.com", password: "bob2024", role: "Product Manager", department: "Cloud" },
    { email: "carol.johnson@google.com", password: "carol2024", role: "Data Scientist", department: "AI Research" },
    { email: "david.kim@google.com", password: "david2024", role: "Security Engineer", department: "Trust & Safety" },
    { email: "emma.wright@google.com", password: "emma2024", role: "Engineering Manager", department: "Ads" },
    { email: "frank.patel@google.com", password: "frank2024", role: "Site Reliability Engineer", department: "Infrastructure" },
    { email: "grace.lee@google.com", password: "grace2024", role: "UX Researcher", department: "Hardware" },
    { email: "henry.zhang@google.com", password: "henry2024", role: "Staff Engineer", department: "Android" },
    { email: "iris.thompson@google.com", password: "iris2024", role: "Legal Counsel", department: "Legal" },
    { email: "james.wilson@google.com", password: "james2024", role: "Finance Analyst", department: "Finance" },
  ],
};
