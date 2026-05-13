"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/apiClient";
import { BusinessSettings } from "@/types";

const BUSINESS_TYPES = [
  { value: "pharmacy", label: "Pharmacy", description: "Medicines, health products" },
  { value: "ngo", label: "NGO", description: "Non-profit organization" },
  { value: "warehouse", label: "Warehouse", description: "Bulk storage and distribution" },
  { value: "supermarket", label: "Supermarket", description: "Retail grocery and general goods" },
  { value: "retail_shop", label: "Retail Shop", description: "Small retail store" },
  { value: "distributor", label: "Distributor", description: "Wholesale distributor" },
  { value: "custom", label: "Custom", description: "Define your own" },
];

interface BusinessSettingsFormProps {
  onBusinessTypeChange?: (type: string) => void;
}

export function BusinessSettingsForm({ onBusinessTypeChange }: BusinessSettingsFormProps) {
  const [selectedType, setSelectedType] = useState("");
  const [description, setDescription] = useState("");

  const { data: settings, isLoading } = useQuery<BusinessSettings | undefined, Error>({
    queryKey: ["business_settings"],
    queryFn: async () => {
      const response = await apiGet<BusinessSettings>("/api/business-settings");
      return response.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setSelectedType(settings.business_type);
      setDescription(settings.description || "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: { business_type: string; description?: string }) => {
      const response = await apiPost<BusinessSettings>("/api/business-settings", data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data && onBusinessTypeChange) {
        onBusinessTypeChange(data.business_type);
      }
    },
  });

  const handleSave = async () => {
    if (!selectedType) {
      alert("Please select a business type");
      return;
    }

    await saveMutation.mutateAsync({
      business_type: selectedType,
      description: description || undefined,
    });
  };

  if (isLoading) {
    return <div className="text-center text-slate-400">Loading business settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="border border-slate-700 rounded-lg p-4 bg-slate-900">
        <h3 className="text-lg font-semibold text-white mb-4">Business Type</h3>
        <p className="text-slate-400 text-sm mb-6">
          Select your business type. This helps us provide relevant features and customization options.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {BUSINESS_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`p-4 rounded border-2 transition text-left ${
                selectedType === type.value
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-slate-700 bg-slate-800 hover:border-slate-600"
              }`}
            >
              <p className="font-semibold text-white">{type.label}</p>
              <p className="text-sm text-slate-400">{type.description}</p>
            </button>
          ))}
        </div>

        {selectedType === "custom" && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Describe Your Business
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your business..."
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 h-20 resize-none"
            />
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saveMutation.isPending || !selectedType}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-2 rounded transition"
        >
          {saveMutation.isPending ? "Saving..." : "Save Business Type"}
        </button>

        {saveMutation.isSuccess && (
          <p className="text-green-400 text-sm mt-3">✓ Business type saved successfully!</p>
        )}
      </div>
    </div>
  );
}
