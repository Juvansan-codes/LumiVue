"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ScanLine, Upload, Shield, X } from "lucide-react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  previewUrl: string | null;
}

export function UploadZone({
  onFileSelect,
  selectedFile,
  onClear,
  previewUrl,
}: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
      setIsDragActive(false);
    },
    [onFileSelect],
  );

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "application/dicom": [".dcm"],
    },
    maxFiles: 1,
    noClick: true,
  });

  return (
    <div
      className="rounded-xl border bg-white p-6"
      style={{
        borderColor: "var(--lv-border)",
        boxShadow: "var(--lv-shadow-sm)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            className="text-base font-semibold"
            style={{ color: "var(--lv-black)" }}
          >
            Upload Chest X-ray
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: "var(--lv-muted)" }}
          >
            DICOM, PNG or JPEG
          </p>
        </div>
        {selectedFile && (
          <button
            onClick={onClear}
            className="flex items-center justify-center h-7 w-7 rounded-lg transition-colors"
            style={{ color: "var(--lv-muted)" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--lv-danger-light)";
              (e.currentTarget as HTMLElement).style.color =
                "var(--lv-danger)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "transparent";
              (e.currentTarget as HTMLElement).style.color =
                "var(--lv-muted)";
            }}
            aria-label="Remove selected image"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropzone or Preview */}
      {selectedFile && previewUrl ? (
        <div className="relative">
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: "var(--lv-viewer-bg)" }}
          >
            <img
              src={previewUrl}
              alt="Selected chest X-ray preview"
              className="w-full h-48 object-contain"
            />
          </div>
          <div
            className="mt-3 flex items-center gap-2 text-xs"
            style={{ color: "var(--lv-muted)" }}
          >
            <ScanLine className="h-3.5 w-3.5" />
            <span className="truncate">{selectedFile.name}</span>
            <span className="ml-auto">
              {(selectedFile.size / 1024).toFixed(0)} KB
            </span>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`
            relative flex flex-col items-center justify-center
            rounded-lg border-2 border-dashed p-8
            cursor-pointer transition-all duration-200
          `}
          style={{
            borderColor: isDragActive
              ? "var(--lv-blue)"
              : "var(--lv-border)",
            background: isDragActive
              ? "var(--lv-blue-light)"
              : "var(--lv-surface-raised)",
          }}
        >
          <input {...getInputProps()} />

          <div
            className="flex items-center justify-center h-12 w-12 rounded-xl mb-4"
            style={{
              background: isDragActive
                ? "var(--lv-blue-muted)"
                : "var(--lv-border-light)",
            }}
          >
            {isDragActive ? (
              <Upload
                className="h-5 w-5"
                style={{ color: "var(--lv-blue)" }}
              />
            ) : (
              <ScanLine
                className="h-5 w-5"
                style={{ color: "var(--lv-muted)" }}
              />
            )}
          </div>

          <button
            type="button"
            onClick={open}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all duration-200"
            style={{
              background: "var(--lv-blue)",
              boxShadow: "var(--lv-shadow-sm)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--lv-blue-hover)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "var(--lv-shadow-blue)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                "var(--lv-blue)";
              (e.currentTarget as HTMLElement).style.boxShadow =
                "var(--lv-shadow-sm)";
            }}
          >
            Select X-ray
          </button>

          <p
            className="text-xs mt-2"
            style={{ color: "var(--lv-muted)" }}
          >
            or drag and drop here
          </p>
        </div>
      )}

      {/* Privacy indicator */}
      <div
        className="flex items-center gap-1.5 mt-4 text-[11px]"
        style={{ color: "var(--lv-muted-light)" }}
      >
        <Shield className="h-3 w-3" />
        <span>Secure analysis • No permanent storage</span>
      </div>
    </div>
  );
}
