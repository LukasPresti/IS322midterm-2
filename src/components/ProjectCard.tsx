"use client";

import { useState } from "react";
import JSZip from "jszip";

export default function ProjectCard({ project }: { project: any }) {
  const [isPublic, setIsPublic] = useState(project.isPublic);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const togglePublic = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: !isPublic }),
      });
      if (res.ok) {
        setIsPublic(!isPublic);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      let filesToDownload = [];
      try {
        filesToDownload = JSON.parse(project.htmlContent);
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

  const dateDisplay = new Date(project.createdAt).toLocaleString();

  return (
    <div className="gallery-card glass-panel" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="card-title" style={{ margin: 0 }}>{project.title}</h3>
        <span className="card-badge" style={{ backgroundColor: isPublic ? "var(--success)" : "var(--bg-card)", color: isPublic ? "#fff" : "var(--text-muted)" }}>
          {isPublic ? "Public" : "Private"}
        </span>
      </div>
      
      <div className="card-body">
        <p className="card-date" style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>{dateDisplay}</p>
        <p style={{ fontSize: "0.95rem", fontStyle: "italic", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px" }}>
          &quot;{project.prompt}&quot;
        </p>
      </div>

      <div className="card-actions" style={{ marginTop: "auto", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {project.githubUrl && (
          <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="card-btn btn-view" style={{ flex: 1, textAlign: "center" }}>
            Live Preview
          </a>
        )}
        <button onClick={handleDownload} disabled={downloading} className="card-btn btn-update" style={{ flex: 1 }}>
          {downloading ? "Zipping..." : "Download Code"}
        </button>
      </div>

      <button 
        onClick={togglePublic} 
        disabled={loading}
        className={`btn w-100 ${isPublic ? "secondary-btn" : "primary-btn"}`}
        style={{ marginTop: "0.5rem" }}
      >
        {isPublic ? "Unpublish from Community" : "Publish to Community"}
      </button>
    </div>
  );
}
