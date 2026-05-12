"use client";

import { CustomField } from "@/types";

interface CustomFieldInputProps {
  field: CustomField;
  value?: any;
  onChange: (value: any) => void;
  disabled?: boolean;
}

export function CustomFieldInput({
  field,
  value,
  onChange,
  disabled = false,
}: CustomFieldInputProps) {
  const baseClassName =
    "w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

  const label = (
    <label className="block text-sm font-medium text-slate-300 mb-1">
      {field.display_name}
      {field.is_required && <span className="text-red-400"> *</span>}
      {field.description && (
        <span className="ml-2 text-xs text-slate-500" title={field.description}>
          ℹ️
        </span>
      )}
    </label>
  );

  switch (field.field_type) {
    case "text":
      return (
        <div>
          {label}
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder={field.default_value || ""}
            disabled={disabled}
            required={field.is_required}
            className={baseClassName}
          />
        </div>
      );

    case "textarea":
      return (
        <div>
          {label}
          <textarea
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder={field.default_value || ""}
            disabled={disabled}
            required={field.is_required}
            className={`${baseClassName} resize-none h-24`}
          />
        </div>
      );

    case "number":
      return (
        <div>
          {label}
          <input
            type="number"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
            placeholder={field.default_value || ""}
            disabled={disabled}
            required={field.is_required}
            className={baseClassName}
          />
        </div>
      );

    case "currency":
      return (
        <div>
          {label}
          <div className="flex items-center">
            <span className="text-slate-400 mr-2">$</span>
            <input
              type="number"
              step="0.01"
              value={value ?? ""}
              onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
              placeholder={field.default_value || "0.00"}
              disabled={disabled}
              required={field.is_required}
              className={baseClassName}
            />
          </div>
        </div>
      );

    case "date":
      return (
        <div>
          {label}
          <input
            type="date"
            value={value ? value.split("T")[0] : ""}
            onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
            disabled={disabled}
            required={field.is_required}
            className={baseClassName}
          />
        </div>
      );

    case "select":
      return (
        <div>
          {label}
          <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={disabled}
            required={field.is_required}
            className={baseClassName}
          >
            <option value="">Select {field.display_name.toLowerCase()}...</option>
            {(field.select_options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );

    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={field.id}
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 rounded border border-slate-600 bg-slate-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor={field.id} className="text-sm font-medium text-slate-300">
            {field.display_name}
            {field.is_required && <span className="text-red-400"> *</span>}
          </label>
        </div>
      );

    default:
      return (
        <div>
          {label}
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={disabled}
            required={field.is_required}
            className={baseClassName}
          />
        </div>
      );
  }
}

export function renderCustomFieldValue(field: CustomField, value: any): string {
  if (value === undefined || value === null) {
    return "—";
  }

  switch (field.field_type) {
    case "currency":
      return `$${parseFloat(value).toFixed(2)}`;
    case "checkbox":
      return value ? "Yes" : "No";
    case "date":
      return new Date(value).toLocaleDateString();
    case "number":
      return parseFloat(value).toString();
    case "select":
    case "text":
    case "textarea":
    default:
      return String(value);
  }
}
