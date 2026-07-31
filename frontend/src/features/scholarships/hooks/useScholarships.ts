import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchScholarshipProgram,
  fetchScholarshipPrograms,
  fetchScholarshipApplications,
  fetchScholarshipApplication,
  executeCreateScholarshipProgram,
  executeApplyForScholarship,
  executeReviewScholarshipApplication,
  executeAdminReviewScholarship,
  executeAdminSuspendScholarship,
} from "../service/scholarships";

export function useScholarshipProgram(programId: number | null, address?: string) {
  return useQuery({
    queryKey: ["scholarship-program", programId, address],
    queryFn: async () => {
      if (programId === null) return null;
      try {
        return await fetchScholarshipProgram(programId, address);
      } catch (err) {
        console.warn("Failed to fetch scholarship program, returning null", err);
        return null;
      }
    },
    enabled: programId !== null,
  });
}

export function useScholarshipApplication(applicationId: number | null, address?: string) {
  return useQuery({
    queryKey: ["scholarship-application", applicationId, address],
    queryFn: async () => {
      if (applicationId === null) return null;
      try {
        return await fetchScholarshipApplication(applicationId, address);
      } catch (err) {
        console.warn("Failed to fetch scholarship application, returning null", err);
        return null;
      }
    },
    enabled: applicationId !== null,
  });
}

export function useScholarshipPrograms(address?: string) {
  return useQuery({
    queryKey: ["scholarship-programs", address],
    queryFn: () => fetchScholarshipPrograms(address),
  });
}

export function useScholarshipApplications(address?: string) {
  return useQuery({
    queryKey: ["scholarship-applications", address],
    queryFn: () => fetchScholarshipApplications(address),
  });
}

export function useCreateScholarshipProgramMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      universityId,
      title,
      description,
      criteria,
      amount,
      deadline,
      slots,
    }: {
      universityId: string;
      title: string;
      description: string;
      criteria: string;
      amount: number;
      deadline: string;
      slots: number;
    }) => {
      return executeCreateScholarshipProgram(
        universityId,
        title,
        description,
        criteria,
        amount,
        deadline,
        slots
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarship-programs"] });
    },
  });
}

export function useApplyForScholarshipMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      scholarshipId,
    }: {
      studentId: string;
      scholarshipId: number;
    }) => {
      return executeApplyForScholarship(studentId, scholarshipId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarship-applications"] });
    },
  });
}

export function useReviewScholarshipApplicationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      universityId,
      applicationId,
      approved,
    }: {
      universityId: string;
      applicationId: number;
      approved: boolean;
    }) => {
      return executeReviewScholarshipApplication(universityId, applicationId, approved);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarship-applications"] });
    },
  });
}

export function useAdminReviewScholarshipMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      adminId,
      scholarshipId,
      approved,
    }: {
      adminId: string;
      scholarshipId: number;
      approved: boolean;
    }) => {
      return executeAdminReviewScholarship(adminId, scholarshipId, approved);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarship-programs"] });
    },
  });
}

export function useAdminSuspendScholarshipMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      adminId,
      scholarshipId,
    }: {
      adminId: string;
      scholarshipId: number;
    }) => {
      return executeAdminSuspendScholarship(adminId, scholarshipId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scholarship-programs"] });
    },
  });
}
