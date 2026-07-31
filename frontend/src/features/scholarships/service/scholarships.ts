export interface Scholarship {
  id: number;
  title: string;
  description: string;
  criteria: string;
  amount: number;
  deadline: string;
  slots: number;
  createdByUniversityId: string;
  adminApprovalStatus: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface ScholarshipApplication {
  id: number;
  scholarshipId: number;
  studentId: string;
  status: "pending" | "approved" | "rejected";
  appliedAt: string;
  decidedAt?: string;
  decidedByUniversityId?: string;
}

const DEFAULT_SCHOLARSHIPS: Scholarship[] = [
  {
    id: 1,
    title: "Stellar Developer Initiative",
    description: "For students demonstrating exceptional promise in building decentralized applications on Soroban and Stellar.",
    criteria: "Minimum GPA 3.5, completed at least one blockchain workshop, submitted one repository link.",
    amount: 1500,
    deadline: "2026-12-31",
    slots: 5,
    createdByUniversityId: "GDLYWFB7IOMPWZTFYPTQZND4VCKUDEBXRDHL3DBQHRNV2GVILMNZXRAC",
    adminApprovalStatus: "approved",
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    title: "President's Excellence Scholarship",
    description: "Awarded to the top academic performers in computer science and engineering majors.",
    criteria: "Minimum GPA 3.9, enrolled in final year of undergraduate study.",
    amount: 3000,
    deadline: "2026-11-15",
    slots: 2,
    createdByUniversityId: "GDLYWFB7IOMPWZTFYPTQZND4VCKUDEBXRDHL3DBQHRNV2GVILMNZXRAC",
    adminApprovalStatus: "pending",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEFAULT_APPLICATIONS: ScholarshipApplication[] = [];

const isServer = typeof window === "undefined";

function getScholarships(): Scholarship[] {
  if (isServer) return DEFAULT_SCHOLARSHIPS;
  const stored = localStorage.getItem("campuschain_scholarships");
  if (!stored) {
    localStorage.setItem("campuschain_scholarships", JSON.stringify(DEFAULT_SCHOLARSHIPS));
    return DEFAULT_SCHOLARSHIPS;
  }
  return JSON.parse(stored);
}

function saveScholarships(list: Scholarship[]) {
  if (isServer) return;
  localStorage.setItem("campuschain_scholarships", JSON.stringify(list));
}

function getApplications(): ScholarshipApplication[] {
  if (isServer) return DEFAULT_APPLICATIONS;
  const stored = localStorage.getItem("campuschain_applications");
  if (!stored) {
    localStorage.setItem("campuschain_applications", JSON.stringify(DEFAULT_APPLICATIONS));
    return DEFAULT_APPLICATIONS;
  }
  return JSON.parse(stored);
}

function saveApplications(list: ScholarshipApplication[]) {
  if (isServer) return;
  localStorage.setItem("campuschain_applications", JSON.stringify(list));
}

export async function fetchScholarshipProgram(id: number, _address?: string): Promise<Scholarship | null> {
  await new Promise((r) => setTimeout(r, 200));
  return getScholarships().find((s) => s.id === id) || null;
}

export async function fetchScholarshipPrograms(_startAfter = 0, _limit = 50, _address?: string): Promise<Scholarship[]> {
  await new Promise((r) => setTimeout(r, 200));
  return getScholarships();
}

export async function fetchScholarshipApplications(_startAfter = 0, _limit = 50, _address?: string): Promise<ScholarshipApplication[]> {
  await new Promise((r) => setTimeout(r, 200));
  return getApplications();
}

export async function fetchScholarshipApplication(id: number, _address?: string): Promise<ScholarshipApplication | null> {
  await new Promise((r) => setTimeout(r, 200));
  return getApplications().find((a) => a.id === id) || null;
}

export async function executeCreateScholarshipProgram(
  universityId: string,
  title: string,
  description: string,
  criteria: string,
  amount: number,
  deadline: string,
  slots: number
): Promise<number> {
  await new Promise((r) => setTimeout(r, 300));
  const list = getScholarships();
  const id = list.length > 0 ? Math.max(...list.map((s) => s.id)) + 1 : 1;
  const newProg: Scholarship = {
    id,
    title,
    description,
    criteria,
    amount,
    deadline,
    slots,
    createdByUniversityId: universityId,
    adminApprovalStatus: "pending",
    createdAt: new Date().toISOString(),
  };
  list.push(newProg);
  saveScholarships(list);
  return id;
}

export async function executeAdminReviewScholarship(
  _adminId: string,
  scholarshipId: number,
  approved: boolean
): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
  const list = getScholarships();
  const idx = list.findIndex((s) => s.id === scholarshipId);
  if (idx !== -1) {
    list[idx].adminApprovalStatus = approved ? "approved" : "rejected";
    saveScholarships(list);
  }
}

export async function executeApplyForScholarship(
  studentId: string,
  scholarshipId: number
): Promise<number> {
  await new Promise((r) => setTimeout(r, 300));
  const list = getApplications();
  const existing = list.find((a) => a.scholarshipId === scholarshipId && a.studentId === studentId);
  if (existing) {
    throw new Error("You have already applied for this scholarship.");
  }
  const id = list.length > 0 ? Math.max(...list.map((a) => a.id)) + 1 : 1;
  const newApp: ScholarshipApplication = {
    id,
    scholarshipId,
    studentId,
    status: "pending",
    appliedAt: new Date().toISOString(),
  };
  list.push(newApp);
  saveApplications(list);
  return id;
}

export async function executeReviewScholarshipApplication(
  universityId: string,
  applicationId: number,
  approved: boolean
): Promise<void> {
  await new Promise((r) => setTimeout(r, 300));
  const list = getApplications();
  const idx = list.findIndex((a) => a.id === applicationId);
  if (idx !== -1) {
    list[idx].status = approved ? "approved" : "rejected";
    list[idx].decidedAt = new Date().toISOString();
    list[idx].decidedByUniversityId = universityId;
    saveApplications(list);
  }
}
