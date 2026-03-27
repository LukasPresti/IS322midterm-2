import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CommunityCard from "@/components/CommunityCard";

export const dynamic = 'force-dynamic';

export default async function CommunityPage() {
  const projects = await prisma.project.findMany({
    where: { isPublic: true },
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="gallery-body">
      <div className="background-effects">
        <div className="blob blob-1"></div>
        <div className="blob blob-3" style={{ background: "var(--accent-primary)" }}></div>
      </div>



      <main className="gallery-main fade-in visible">
        <div className="gallery-header" style={{ marginBottom: "3rem" }}>
          <h1>The Community Board</h1>
          <p className="subtitle">Discover fully functional AI-generated interfaces, explore the prompts that created them, and download the raw code directly to your machine.</p>
          <div className="header-actions">
            <Link href="/builder" className="btn primary-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Build Your Own
            </Link>
            <Link href="/projects" className="btn secondary-btn">Manage Your Posts</Link>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="error-banner">No public projects have been posted to the Community Board yet. Be the first!</div>
        ) : (
          <div className="gallery-grid fade-in visible">
            {projects.map((project) => (
              <CommunityCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
