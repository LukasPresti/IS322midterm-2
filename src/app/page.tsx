"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Home() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".fade-in");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="portfolio-body">
      <div className="background-effects">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <nav className="navbar">
        <div className="logo">Lukas.</div>
        <div className="nav-links">
          <Link href="#about">About</Link>
          <Link href="#projects">Projects</Link>
          <Link href="#contact">Contact</Link>
        </div>
      </nav>

      <main className="portfolio-main">
        <section id="hero" className="hero-section">
          <div className="hero-content fade-in">
            <h1>
              Hi, I&apos;m <span className="highlight">Lukas</span>
            </h1>
            <p className="subtitle">I build intelligent, creative, and powerful web experiences.</p>
            <div className="hero-actions">
              <Link href="#projects" className="btn primary-btn btn-large">
                View My Work
              </Link>
            </div>
          </div>
        </section>

        <section id="projects" className="projects-section">
          <h2 className="section-title fade-in">Featured Projects</h2>

          <div className="project-grid">
            <div className="project-card glass-panel fade-in">
              <div className="project-info">
                <div className="project-tags">
                  <span className="tag ai-tag">AI</span>
                  <span className="tag web-tag">Web</span>
                </div>
                <h3>Voice-to-Website Builder</h3>
                <p>
                  A cutting-edge, serverless tool that leverages OpenAI Whisper and GPT-4o to dynamically generate and
                  deploy fully functional, styled web pages directly to GitHub Pages using only your voice instructions.
                </p>

                <div className="project-actions flex gap-4 mt-4">
                  <Link href="/builder" className="btn primary-btn launch-btn flex-1">
                    Launch App
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <Link href="/projects" className="btn secondary-btn flex-1">
                    View Gallery
                  </Link>
                </div>
              </div>
            </div>

            <div className="project-card glass-panel fade-in">
              <div className="project-info">
                <div className="project-tags">
                  <span className="tag ecom-tag">E-Commerce</span>
                </div>
                <h3>NatureMart</h3>
                <p>
                  A responsive, comprehensive e-commerce platform designed for all-natural products, featuring detailed
                  product listings and an intuitive cart system.
                </p>
                <div className="project-actions mt-4">
                  <Link href="#" className="btn secondary-btn">
                    Coming Soon
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <p>&copy; 2026 Lukas. IS322 Midterm.</p>
      </footer>
    </div>
  );
}
