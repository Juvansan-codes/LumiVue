// =============================================================================
// ImageUploader — Drag-and-drop chest X-ray upload component
// =============================================================================
// Owner: Frontend Member 1 (UI / Upload experience)
// TODO: Implement drag-and-drop using react-dropzone
// TODO: Add file type validation (JPEG, PNG, DICOM)
// TODO: Add image preview after upload
// =============================================================================

"use client";

import React from "react";

interface ImageUploaderProps {
  onImageSelect?: (file: File) => void;
}

export default function ImageUploader({ onImageSelect: _onImageSelect }: ImageUploaderProps) {
  return (
    <div className="rounded-xl border-2 border-dashed border-neutral-700 p-12 text-center transition hover:border-cyan-500/50">
      <p className="text-sm text-neutral-400">
        Drag &amp; drop a chest X-ray here, or click to browse
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        Supports JPEG, PNG, DICOM
      </p>
    </div>
  );
}
