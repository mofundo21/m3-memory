"use client";

import { useState } from "react";

interface MediaFile {
  file: File;
  preview: string;
  id: string;
}

export function MediaPicker() {
  const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
  const [error, setError] = useState<string>("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const files = Array.from(e.currentTarget.files || []);

    if (selectedFiles.length + files.length > 5) {
      setError("Maximum 5 files allowed");
      return;
    }

    const newFiles = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).slice(2),
    }));

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  return (
    <div>
      <div className="field">
        <label>Upload photos (JPEG, PNG, WebP)</label>
        <input
          type="file"
          name="media"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
        />
        <p className="micro-note">
          Up to 5 images, 8MB each. These stay private unless you enable Media Consent below.
        </p>
      </div>

      {error && <p style={{ color: "var(--error-red)", fontSize: "13px" }}>{error}</p>}

      {selectedFiles.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: "500", marginBottom: "8px" }}>
            Selected files ({selectedFiles.length}/5):
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
              gap: "8px",
            }}
          >
            {selectedFiles.map((item) => (
              <div
                key={item.id}
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  background: "var(--bg-soft)",
                  borderRadius: "4px",
                  overflow: "hidden",
                  fontSize: "11px",
                }}
              >
                <img
                  src={item.preview}
                  alt={item.file.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <button
                  type="button"
                  onClick={() => removeFile(item.id)}
                  style={{
                    position: "absolute",
                    top: "2px",
                    right: "2px",
                    width: "20px",
                    height: "20px",
                    padding: "0",
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    border: "none",
                    borderRadius: "2px",
                    cursor: "pointer",
                    fontSize: "12px",
                    lineHeight: "1",
                  }}
                  aria-label={`Remove ${item.file.name}`}
                >
                  ✕
                </button>
                <div
                  style={{
                    position: "absolute",
                    bottom: "0",
                    width: "100%",
                    background: "rgba(0,0,0,0.5)",
                    color: "white",
                    padding: "2px",
                    fontSize: "9px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={item.file.name}
                >
                  {item.file.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
