"use client";

import { useState } from "react";
import JSZip from "jszip";
import Link from "next/link";

export default function CommunityCard({ project }: { project: any }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      let filesToDownload = [];
      try {
        filesToDownload = JSON.parse(project.htmlContent);
        // Ensure it's an array
        if (!Array.isArray(filesToDownload)) throw new Error("Not array");
      } catch (e) {
        // Backwards compatibility for older single-file generations
        filesToDownload = [{ filepath: "index.html", content: project.htmlContent }];
      }

      const zip = new JSZip();
      
      filesToDownload.forEach((file: any) => {
        zip.file(file.filepath, file.content);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title || "website"}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to generate zip", e);
    }
    setDownloading(false);
  };

  const dateDisplay = new Date(project.createdAt).toLocaleDateString();

  return (
    <div className="gallery-card glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem", position: "relative" }}>
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="card-title" style={{ margin: 0 }}>{project.title}</h3>
      </div>
      
      <div className="card-body">
        <p className="card-date" style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
          Created by <span style={{ color: "var(--accent-primary)", fontWeight: "bold" }}>{project.user?.name || project.user?.email || "Unknown"}</span> on {dateDisplay}
        </p>
        <p style={{ fontSize: "0.95rem", fontStyle: "italic", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px" }}>
          &quot;{project.prompt}&quot;
        </p>
      </div>

      <div className="card-actions" style={{ marginTop: "auto", display: "flex", gap: "0.5rem", flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem" }}>
        {project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="btn secondary-btn" style={{ flex: 1, textAlign: "center", fontSize: "0.9rem" }}>
            Live
          </a>
        )}
        <Link href={`/builder?forkId=${project.id}`} className="btn secondary-btn" style={{ flex: 1, textAlign: "center", fontSize: "0.9rem" }}>
           Fork
        </Link>
        <button onClick={handleDownload} disabled={downloading} className="btn primary-btn" style={{ flex: 2, fontSize: "0.9rem" }}>
          {downloading ? "Zipping..." : "Download .zip"}
        </button>
      </div>
    </div>
  );
}
