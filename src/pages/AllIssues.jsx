import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function AllIssues() {
  const navigate = useNavigate()
  const [repairs, setRepairs] = useState([])
  const [search, setSearch] = useState('')
  const [filterTab, setFilterTab] = useState('ALL') // 'ALL', 'IN_PROGRESS', 'DELIVERED', 'PENDING_DUES'
  const [loading, setLoading] = useState(true)

  const loadRepairs = async () => {
    try {
      setLoading(true)
      const data = await db.repairs
        .orderBy('id')
        .reverse()
        .toArray()
      setRepairs(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRepairs()
  }, [])

  const filteredRepairs = repairs.filter((r) => {
    // Tab filter
    if (filterTab === 'IN_PROGRESS' && r.status !== 'IN_PROGRESS') return false
    if (filterTab === 'DELIVERED' && r.status !== 'DELIVERED') return false
    if (filterTab === 'PENDING_DUES' && (Number(r.pendingAmount) || 0) <= 0) return false

    // Search query
    const q = search.toLowerCase()
    const plate = (r.bikeNumber || r.vehicleNumber || '').toLowerCase()
    const customer = (r.customerName || '').toLowerCase()
    const phone = (r.mobileNumber || r.phone || '').toLowerCase()
    const model = (r.bikeModel || r.vehicleModel || '').toLowerCase()
    const idStr = String(r.id)

    return (
      plate.includes(q) ||
      customer.includes(q) ||
      phone.includes(q) ||
      model.includes(q) ||
      idStr.includes(q)
    )
  })

  const inProgressCount = repairs.filter((r) => r.status === 'IN_PROGRESS').length
  const deliveredCount = repairs.filter((r) => r.status === 'DELIVERED').length
  const pendingDuesCount = repairs.filter((r) => (Number(r.pendingAmount) || 0) > 0).length

  return (
    <div className="page all-records-page">
      <div className="records-container">
        {/* Page Header */}
        <div className="records-header-row">
          <div>
            <div className="sub-badge">CENTRAL REPOSITORY</div>
            <h1 className="page-main-title">Workshop Repair Records</h1>
            <p className="page-sub-title">Complete registry of customer job cards, repair histories, and financials</p>
          </div>

          <button
            className="btn-primary-elevated"
            onClick={() => navigate('/new-repair')}
          >
            + New Job Card
          </button>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="records-toolbar">
          <div className="filter-tabs-strip">
            <button
              className={`filter-tab ${filterTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterTab('ALL')}
            >
              All Records ({repairs.length})
            </button>
            <button
              className={`filter-tab ${filterTab === 'IN_PROGRESS' ? 'active' : ''}`}
              onClick={() => setFilterTab('IN_PROGRESS')}
            >
              In Progress ({inProgressCount})
            </button>
            <button
              className={`filter-tab ${filterTab === 'DELIVERED' ? 'active' : ''}`}
              onClick={() => setFilterTab('DELIVERED')}
            >
              Delivered ({deliveredCount})
            </button>
            <button
              className={`filter-tab ${filterTab === 'PENDING_DUES' ? 'active' : ''}`}
              onClick={() => setFilterTab('PENDING_DUES')}
            >
              Pending Dues ({pendingDuesCount})
            </button>
          </div>

          <div className="search-box-elevated mini">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Filter by bike plate, mobile number, customer name, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button className="clear-btn" onClick={() => setSearch('')}>✕</button>}
          </div>
        </div>

        {/* Content Table */}
        {loading ? (
          <div className="loading-card">
            <div className="loading-spinner"></div>
            <p>Loading workshop records...</p>
          </div>
        ) : filteredRepairs.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">📂</div>
            <h3>No Records Match Criteria</h3>
            <p>
              {search
                ? `No results match "${search}". Try clearing search or selecting another tab.`
                : 'No repair records in this category yet.'}
            </p>
            {search && (
              <button className="btn-secondary-flat" onClick={() => setSearch('')}>
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="table-scroll-hint-row print-hide">
              <span className="scroll-hint-text">↔ Swipe table horizontally to view all columns</span>
            </div>
            <div className="modern-table-wrapper">
              <table className="modern-data-table">
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Vehicle Plate</th>
                    <th>Customer</th>
                    <th>Model / Make</th>
                    <th>Work Summary</th>
                    <th>Total Bill</th>
                    <th>Pending Dues</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRepairs.map((repair) => {
                    const isDelivered = repair.status === 'DELIVERED'
                    const plate = repair.bikeNumber || repair.vehicleNumber || 'NO PLATE'
                    const phone = repair.mobileNumber || repair.phone || '-'
                    const model = repair.bikeModel || repair.vehicleModel || '-'
                    const work = repair.workRequired?.join(', ') || repair.issue || '-'
                    const total = repair.finalAmount || repair.totalEstimatedAmount || 0
                    const pending = Number(repair.pendingAmount) || 0

                    return (
                      <tr key={repair.id}>
                        <td className="job-id-cell">
                          <strong>#{repair.id}</strong>
                        </td>

                        <td>
                          <div className="vehicle-plate-badge mini">
                            <span className="plate-country">IND</span>
                            <span className="plate-number">{plate}</span>
                          </div>
                        </td>

                        <td>
                          <div className="cell-customer">
                            <strong>{repair.customerName}</strong>
                            <span className="text-muted small">📞 {phone}</span>
                          </div>
                        </td>

                        <td className="model-cell">{model}</td>

                        <td className="work-cell" title={work}>
                          <span className="truncate-text">{work}</span>
                        </td>

                        <td className="amount-cell">
                          <strong>₹{total}</strong>
                        </td>

                        <td className="pending-cell">
                          {pending > 0 ? (
                            <span className="badge-due">₹{pending}</span>
                          ) : (
                            <span className="badge-settled">Paid</span>
                          )}
                        </td>

                        <td>
                          <span className={`status-badge-chip ${isDelivered ? 'delivered' : 'in-progress'}`}>
                            <span className="dot"></span>
                            <span>{repair.status}</span>
                          </span>
                        </td>

                        <td className="text-right action-cell">
                          {isDelivered ? (
                            <button
                              className="btn-table-action"
                              onClick={() => navigate(`/receipt/${repair.id}`)}
                              title="View / Print Receipt"
                            >
                              Receipt
                            </button>
                          ) : (
                            <button
                              className="btn-table-action primary"
                              onClick={() => navigate(`/delivery/${repair.id}`)}
                              title="Proceed to Delivery & Settlement"
                            >
                              Deliver &rarr;
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AllIssues