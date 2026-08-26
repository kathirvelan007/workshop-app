import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleNavigation = (path) => {
    navigate(path)
    setMenuOpen(false)
  }

  return (
    <nav className="navbar">

      <div
        className="navbar-logo"
        onClick={() => handleNavigation('/')}
      >
        🔧 Prem Workshop
      </div>

      {/* Desktop Menu */}
      <div className="navbar-links">

        <button onClick={() => handleNavigation('/')}>
          Home
        </button>

        <button onClick={() => handleNavigation('/new-repair')}>
          New Repair
        </button>

        <button onClick={() => handleNavigation('/get-issue')}>
          Get Issue
        </button>

      </div>

      {/* Hamburger Button */}
      <button
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu">

          <button onClick={() => handleNavigation('/')}>
            Home
          </button>

          <button onClick={() => handleNavigation('/new-repair')}>
            New Repair
          </button>

          <button onClick={() => handleNavigation('/get-issue')}>
            Get Issue
          </button>

        </div>
      )}

    </nav>
  )
}

export default Navbar