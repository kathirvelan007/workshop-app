import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function Home() {
  const navigate = useNavigate()

  const [repairs, setRepairs] = useState([])
  const [allCount, setAllCount] = useState(0)
  const [deliveredCount, setDeliveredCount] = useState(0)
  const [pendingPaymentCount, setPendingPaymentCount] = useState(0)
  const [searchFilter, setSearchFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const allRepairs = await db.repairs.toArray()
      setAllCount(allRepairs.length)

      const inProgress = allRepairs.filter((r) => r.status === 'IN_PROGRESS')
      const delivered = allRepairs.filter((r) => r.status === 'DELIVERED')
      const pendingPayment = allRepairs.filter((r) => (Number(r.pendingAmount) || 0) > 0)

      setRepairs(inProgress.reverse())
      setDeliveredCount(delivered.length)
      setPendingPaymentCount(pendingPayment.length)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const filteredRepairs = repairs.filter((r) => {
    const query = searchFilter.toLowerCase().trim()
    if (!query) return true
    const plate = (r.bikeNumber || r.vehicleNumber || '').toLowerCase()
    const customer = (r.customerName || '').toLowerCase()
    const mobile = (r.mobileNumber || r.phone || '').toLowerCase()
    const model = (r.bikeModel || r.vehicleModel || '').toLowerCase()
    const idStr = String(r.id)

    return (
      plate.includes(query) ||
      customer.includes(query) ||
      mobile.includes(query) ||
      model.includes(query) ||
      idStr.includes(query)
    )
  })

  const todayFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="page dashboard-page">
      <div className="dashboard-container">
        {/* Hero Header */}
        <header className="dashboard-hero">
          <div className="hero-content">
            <div className="hero-pill">
              <span className="hero-pill-dot"></span>
              <span>LIVE WORKSHOP BAY</span>
            </div>
            <h1 className="hero-title">Prem Workshop Operations</h1>
            <p className="hero-subtitle">
              Manage end-to-end vehicle service lifecycle, quick estimates, advance payments & deliveries.
            </p>
          </div>
          <div className="hero-meta">
            <div className="meta-badge date-badge">
              <span className="meta-label">TODAY</span>
              <strong className="meta-value">{todayFormatted}</strong>
            </div>
            <div className="meta-badge storage-badge">
              <span className="meta-label">WORKSHOP STATUS</span>
              <strong className="meta-value">Ready for Service</strong>
            </div>
          </div>
        </header>

        {/* Top Metric Cards */}
        <div className="stats-grid">
          <div
            className="stat-card stat-pending clickable"
            onClick={() => navigate('/delivery-vehicles')}
            role="button"
            tabIndex={0}
            title="Click to view vehicles in service"
          >
            <div className="stat-icon-wrapper">
              <span>🔧</span>
            </div>
            <div className="stat-data">
              <span className="stat-title">Vehicles In Service</span>
              <div className="stat-number-row">
                <span className="stat-number">{repairs.length}</span>
                <span className="stat-badge warning">In Progress</span>
              </div>
            </div>
          </div>

          <div
            className="stat-card stat-delivered clickable"
            onClick={() => navigate('/all-issues')}
            role="button"
            tabIndex={0}
            title="Click to view delivered records"
          >
            <div className="stat-icon-wrapper">
              <span>✅</span>
            </div>
            <div className="stat-data">
              <span className="stat-title">Completed Deliveries</span>
              <div className="stat-number-row">
                <span className="stat-number">{deliveredCount}</span>
                <span className="stat-badge success">Delivered</span>
              </div>
            </div>
          </div>

          <div
            className="stat-card stat-due clickable"
            onClick={() => navigate('/pending-payments')}
            role="button"
            tabIndex={0}
            title="Click to collect and settle pending payments"
          >
            <div className="stat-icon-wrapper">
              <span>💳</span>
            </div>
            <div className="stat-data">
              <span className="stat-title">Pending Payment Dues</span>
              <div className="stat-number-row">
                <span className="stat-number">{pendingPaymentCount}</span>
                <span className="stat-badge danger">Receivables</span>
              </div>
            </div>
          </div>

          <div
            className="stat-card stat-total clickable"
            onClick={() => navigate('/all-issues')}
            role="button"
            tabIndex={0}
            title="Click to view all records"
          >
            <div className="stat-icon-wrapper">
              <span>📁</span>
            </div>
            <div className="stat-data">
              <span className="stat-title">Total Job Cards</span>
              <div className="stat-number-row">
                <span className="stat-number">{allCount}</span>
                <span className="stat-badge neutral">Lifetime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Launchpad Grid */}
        <section className="launchpad-section">
          <h2 className="section-heading">
            <span className="heading-icon">⚡</span>
            <span>Workshop Command Launchpad</span>
          </h2>

          <div className="launchpad-grid">
            <div
              className="action-card featured"
              onClick={() => navigate('/new-repair')}
              role="button"
              tabIndex={0}
            >
              <div className="action-card-header">
                <div className="action-icon primary">➕</div>
                <span className="action-tag">Primary</span>
              </div>
              <h3>New Job Card</h3>
              <p>Register customer, inspect vehicle condition, record complaints, estimate spares & labour.</p>
              <span className="action-cta">Create Job Card &rarr;</span>
            </div>

            <div
              className="action-card"
              onClick={() => navigate('/delivery-vehicles')}
              role="button"
              tabIndex={0}
            >
              <div className="action-card-header">
                <div className="action-icon amber">🚚</div>
                {repairs.length > 0 && (
                  <span className="action-counter">{repairs.length} Waiting</span>
                )}
              </div>
              <h3>Delivery & Settlement</h3>
              <p>Release serviced vehicle, compute discount, collect final bill or note pending dues.</p>
              <span className="action-cta">View Delivery Bay &rarr;</span>
            </div>

            <div
              className="action-card"
              onClick={() => navigate('/pending-payments')}
              role="button"
              tabIndex={0}
            >
              <div className="action-card-header">
                <div className="action-icon rose">💳</div>
                {pendingPaymentCount > 0 && (
                  <span className="action-counter due">{pendingPaymentCount} Pending</span>
                )}
              </div>
              <h3>Pending Payments</h3>
              <p>Track post-delivery balances, record partial or full settlements, and clear customer dues.</p>
              <span className="action-cta">Manage Dues &rarr;</span>
            </div>

            <div
              className="action-card"
              onClick={() => navigate('/get-issue')}
              role="button"
              tabIndex={0}
            >
              <div className="action-card-header">
                <div className="action-icon cyan">🔍</div>
              </div>
              <h3>Vehicle & Customer Lookup</h3>
              <p>Search by bike plate or phone to inspect service history and previous repair bills.</p>
              <span className="action-cta">Lookup History &rarr;</span>
            </div>

            <div
              className="action-card"
              onClick={() => navigate('/all-issues')}
              role="button"
              tabIndex={0}
            >
              <div className="action-card-header">
                <div className="action-icon indigo">📋</div>
              </div>
              <h3>All Job Records</h3>
              <p>Search, filter, and inspect complete archive of historical repair logs and job cards.</p>
              <span className="action-cta">Explore Records &rarr;</span>
            </div>

            <div
              className="action-card"
              onClick={() => navigate('/analyze')}
              role="button"
              tabIndex={0}
            >
              <div className="action-card-header">
                <div className="action-icon emerald">📈</div>
              </div>
              <h3>Workshop Analytics</h3>
              <p>Review revenue collections, cash vs UPI breakdowns, average bill sizes and trends.</p>
              <span className="action-cta">Open Analytics &rarr;</span>
            </div>

            <div
              className="action-card"
              onClick={() => navigate('/backup')}
              role="button"
              tabIndex={0}
            >
              <div className="action-card-header">
                <div className="action-icon purple">💾</div>
              </div>
              <h3>Backup & Restore</h3>
              <p>Download full workshop data to JSON file or import a saved backup anytime.</p>
              <span className="action-cta">Open Backup Tools &rarr;</span>
            </div>
          </div>
        </section>

        {/* Live Service Bay (Pending Deliveries) */}
        <section className="service-bay-section">
          <div className="service-bay-header">
            <div>
              <h2 className="section-heading">
                <span className="heading-icon">🛠️</span>
                <span>Vehicles In Service / Ready for Delivery</span>
                <span className="header-badge">{repairs.length} Active</span>
              </h2>
              <p className="section-subtext">Vehicles currently being repaired or awaiting customer pickup</p>
            </div>

            {repairs.length > 0 && (
              <div className="bay-search-wrapper">
                <span className="search-symbol">🔍</span>
                <input
                  type="text"
                  className="bay-search-input"
                  placeholder="Search by bike plate, mobile number, customer name, or ID..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
                {searchFilter && (
                  <button className="clear-search-btn" onClick={() => setSearchFilter('')}>✕</button>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading workshop records...</p>
            </div>
          ) : repairs.length === 0 ? (
            <div className="empty-bay-card">
              <div className="empty-bay-icon">✨</div>
              <h3>All Service Bays Clear</h3>
              <p>There are no vehicles currently in progress or waiting for delivery.</p>
              <button
                className="btn-primary-elevated"
                onClick={() => navigate('/new-repair')}
              >
                + Check-In New Vehicle
              </button>
            </div>
          ) : filteredRepairs.length === 0 ? (
            <div className="empty-bay-card">
              <div className="empty-bay-icon">🔎</div>
              <h3>No matching vehicle found</h3>
              <p>No active repair matches "{searchFilter}". Try a different plate or customer name.</p>
              <button
                className="btn-secondary-flat"
                onClick={() => setSearchFilter('')}
              >
                Clear Search Filter
              </button>
            </div>
          ) : (
            <div className="repair-bay-grid">
              {filteredRepairs.map((repair) => (
                <div className="bay-vehicle-card" key={repair.id}>
                  <div className="card-top-bar">
                    <div className="vehicle-plate-badge">
                      <span className="plate-country">IND</span>
                      <span className="plate-number">{repair.bikeNumber || 'NO PLATE'}</span>
                    </div>
                    <span className="job-tag">Job #{repair.id}</span>
                  </div>

                  <div className="card-vehicle-details">
                    <h3 className="vehicle-model">{repair.bikeModel || 'Vehicle (Model Unspecified)'}</h3>
                    <div className="customer-info-row">
                      <span className="customer-name">👤 {repair.customerName}</span>
                      {repair.mobileNumber && (
                        <a
                          href={`tel:${repair.mobileNumber}`}
                          className="customer-phone"
                          title="Call Customer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          📞 {repair.mobileNumber}
                        </a>
                      )}
                    </div>
                  </div>

                  {repair.workRequired && repair.workRequired.length > 0 && (
                    <div className="card-tags-row">
                      {repair.workRequired.slice(0, 3).map((w, idx) => (
                        <span className="work-chip" key={idx}>{w}</span>
                      ))}
                      {repair.workRequired.length > 3 && (
                        <span className="work-chip more">+{repair.workRequired.length - 3} more</span>
                      )}
                    </div>
                  )}

                  <div className="card-financial-row">
                    <div className="financial-col">
                      <span className="fin-label">Estimate</span>
                      <strong className="fin-value">₹{repair.totalEstimatedAmount || 0}</strong>
                    </div>
                    <div className="financial-col">
                      <span className="fin-label">Advance</span>
                      <strong className="fin-value advance">
                        {repair.advanceAmount ? `₹${repair.advanceAmount}` : 'None'}
                      </strong>
                    </div>
                    <div className="financial-col">
                      <span className="fin-label">Est. Balance</span>
                      <strong className="fin-value balance">
                        ₹{(Number(repair.totalEstimatedAmount) || 0) - (Number(repair.advanceAmount) || 0)}
                      </strong>
                    </div>
                  </div>

                  <div className="card-action-bar">
                    <button
                      className="btn-card-delivery"
                      onClick={() => navigate(`/delivery/${repair.id}`)}
                    >
                      <span>Deliver & Collect</span>
                      <span className="btn-arrow">&rarr;</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default Home