"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="dashboard-layout">
      {/* Persistent Left Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <div className="logo">
            Lukas<span className="highlight">.</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <Link href="/home" className={`sidebar-link ${pathname === "/home" ? "active" : ""}`}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            Home Dashboard
          </Link>
          <Link href="/builder" className={`sidebar-link ${pathname === "/builder" ? "active" : ""}`}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Create Editor
          </Link>
          <Link href="/projects" className={`sidebar-link ${pathname === "/projects" ? "active" : ""}`}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            My Projects
          </Link>
          <Link href="/community" className={`sidebar-link ${pathname === "/community" ? "active" : ""}`}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            Community Board
          </Link>
        </nav>
        
        <div className="sidebar-footer mt-4">
          <Link href="/profile" className={`sidebar-link ${pathname === "/profile" ? "active" : ""}`}>
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16z"></path><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path><path d="M12 14v2"></path><path d="M12 8v2"></path></svg>
            Settings
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        <header className="topbar">
           <div></div> {/* Spacing for flex-between */}
           <div className="user-profile">
             <span className="user-email">{session?.user?.email}</span>
             <button onClick={handleSignOut} className="btn secondary-btn signout-btn">Sign Out</button>
           </div>
        </header>

        <main className="dashboard-content fade-in visible">
          {children}
        </main>
      </div>

      <style>{`
        .dashboard-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          min-height: 100vh;
          background-color: var(--bg-darker);
        }

        .sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          border-radius: 0;
          border: none;
          border-right: 1px solid var(--glass-border);
          padding: 2rem 1.5rem;
          display: flex;
          flex-direction: column;
          z-index: 50;
        }

        .sidebar-header {
          margin-bottom: 3rem;
          padding-left: 0.5rem;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex-grow: 1;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 12px;
          color: var(--text-muted);
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-main);
        }

        .sidebar-link.active {
          background: var(--accent-glow);
          color: white;
          border-left: 3px solid var(--accent-primary);
          font-weight: 600;
        }

        .main-area {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow-y: auto;
          position: relative;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 3rem;
          width: 100%;
          z-index: 10;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: var(--glass-bg);
          backdrop-filter: blur(16px);
          padding: 0.5rem 0.5rem 0.5rem 1.5rem;
          border-radius: 50px;
          border: 1px solid var(--glass-border);
        }

        .user-email {
          font-weight: 500;
          font-size: 0.95rem;
        }

        .signout-btn {
          padding: 0.5rem 1.5rem;
          border-radius: 40px;
          font-size: 0.85rem;
        }

        .dashboard-content {
          padding: 0 3rem 3rem;
          flex-grow: 1;
        }

        /* Adjust internal builder screens to remove padding collisions */
        .dashboard-content .builder-main,
        .dashboard-content .gallery-main {
            padding-top: 20px !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
        }
        
        .dashboard-content .navbar {
          display: none !important; /* Hide old navbars */
        }
      `}</style>
    </div>
  );
}
