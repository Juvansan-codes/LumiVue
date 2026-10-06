"use client";

import { useState, useCallback } from "react";
import type { PatientContext } from "@/lib/types";
import { ClipboardList } from "lucide-react";

const SYMPTOM_OPTIONS = [
  "Fever",
  "Cough",
  "Productive Cough",
  "Chest Pain",
  "Shortness of Breath",
  "Fatigue",
] as const;

const SEX_OPTIONS = [
  { value: "", label: "Select" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

interface PatientContextFormProps {
  value: PatientContext;
  onChange: (ctx: PatientContext) => void;
}

export function PatientContextForm({
  value,
  onChange,
}: PatientContextFormProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const updateField = useCallback(
    <K extends keyof PatientContext>(field: K, val: PatientContext[K]) => {
      onChange({ ...value, [field]: val });
    },
    [value, onChange],
  );

  const toggleSymptom = useCallback(
    (symptom: string) => {
      const current = value.symptoms;
      const next = current.includes(symptom)
        ? current.filter((s) => s !== symptom)
        : [...current, symptom];
      updateField("symptoms", next);
    },
    [value.symptoms, updateField],
  );

  return (
    <div
      className="rounded-xl border bg-white"
      style={{
        borderColor: "var(--lv-border)",
        boxShadow: "var(--lv-shadow-sm)",
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-6 py-4 text-left"
      >
        <div className="flex items-center gap-2.5">
          <ClipboardList
            className="h-4 w-4"
            style={{ color: "var(--lv-blue)" }}
          />
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--lv-black)" }}
          >
            Patient Context
          </h2>
        </div>
        <svg
          className="h-4 w-4 transition-transform duration-200"
          style={{
            color: "var(--lv-muted)",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Form */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-5">
          {/* Row: Age, Sex */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="patient-age"
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--lv-muted)" }}
              >
                Age
              </label>
              <input
                id="patient-age"
                type="number"
                min={0}
                max={150}
                placeholder="e.g., 62"
                value={value.age}
                onChange={(e) => updateField("age", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border text-sm outline-none transition-colors"
                style={{
                  borderColor: "var(--lv-border)",
                  color: "var(--lv-black)",
                  background: "var(--lv-white)",
                }}
                onFocus={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--lv-blue)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--lv-border)";
                }}
              />
            </div>
            <div>
              <label
                htmlFor="patient-sex"
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--lv-muted)" }}
              >
                Sex
              </label>
              <select
                id="patient-sex"
                value={value.sex}
                onChange={(e) => updateField("sex", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border text-sm outline-none transition-colors appearance-none cursor-pointer"
                style={{
                  borderColor: "var(--lv-border)",
                  color: value.sex ? "var(--lv-black)" : "var(--lv-muted-light)",
                  background: "var(--lv-white)",
                }}
                onFocus={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--lv-blue)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--lv-border)";
                }}
              >
                {SEX_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row: SpO2, Temperature, Symptom Duration */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="patient-spo2"
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--lv-muted)" }}
              >
                SpO₂ (%)
              </label>
              <input
                id="patient-spo2"
                type="number"
                min={0}
                max={100}
                placeholder="e.g., 92"
                value={value.spo2}
                onChange={(e) => updateField("spo2", e.target.value)}
                className="w-full h-9 px-3 rounded-lg border text-sm outline-none transition-colors"
                style={{
                  borderColor: "var(--lv-border)",
                  color: "var(--lv-black)",
                  background: "var(--lv-white)",
                }}
                onFocus={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--lv-blue)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--lv-border)";
                }}
              />
            </div>
            <div>
              <label
                htmlFor="patient-temp"
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--lv-muted)" }}
              >
                Temp (°C)
              </label>
              <input
                id="patient-temp"
                type="number"
                step={0.1}
                placeholder="e.g., 38.5"
                value={value.temperature}
                onChange={(e) =>
                  updateField("temperature", e.target.value)
                }
                className="w-full h-9 px-3 rounded-lg border text-sm outline-none transition-colors"
                style={{
                  borderColor: "var(--lv-border)",
                  color: "var(--lv-black)",
                  background: "var(--lv-white)",
                }}
                onFocus={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--lv-blue)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--lv-border)";
                }}
              />
            </div>
            <div>
              <label
                htmlFor="patient-duration"
                className="block text-xs font-medium mb-1.5"
                style={{ color: "var(--lv-muted)" }}
              >
                Duration
              </label>
              <input
                id="patient-duration"
                type="text"
                placeholder="e.g., 3 days"
                value={value.symptom_duration}
                onChange={(e) =>
                  updateField("symptom_duration", e.target.value)
                }
                className="w-full h-9 px-3 rounded-lg border text-sm outline-none transition-colors"
                style={{
                  borderColor: "var(--lv-border)",
                  color: "var(--lv-black)",
                  background: "var(--lv-white)",
                }}
                onFocus={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--lv-blue)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLElement).style.borderColor = "var(--lv-border)";
                }}
              />
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label
              className="block text-xs font-medium mb-2"
              style={{ color: "var(--lv-muted)" }}
            >
              Symptoms
            </label>
            <div className="flex flex-wrap gap-2">
              {SYMPTOM_OPTIONS.map((symptom) => {
                const isSelected = value.symptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    type="button"
                    onClick={() => toggleSymptom(symptom)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150"
                    style={{
                      borderColor: isSelected
                        ? "var(--lv-blue)"
                        : "var(--lv-border)",
                      background: isSelected
                        ? "var(--lv-blue-light)"
                        : "var(--lv-white)",
                      color: isSelected
                        ? "var(--lv-blue)"
                        : "var(--lv-muted)",
                    }}
                  >
                    {symptom}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <label
              htmlFor="clinical-notes"
              className="block text-xs font-medium mb-1.5"
              style={{ color: "var(--lv-muted)" }}
            >
              Clinical Notes
            </label>
            <textarea
              id="clinical-notes"
              rows={3}
              placeholder="Additional clinical notes..."
              value={value.clinical_notes}
              onChange={(e) =>
                updateField("clinical_notes", e.target.value)
              }
              className="w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors resize-none"
              style={{
                borderColor: "var(--lv-border)",
                color: "var(--lv-black)",
                background: "var(--lv-white)",
              }}
              onFocus={(e) => {
                (e.target as HTMLElement).style.borderColor = "var(--lv-blue)";
              }}
              onBlur={(e) => {
                (e.target as HTMLElement).style.borderColor = "var(--lv-border)";
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
