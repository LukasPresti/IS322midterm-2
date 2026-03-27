"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [pat, setPat] = useState("");
  const [repoName, setRepoName] = useState("IS322midterm-2");
  const [repoOwner, setRepoOwner] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data?.profile) {
            setPat(data.profile.githubPat || "");
            setRepoName(data.profile.githubRepo || "IS322midterm-2");
            setRepoOwner(data.profile.githubOwner || "");
          }
        });
    }
  }, [session]);

  if (status === "loading") {
    return <div className="loader-container"><div className="spinner"></div></div>;
  }

  if (status === "unauthenticated") {
    return (
      <div className="portfolio-body" style={{ minHeight: "100vh", padding: "100px 5%" }}>
        <div className="background-effects">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
        </div>
        <div className="glass-panel" style={{ maxWidth: 500, margin: "0 auto", padding: "2.5rem", textAlign: "center" }}>
          <h1 style={{ marginBottom: "1rem" }}>Login Required</h1>
          <p style={{ marginBottom: "2rem", color: "var(--text-muted)" }}>Sign in to configure your AI Builder account.</p>
          <button onClick={() => signIn("google")} className="btn primary-btn w-100">
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubPat: pat,
          githubRepo: repoName,
          githubOwner: repoOwner,
        }),
      });

      if (res.ok) {
        setMessage("Profile saved successfully! You can now use the Builder.");
      } else {
        setMessage("Failed to save profile.");
      }
    } catch (err) {
      setMessage("An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="builder-body">
      <div className="background-effects">
        <div className="blob blob-1"></div>
        <div className="blob blob-3"></div>
      </div>



      <main className="builder-main fade-in visible" style={{ gridTemplateColumns: "1fr", maxWidth: 800 }}>
        <div className="builder-container glass-panel">
          <header className="builder-header">
            <h1>Your Account Setup</h1>
            <p style={{ color: "var(--text-muted)" }}>Logged in as {session?.user?.email}</p>
          </header>

          <form onSubmit={handleSave} className="config-form">
            <div className="form-group">
              <label>GitHub PAT (Personal Access Token)</label>
              <input 
                type="password" 
                value={pat} 
                onChange={(e) => setPat(e.target.value)} 
                placeholder="ghp_..." 
                required
              />
            </div>

            <div className="form-group">
              <label>GitHub Account (Owner)</label>
              <input 
                type="text" 
                value={repoOwner} 
                onChange={(e) => setRepoOwner(e.target.value)} 
                placeholder="e.g. LukasPresti" 
                required
              />
            </div>

            <div className="form-group">
              <label>Target Repository</label>
              <input 
                type="text" 
                value={repoName} 
                onChange={(e) => setRepoName(e.target.value)} 
                placeholder="e.g. IS322midterm-2" 
                required
              />
            </div>

            {message && <p style={{ color: message.includes("success") ? "var(--success)" : "var(--danger)" }}>{message}</p>}

            <button type="submit" disabled={saving} className="btn primary-btn btn-large w-100 mt-4">
              {saving ? "Saving..." : "Save Configuration"}
            </button>
          </form>

          <div className="mt-4" style={{ textAlign: "center", width: "100%", marginTop: "2rem" }}>
             <Link href="/home" className="btn secondary-btn">Proceed to Dashboard &rarr;</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
