"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CommunityCard from "@/components/CommunityCard";

export default function DashboardHome() {
  const [recentProjects, setRecentProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch latest community posts
    fetch("/api/projects")
      .then(res => res.json())
      .then(data => {
        // filter only public and take first 4-6
        const publicProjects = data.projects?.filter((p: any) => p.isPublic).slice(0, 6) || [];
        setRecentProjects(publicProjects);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="home-dashboard fade-in visible" style={{ marginTop: "1rem" }}>
      <header className="dashboard-hero glass-panel">
        <div className="hero-content">
          <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>Welcome back to Architect</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: "2.5rem", fontSize: "1.1rem" }}>
            Ready to design something new? Turn your voice directly into production-grade React & CSS.
          </p>
          <Link href="/builder" className="btn primary-btn btn-large" style={{ padding: "1rem 2.5rem", fontSize: "1.2rem", height: "auto" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            Create New Website
          </Link>
        </div>
        <div className="hero-illustration">
          <svg width="180" height="180" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="var(--accent-primary)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 11L14.4996 11.5L14.9996 14L15.9996 11.5L18.4996 11L15.9996 10.5L14.9996 8L14.4996 10.5L12 11Z" fill="var(--success)" opacity="0.8" />
            <path d="M6 10H9M6 14H18" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </header>

      <section className="recent-community mt-4" style={{ marginTop: "4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.8rem" }}>Latest Community Creations</h2>
          <Link href="/community" className="btn secondary-btn" style={{ padding: "0.5rem 1rem" }}>View All</Link>
        </div>

        {loading ? (
          <div className="loader-container glass-panel" style={{ height: "300px" }}>
            <div className="spinner"></div>
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="glass-panel" style={{ padding: "3rem", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)" }}>No recent community posts available.</p>
          </div>
        ) : (
          <div className="gallery-grid">
            {recentProjects.map((project: any) => (
              <CommunityCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </section>

      <style>{`
        .dashboard-hero {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4rem 5rem;
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
          overflow: hidden;
        }

        .dashboard-hero::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -10%;
          width: 50%;
          height: 200%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
          transform: rotate(-15deg);
        }

        .hero-illustration {
          opacity: 0.8;
          animation: float 6s infinite ease-in-out;
        }

        @media (max-width: 1024px) {
          .dashboard-hero {
            flex-direction: column;
            text-align: center;
            padding: 3rem 2rem;
          }
          .hero-illustration {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
