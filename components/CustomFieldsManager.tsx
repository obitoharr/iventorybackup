"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/apiClient";
import { CustomField, CustomFieldForm } from "@/types";
import { X, Plus, Edit2, ChevronUp, ChevronDown } from "lucide-react";

interface CustomFieldsManagerProps {
  businessType?: string;
}

export function CustomFieldsManager({ businessType }: CustomFieldsManagerProps) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CustomFieldForm> & { id?: string }>({
    field_name: "",
    display_name: "",
    field_type: "text",
    is_required: false,
    is_visible: true,
    field_order: 0,
    select_options: [],
  });

  // Fetch custom fields
  const { data: customFields = [], isLoading } = useQuery({
    queryKey: ["custom_fields"],
    queryFn: async () => {
      const response = await apiGet<CustomField[]>("/api/custom-fields");
      return response.data || [];
    },
    onError: (error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load custom fields");
    },
  });

  // Create custom field
  const createMutation = useMutation({
    mutationFn: async (data: CustomFieldForm) => {
      const response = await apiPost<CustomField>("/api/custom-fields", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_fields"] });
      resetForm();
      setIsAdding(false);
      setErrorMessage(null);
    },
    onError: (error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create custom field");
    },
  });

  // Update custom field
  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: CustomFieldForm }) => {
      const response = await apiPatch<CustomField>("/api/custom-fields", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_fields"] });
      resetForm();
      setEditingId(null);
      setErrorMessage(null);
    },
    onError: (error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to update custom field");
    },
  });

  // Delete custom field
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiDelete("/api/custom-fields", { id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_fields"] });
      setErrorMessage(null);
    },
    onError: (error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete custom field");
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      await apiPatch<CustomField>("/api/custom-fields", {
        id,
        updates: { field_order: newOrder },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom_fields"] });
      setErrorMessage(null);
    },
    onError: (error: unknown) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to reorder custom fields");
    },
  });

  const resetForm = () => {
    setFormData({
      field_name: "",
      display_name: "",
      field_type: "text",
      is_required: false,
      is_visible: true,
      field_order: 0,
      select_options: [],
    });
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.field_name || !formData.display_name) {
      alert("Field name and display name are required");
      return;
    }

    // Validate field_name (alphanumeric and underscores only)
    if (!/^[a-z0-9_]+$/.test(formData.field_name)) {
      alert("Field name can only contain lowercase letters, numbers, and underscores");
      return;
    }

    const submitData: CustomFieldForm = {
      field_name: formData.field_name,
      display_name: formData.display_name,
      field_type: (formData.field_type || "text") as any,
      is_required: formData.is_required ?? false,
      is_visible: formData.is_visible ?? true,
      field_order: formData.field_order ?? customFields.length,
      select_options: formData.field_type === "select" ? formData.select_options : undefined,
      default_value: formData.default_value,
      description: formData.description,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, updates: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save custom field");
    }
  };

  const handleEdit = (field: CustomField) => {
    setFormData({
      id: field.id,
      field_name: field.field_name,
      display_name: field.display_name,
      field_type: field.field_type,
      is_required: field.is_required,
      is_visible: field.is_visible,
      field_order: field.field_order,
      select_options: field.select_options || [],
      default_value: field.default_value,
      description: field.description,
    });
    setEditingId(field.id);
    setIsAdding(true);
  };

  const handleMoveUp = (field: CustomField) => {
    const aboveField = customFields.find((f) => f.field_order === field.field_order - 1);
    if (aboveField) {
      reorderMutation.mutateAsync({ id: field.id, newOrder: field.field_order - 1 });
      reorderMutation.mutateAsync({ id: aboveField.id, newOrder: aboveField.field_order + 1 });
    }
  };

  const handleMoveDown = (field: CustomField) => {
    const belowField = customFields.find((f) => f.field_order === field.field_order + 1);
    if (belowField) {
      reorderMutation.mutateAsync({ id: field.id, newOrder: field.field_order + 1 });
      reorderMutation.mutateAsync({ id: belowField.id, newOrder: belowField.field_order - 1 });
    }
  };

  if (isLoading) {
    return <div className="p-4 text-center text-slate-400">Loading custom fields...</div>;
  }

  const standardColumns = ["Name", "Category", "Price", "Stock", "Notes"];
  const visibleCustomFields = customFields
    .filter((field) => field.is_visible)
    .sort((a, b) => a.field_order - b.field_order);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-700 bg-slate-950 p-4">
        <h4 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400 mb-3">
          Current Product Table Columns
        </h4>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 mb-3">Standard columns</p>
            <ul className="space-y-2 text-sm text-slate-200">
              {standardColumns.map((column) => (
                <li key={column} className="rounded px-2 py-1 bg-slate-800 border border-slate-700">
                  {column}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500 mb-3">Visible custom fields</p>
            {visibleCustomFields.length === 0 ? (
              <p className="text-sm text-slate-500">No visible custom fields yet.</p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-200">
                {visibleCustomFields.map((field) => (
                  <li key={field.id} className="rounded px-2 py-1 bg-slate-800 border border-slate-700">
                    <span className="font-medium">{field.display_name}</span>
                    <span className="ml-2 text-slate-500">({field.field_name})</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="border border-slate-700 rounded-lg p-4 bg-slate-900">
        <h3 className="text-lg font-semibold text-white mb-4">Customize Your Product Table</h3>
        <p className="text-slate-400 text-sm mb-6">
          Create custom fields for your {businessType || "business"}. These fields will appear in your product table and forms.
        </p>

        {errorMessage ? (
          <div className="mb-4 rounded border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {errorMessage}
          </div>
        ) : null}

        {/* Custom Fields List */}
        <div className="space-y-2 mb-6">
          {customFields.length === 0 ? (
            <p className="text-slate-500 text-sm italic">No custom fields yet. Add one to get started.</p>
          ) : (
            <div className="space-y-2">
              {customFields
                .sort((a, b) => a.field_order - b.field_order)
                .map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center justify-between bg-slate-800 p-3 rounded border border-slate-700 hover:border-slate-600 transition"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-white">{field.display_name}</p>
                      <p className="text-xs text-slate-400">
                        {field.field_name} • {field.field_type}
                        {field.is_required && " • Required"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {customFields.length > 1 && (
                        <>
                          <button
                            onClick={() => handleMoveUp(field)}
                            disabled={field.field_order === 0}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move up"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            onClick={() => handleMoveDown(field)}
                            disabled={field.field_order === customFields.length - 1}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Move down"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEdit(field)}
                        className="p-1 text-slate-400 hover:text-white transition"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(field.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition"
                        title="Delete"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        {isAdding ? (
          <div className="bg-slate-800 border border-slate-700 rounded p-4">
            <h4 className="font-semibold text-white mb-4">
              {editingId ? "Edit Field" : "Add New Field"}
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Field Name (database) *
                  </label>
                  <input
                    type="text"
                    value={formData.field_name || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        field_name: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                      })
                    }
                    placeholder="e.g., batch_number"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    disabled={editingId ? true : false}
                  />
                  <p className="text-xs text-slate-500 mt-1">Lowercase letters, numbers, underscores only</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.display_name || ""}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="e.g., Batch Number"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Field Type *</label>
                  <select
                    value={formData.field_type || "text"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        field_type: e.target.value as any,
                        select_options: e.target.value === "select" ? [""] : undefined,
                      })
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="select">Dropdown Select</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="textarea">Text Area</option>
                    <option value="currency">Currency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Default Value</label>
                  <input
                    type="text"
                    value={formData.default_value || ""}
                    onChange={(e) => setFormData({ ...formData, default_value: e.target.value })}
                    placeholder="Optional default value"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {formData.field_type === "select" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Select Options</label>
                  <p className="text-xs text-slate-400 mb-2">Enter one option per line</p>
                  <textarea
                    value={(formData.select_options || []).join("\n")}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        select_options: e.target.value.split("\n").filter((o) => o.trim()),
                      })
                    }
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 h-20 resize-none font-mono text-sm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description (shown as tooltip)"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.is_required || false}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Required Field
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={formData.is_visible ?? true}
                    onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                    className="w-4 h-4"
                  />
                  Visible in Table
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-medium py-2 rounded transition"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingId
                    ? "Update Field"
                    : "Add Field"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsAdding(false);
                    setEditingId(null);
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 rounded transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => {
              setIsAdding(true);
              resetForm();
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            Add Custom Field
          </button>
        )}
      </div>
    </div>
  );
}
