import { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { db } from '../db/database'
import RajaLogo from './RajaLogo'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingDuesCount, setPendingDuesCount] = useState(0)

  const [toolsOpen, setToolsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Real-time counter of active repair jobs & post-delivery pending dues
  const loadCounts = async () => {
    try {
      const all = await db.repairs.toArray()
      setPendingCount(all.filter((r) => r.status === 'IN_PROGRESS').length)
      setPendingDuesCount(all.filter((r) => (Number(r.pendingAmount) || 0) > 0).length)
    } catch (e) {
      console.error('Failed to load navigation counters:', e)
    }
  }

  useEffect(() => {
    loadCounts()
    const interval = setInterval(loadCounts, 4000)
    return () => clearInterval(interval)
  }, [location.pathname])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setToolsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNavigation = (path) => {
    navigate(path)
    setMenuOpen(false)
    setToolsOpen(false)
  }

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  const isToolsActive = isActive('/analyze') || isActive('/backup')

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Brand / Logo - Raja Two Wheeler Garage Since 1985 */}
        <div
          className="navbar-brand"
          onClick={() => handleNavigation('/')}
          role="button"
          tabIndex={0}
        >
          <RajaLogo size="sm" showTagline={true} />
        </div>

        {/* Desktop Navigation Links */}
        <div className="navbar-links">
          <button
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => handleNavigation('/')}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
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

          {/* Tools & Settings Dropdown */}
          <div className="nav-dropdown-wrapper" ref={dropdownRef}>
            <button
              className={`nav-link dropdown-toggle ${isToolsActive ? 'active' : ''} ${toolsOpen ? 'open' : ''}`}
              onClick={() => setToolsOpen(!toolsOpen)}
              aria-expanded={toolsOpen}
              aria-haspopup="true"
            >
              <span className="nav-icon">⚙️</span>
              <span>Tools</span>
              <span className="dropdown-caret">{toolsOpen ? '▲' : '▼'}</span>
            </button>

            {toolsOpen && (
              <div className="nav-dropdown-menu">
                <button
                  className={`dropdown-menu-item ${isActive('/analyze') ? 'active' : ''}`}
                  onClick={() => handleNavigation('/analyze')}
                >
                  <span className="dropdown-item-icon">📈</span>
                  <div className="dropdown-item-content">
                    <span className="dropdown-item-title">Analytics & Reports</span>
                    <span className="dropdown-item-sub">Revenue, jobs & service trends</span>
                  </div>
                </button>

                <div className="dropdown-divider" />

                <button
                  className={`dropdown-menu-item ${isActive('/backup') ? 'active' : ''}`}
                  onClick={() => handleNavigation('/backup')}
                >
                  <span className="dropdown-item-icon">💾</span>
                  <div className="dropdown-item-content">
                    <span className="dropdown-item-title">Backup & Restore</span>
                    <span className="dropdown-item-sub">Export or import garage database</span>
                  </div>
                </button>
              </div>
            )}
          </div>
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

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="mobile-menu">
          <div className="mobile-menu-brand-header">
            <RajaLogo size="md" showTagline={true} />
          </div>

          <div className="mobile-menu-links">
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
        </div>
      )}
    </nav>
  )
}

export default Navbar