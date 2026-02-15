import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, FileText, Briefcase, Menu, X, BookOpen, Zap } from 'lucide-react';

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Close sidebar on route change (for mobile)
    React.useEffect(() => {
        setSidebarOpen(false);
    }, [location.pathname]);

    return (
        <div className="app-layout">
            {/* Mobile Menu Button */}
            <button
                className="menu-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay for mobile */}
            <div
                className={`overlay ${sidebarOpen ? 'open' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="brand">
                    <Zap size={28} fill="currentColor" />
                    JobZen
                </div>
                <nav>
                    <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
                        <MessageSquare size={20} /> Chat
                    </Link>
                    <Link to="/resume" className={`nav-item ${location.pathname === '/resume' ? 'active' : ''}`}>
                        <FileText size={20} /> Resume
                    </Link>
                    <Link to="/test" className={`nav-item ${location.pathname === '/test' ? 'active' : ''}`}>
                        <Briefcase size={20} /> Mock Test
                    </Link>
                    <Link to="/aptitude" className={`nav-item ${location.pathname === '/aptitude' ? 'active' : ''}`}>
                        <BookOpen size={20} /> Aptitude
                    </Link>
                    <Link to="/dashboard" className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                        <LayoutDashboard size={20} /> Progress
                    </Link>
                </nav>
            </aside>
            <main className="content">
                <Outlet />
            </main>
        </div>
    );
}
