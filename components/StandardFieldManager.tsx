"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "@/lib/apiClient";
import { CustomField } from "@/types";
import { requiredSystemFieldNames, alwaysShowSystemFields } from "@/lib/customFields";

interface StandardFieldManagerProps {
  businessType?: string;
}

export function StandardFieldManager({ businessType }: StandardFieldManagerProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch custom fields
  const customFieldsQuery = useQuery<CustomField[], Error>({
    queryKey: ["standard_fields"],
    queryFn: async () => {
      const response = await apiGet<CustomField[]>("/api/standard-fields");
      return response.data || [];
    },
  });

  const customFields = customFieldsQuery.data ?? [];
  const isLoading = customFieldsQuery.isLoading;
  const systemFields = customFields.filter((field) => field.is_system).sort((a, b) => a.field_order - b.field_order);

  // Update visibility mutation
  const updateVisibilityMutation = useMutation({
    mutationFn: async ({ id, is_visible }: { id: string; is_visible: boolean }) => {
      const response = await apiPatch<CustomField>("/api/standard-fields", {
        id,
        updates: { is_visible },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standard_fields"] });
      queryClient.refetchQueries({ queryKey: ["custom_fields"] });
      setErrorMessage(null);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-400 mb-2">Loading standard fields...</p>
        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-500"></div>
      </div>
    );
  }

  if (systemFields.length === 0) {
    return (
      <div className="p-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
        <p className="text-yellow-100">No standard fields found.</p>
        <p className="text-sm text-yellow-100/70 mt-2">This may indicate the fields haven't been initialized yet. Try refreshing the page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-theme bg-theme-card p-4">
        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-theme-secondary mb-3">
          Standard Product Fields
        </h4>

        <p className="text-theme-secondary text-sm mb-4">
          Toggle standard fields on or off for inventory use. Required fields are always enabled and remain visible.
        </p>

        {errorMessage ? (
          <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-theme-surface">
              <tr>
                <th className="p-3 text-left text-theme-secondary">Display Name</th>
                <th className="p-3 text-left text-theme-secondary">Field Name</th>
                <th className="p-3 text-left text-theme-secondary">Type</th>
                <th className="p-3 text-center text-theme-secondary">Use</th>
                <th className="p-3 text-center text-theme-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {systemFields.map((field) => (
                <tr key={field.id} className="border-t border-theme hover:bg-theme-surface">
                  <td className="p-3 text-theme-primary font-medium">{field.display_name}</td>
                  <td className="p-3 text-theme-secondary">{field.field_name}</td>
                  <td className="p-3 text-theme-secondary">{field.field_type}</td>
                  <td className="p-3 text-center">
                    {(() => {
                      const isAlwaysVisible = alwaysShowSystemFields.includes(field.field_name);
                      const isRequired = requiredSystemFieldNames.includes(field.field_name) || field.is_required;
                      const disabled = isAlwaysVisible || isRequired;
                      return (
                        <label className="inline-flex items-center gap-2 justify-center">
                          <input
                            type="checkbox"
                            checked={field.is_visible || disabled}
                            disabled={disabled}
                            onChange={(e) => !disabled && updateVisibilityMutation.mutate({ id: field.id, is_visible: e.target.checked })}
                            className="w-4 h-4 rounded border border-theme bg-theme-input cursor-pointer disabled:cursor-not-allowed"
                          />
                          {isAlwaysVisible ? (
                            <span className="text-xs text-theme-secondary">Always visible</span>
                          ) : isRequired ? (
                            <span className="text-xs text-theme-secondary">Required</span>
                          ) : null}
                        </label>
                      );
                    })()}
                  </td>
                  <td className="p-3 text-center text-theme-secondary">Visibility only</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {systemFields.length === 0 && (
          <p className="text-theme-muted text-sm italic mt-4">No standard fields configured yet.</p>
        )}
      </div>
    </div>
  );
}