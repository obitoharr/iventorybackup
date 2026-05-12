"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { CustomField, BusinessSettings } from "@/types";

export function useCustomFields() {
  return useQuery({
    queryKey: ["custom_fields"],
    queryFn: async () => {
      const response = await apiGet<CustomField[]>("/api/custom-fields");
      return response.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useBusinessSettings() {
  return useQuery({
    queryKey: ["business_settings"],
    queryFn: async () => {
      const response = await apiGet<BusinessSettings>("/api/business-settings");
      return response.data || { business_type: "custom", description: null };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
