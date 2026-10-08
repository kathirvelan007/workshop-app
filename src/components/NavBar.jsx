import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingDuesCount, setPendingDuesCount] = useState(0)

  const loadCounts = async () => {
    try {
      const all = await db.repairs.toArray()
      setPendingCount(all.filter((r) => r.status === 'IN_PROGRESS').length)
      setPendingDuesCount(all.filter((r) => (Number(r.pendingAmount) || 0) > 0).length)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadCounts()
    const interval = setInterval(loadCounts, 4000)
    return () => clearInterval(interval)
  }, [location.pathname])

  const handleNavigation = (path) => {
    navigate(path)
    setMenuOpen(false)
  }

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand / Logo */}
        <div
          className="navbar-brand"
          onClick={() => handleNavigation('/')}
          role="button"
          tabIndex={0}
        >
          <div className="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">PREM WORKSHOP</span>
            <span className="brand-badge">GARAGE</span>
          </div>
        </div>

        {/* Desktop Links */}
        <div className="navbar-links">
          <button
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => handleNavigation('/')}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-link ${isActive('/new-repair') ? 'active' : ''}`}
            onClick={() => handleNavigation('/new-repair')}
          >
            <span className="nav-icon">➕</span>
            <span>New Job Card</span>
          </button>

          <button
            className={`nav-link ${isActive('/delivery-vehicles') ? 'active' : ''}`}
            onClick={() => handleNavigation('/delivery-vehicles')}
          >
            <span className="nav-icon">🚚</span>
            <span>Delivery Bay</span>
            {pendingCount > 0 && (
              <span className="nav-badge-pill">{pendingCount}</span>
            )}
          </button>

          <button
            className={`nav-link ${isActive('/pending-payments') ? 'active' : ''}`}
            onClick={() => handleNavigation('/pending-payments')}
          >
            <span className="nav-icon">💳</span>
            <span>Pending Dues</span>
            {pendingDuesCount > 0 && (
              <span className="nav-badge-pill due">{pendingDuesCount}</span>
            )}
          </button>

          <button
            className={`nav-link ${isActive('/all-issues') ? 'active' : ''}`}
            onClick={() => handleNavigation('/all-issues')}
          >
            <span className="nav-icon">📋</span>
            <span>Records</span>
          </button>

          <button
            className={`nav-link ${isActive('/get-issue') ? 'active' : ''}`}
            onClick={() => handleNavigation('/get-issue')}
          >
            <span className="nav-icon">🔍</span>
            <span>Lookup</span>
          </button>

          <button
            className={`nav-link ${isActive('/analyze') ? 'active' : ''}`}
            onClick={() => handleNavigation('/analyze')}
          >
            <span className="nav-icon">📈</span>
            <span>Analytics</span>
          </button>

          <button
            className={`nav-link ${isActive('/backup') ? 'active' : ''}`}
            onClick={() => handleNavigation('/backup')}
          >
            <span className="nav-icon">💾</span>
            <span>Backup</span>
          </button>
        </div>

        {/* Right Status Badge & Mobile Trigger */}
        <div className="navbar-right">
          <button
            className="btn-quick-new-nav"
            onClick={() => handleNavigation('/new-repair')}
            title="Create a new repair job card"
          >
            <span>+ New Job</span>
          </button>

          <button
            className="hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="mobile-menu">
          <button
            className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => handleNavigation('/')}
          >
            <span>📊 Dashboard</span>
          </button>

          <button
            className={`mobile-nav-link ${isActive('/new-repair') ? 'active' : ''}`}
            onClick={() => handleNavigation('/new-repair')}
          >
            <span>➕ New Job Card</span>
          </button>

          <button
            className={`mobile-nav-link ${isActive('/delivery-vehicles') ? 'active' : ''}`}
            onClick={() => handleNavigation('/delivery-vehicles')}
          >
            <span>🚚 Delivery Bay</span>
            {pendingCount > 0 && (
              <span className="nav-badge-pill">{pendingCount}</span>
            )}
          </button>

          <button
            className={`mobile-nav-link ${isActive('/pending-payments') ? 'active' : ''}`}
            onClick={() => handleNavigation('/pending-payments')}
          >
            <span>💳 Pending Dues</span>
            {pendingDuesCount > 0 && (
              <span className="nav-badge-pill due">{pendingDuesCount}</span>
            )}
          </button>

          <button
            className={`mobile-nav-link ${isActive('/all-issues') ? 'active' : ''}`}
            onClick={() => handleNavigation('/all-issues')}
          >
            <span>📋 All Records</span>
          </button>

          <button
            className={`mobile-nav-link ${isActive('/get-issue') ? 'active' : ''}`}
            onClick={() => handleNavigation('/get-issue')}
          >
            <span>🔍 Vehicle & Customer Lookup</span>
          </button>

          <button
            className={`mobile-nav-link ${isActive('/analyze') ? 'active' : ''}`}
            onClick={() => handleNavigation('/analyze')}
          >
            <span>📈 Analytics & Reports</span>
          </button>

          <button
            className={`mobile-nav-link ${isActive('/backup') ? 'active' : ''}`}
            onClick={() => handleNavigation('/backup')}
          >
            <span>💾 Backup & Restore Data</span>
          </button>
        </div>
      )}
    </nav>
  )
}

export default Navbar