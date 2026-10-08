import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function DeliveryVehicle() {
  const navigate = useNavigate()

  const [repairs, setRepairs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const loadPendingRepairs = async () => {
    try {
      setLoading(true)
      const allRepairs = await db.repairs.toArray()
      const pendingRepairs = allRepairs.filter(
        (repair) => repair.status === 'IN_PROGRESS'
      )
      setRepairs(pendingRepairs.reverse())
    } catch (err) {
      console.error('Error loading pending vehicles:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPendingRepairs()
  }, [])

  // Dynamic filtering based on bike number, customer, phone, or model
  const filteredRepairs = repairs.filter((repair) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    const plate = (repair.bikeNumber || repair.vehicleNumber || '').toLowerCase()
    const customer = (repair.customerName || '').toLowerCase()
    const phone = (repair.mobileNumber || repair.phone || '').toLowerCase()
    const model = (repair.bikeModel || repair.vehicleModel || '').toLowerCase()
    const idStr = String(repair.id)

    return (
      plate.includes(q) ||
      customer.includes(q) ||
      phone.includes(q) ||
      model.includes(q) ||
      idStr.includes(q)
    )
  })

  const handleDeliver = (id) => {
    navigate(`/delivery/${id}`)
  }

  return (
    <div className="page delivery-board-page">
      <div className="delivery-container">
        {/* Header Bar */}
        <div className="page-header-row">
          <div>
            <div className="sub-badge">DISPATCH & SETTLEMENT</div>
            <h1 className="page-main-title">Delivery Vehicles Bay</h1>
            <p className="page-sub-title">
              Vehicles ready for delivery handover, invoice settlement, and payment collection
            </p>
          </div>

          <div className="pending-counter-badge">
            <span className="counter-icon">🚚</span>
            <div>
              <span className="counter-label">READY FOR DELIVERY</span>
              <strong className="counter-val">{filteredRepairs.length} Vehicles</strong>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="delivery-toolbar">
          <div className="search-box-elevated">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by bike plate, mobile number, customer name, model, or Job ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="clear-btn" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="loading-card">
            <div className="loading-spinner"></div>
            <p>Loading vehicle staging queue...</p>
          </div>
        ) : filteredRepairs.length === 0 ? (
          <div className="empty-delivery-state">
            <div className="empty-icon">🎉</div>
            <h2>{search ? 'No Matching Vehicles Found' : 'All Deliveries Cleared'}</h2>
            <p>
              {search
                ? `No pending vehicles match "${search}". Try searching another plate or customer name.`
                : 'There are no in-progress repairs waiting for customer delivery.'}
            </p>
            {search ? (
              <button className="btn-secondary-flat" onClick={() => setSearch('')}>
                Clear Search
              </button>
            ) : (
              <button
                className="btn-primary-elevated"
                onClick={() => navigate('/new-repair')}
              >
                + Create New Job Card
              </button>
            )}
          </div>
        ) : (
          <div className="delivery-grid-view">
            {filteredRepairs.map((repair) => {
              const estimate = Number(repair.totalEstimatedAmount) || 0
              const advance = Number(repair.advanceAmount) || 0
              const balanceDue = Math.max(estimate - advance, 0)

              return (
                <div className="delivery-ticket-card" key={repair.id}>
                  <div className="ticket-header">
                    <div className="vehicle-plate-badge">
                      <span className="plate-country">IND</span>
                      <span className="plate-number">{repair.bikeNumber || 'NO PLATE'}</span>
                    </div>
                    <span className="job-badge">Job Card #{repair.id}</span>
                  </div>

                  <div className="ticket-body">
                    <h3 className="ticket-model">{repair.bikeModel || 'Vehicle'}</h3>
                    <div className="ticket-customer">
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

                    {repair.workRequired && repair.workRequired.length > 0 && (
                      <div className="ticket-work-tags">
                        {repair.workRequired.slice(0, 3).map((w, i) => (
                          <span className="work-tag-mini" key={i}>{w}</span>
                        ))}
                        {repair.workRequired.length > 3 && (
                          <span className="work-tag-mini more">+{repair.workRequired.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="ticket-ledger">
                    <div className="ledger-item">
                      <span>Total Quote</span>
                      <strong>₹{estimate}</strong>
                    </div>
                    <div className="ledger-item">
                      <span>Advance</span>
                      <strong className="text-emerald">₹{advance}</strong>
                    </div>
                    <div className="ledger-item highlight">
                      <span>Est. Balance</span>
                      <strong className="text-primary">₹{balanceDue}</strong>
                    </div>
                  </div>

                  <div className="ticket-actions">
                    <button
                      className="btn-deliver-vehicle"
                      onClick={() => handleDeliver(repair.id)}
                    >
                      <span>Proceed to Delivery & Settlement</span>
                      <span className="arrow-icon">&rarr;</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryVehicle