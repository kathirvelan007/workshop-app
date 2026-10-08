import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function GetIssue() {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')
  const [repairs, setRepairs] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [expandedCardIds, setExpandedCardIds] = useState(new Set())

  // Repair comments modal state
  const [commentModalRepair, setCommentModalRepair] = useState(null)
  const [newCommentText, setNewCommentText] = useState('')
  const [savingComment, setSavingComment] = useState(false)

  const handleSearch = async (e) => {
    if (e) e.preventDefault()
    const query = searchValue.trim()

    if (!query) {
      alert('Please enter a vehicle plate number, customer name, or mobile number')
      return
    }

    try {
      setLoading(true)
      const all = await db.repairs.toArray()
      const queryLower = query.toLowerCase()

      const matched = all.filter((r) => {
        const plate = (r.bikeNumber || r.vehicleNumber || '').toLowerCase()
        const mobile = (r.mobileNumber || r.phone || '').toLowerCase()
        const customer = (r.customerName || '').toLowerCase()
        const model = (r.bikeModel || r.vehicleModel || '').toLowerCase()
        const idStr = String(r.id)

        return (
          plate.includes(queryLower) ||
          mobile.includes(queryLower) ||
          customer.includes(queryLower) ||
          model.includes(queryLower) ||
          idStr === queryLower
        )
      })

      const matchedReversed = matched.reverse()
      setRepairs(matchedReversed)
      // Keep details hidden initially after search; user clicks to reveal
      setExpandedCardIds(new Set())
      setSearched(true)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    setExpandedCardIds(new Set(repairs.map((r) => r.id)))
  }

  const collapseAll = () => {
    setExpandedCardIds(new Set())
  }

  const openCommentModal = (repair) => {
    setCommentModalRepair(repair)
    setNewCommentText('')
  }

  const closeCommentModal = () => {
    setCommentModalRepair(null)
    setNewCommentText('')
  }

  const handleSaveComment = async (e) => {
    e.preventDefault()
    if (!commentModalRepair || !newCommentText.trim()) return

    try {
      setSavingComment(true)
      const existing = Array.isArray(commentModalRepair.repairComments)
        ? commentModalRepair.repairComments
        : []

      const now = new Date()
      const timestampStr =
        now.toLocaleDateString('en-IN') +
        ' ' +
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

      const updatedComments = [
        ...existing,
        {
          id: existing.length + 1,
          date: timestampStr,
          text: newCommentText.trim(),
        },
      ]

      await db.repairs.update(commentModalRepair.id, {
        repairComments: updatedComments,
      })

      // Update state in place
      setRepairs((prev) =>
        prev.map((r) =>
          r.id === commentModalRepair.id
            ? { ...r, repairComments: updatedComments }
            : r
        )
      )

      alert('✅ Repair notes updated successfully!')
      closeCommentModal()
    } catch (err) {
      console.error('Error saving comment:', err)
      alert('Failed to save comment: ' + err.message)
    } finally {
      setSavingComment(false)
    }
  }

  // Aggregate stats for repeat customer / vehicle search
  const totalSpent = repairs.reduce(
    (acc, r) => acc + (Number(r.finalAmount || r.totalEstimatedAmount) || 0),
    0
  )
  const totalPending = repairs.reduce(
    (acc, r) => acc + (Number(r.pendingAmount) || 0),
    0
  )
  const primaryCustomerName = repairs[0]?.customerName || ''
  const primaryPhone = repairs[0]?.mobileNumber || repairs[0]?.phone || ''

  return (
    <div className="page lookup-page-container">
      <div className="lookup-wrapper">
        {/* Header */}
        <div className="lookup-header-strip">
          <button className="btn-back-link" onClick={() => navigate('/')}>
            &larr; Back to Dashboard
          </button>
          <div className="sub-badge">CUSTOMER & VEHICLE LOOKUP</div>
          <h1>Customer History & Vehicle Search</h1>
          <p>Find service history, view full initial job card details, and log ongoing repair progress notes</p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="lookup-search-card">
          <div className="search-plate-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by Bike Number (TN 01 AB 1234), Mobile, or Customer Name..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn-lookup-search">
              Search Records
            </button>
          </div>
        </form>

        {/* Loading Indicator */}
        {loading && (
          <div className="loading-card">
            <div className="loading-spinner"></div>
            <p>Searching workshop records...</p>
          </div>
        )}

        {/* Empty State */}
        {searched && !loading && repairs.length === 0 && (
          <div className="empty-lookup-card">
            <div className="empty-icon">🔎</div>
            <h3>No Records Found</h3>
            <p>No customer or vehicle repair records matched "{searchValue}".</p>
            <button
              className="btn-primary-elevated"
              onClick={() => navigate('/new-repair')}
            >
              + Create New Job Card
            </button>
          </div>
        )}

        {/* Results */}
        {repairs.length > 0 && (
          <div className="lookup-results-list">
            {/* Customer Summary Banner */}
            <div className="customer-profile-banner">
              <div>
                <span className="profile-label">Customer Profile</span>
                <h3 className="profile-name">
                  👤 {primaryCustomerName} {primaryPhone && <span className="profile-phone">({primaryPhone})</span>}
                </h3>
                <span className="profile-visits">
                  Total Visits Recorded: <strong>{repairs.length}</strong>
                </span>
              </div>

              <div className="profile-metrics-group">
                <div className="profile-metric-box">
                  <span className="metric-label">Lifetime Spent</span>
                  <strong className="metric-val spent">₹{totalSpent}</strong>
                </div>

                {totalPending > 0 && (
                  <div className="profile-metric-box">
                    <span className="metric-label">Outstanding Due</span>
                    <strong className="metric-val due">₹{totalPending}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Results Toolbar with Expand/Collapse buttons */}
            <div className="lookup-toolbar-row">
              <span className="results-count-text">
                Found <strong>{repairs.length}</strong> service visit{repairs.length > 1 ? 's' : ''}:
              </span>
              <div className="lookup-toggle-btns">
                <button
                  type="button"
                  className="btn-small-toggle"
                  onClick={expandAll}
                >
                  Show All Details
                </button>
                <button
                  type="button"
                  className="btn-small-toggle"
                  onClick={collapseAll}
                >
                  Hide All Details
                </button>
              </div>
            </div>

            {repairs.map((repair) => {
              const isDelivered = repair.status === 'DELIVERED'
              const plate = repair.bikeNumber || repair.vehicleNumber || 'NO PLATE'
              const totalBill = Number(repair.finalAmount || repair.totalEstimatedAmount) || 0
              const advance = Number(repair.advanceAmount) || 0
              const postDeliveryPending = Number(repair.pendingAmount) || 0
              // For delivered vehicles, show post-delivery pending dues.
              // For in-progress vehicles, show remaining balance to be collected at delivery (total - advance).
              const pending = isDelivered ? postDeliveryPending : Math.max(totalBill - advance, 0)
              const isExpanded = expandedCardIds.has(repair.id)

              return (
                <div className="lookup-record-card" key={repair.id}>
                  {/* Top Bar */}
                  <div className="record-top-row">
                    <div className="record-vehicle-id">
                      <div className="vehicle-plate-badge">
                        <span className="plate-country">IND</span>
                        <span className="plate-number">{plate}</span>
                      </div>
                      <span className="record-job-id">Job Card #{repair.id}</span>
                    </div>

                    <div className="record-top-right">
                      <div className={`status-badge-chip ${isDelivered ? 'delivered' : 'in-progress'}`}>
                        <span className="dot"></span>
                        <span>{repair.status}</span>
                      </div>

                      <button
                        type="button"
                        className="btn-card-expand"
                        onClick={() => toggleExpand(repair.id)}
                        aria-label="Toggle details"
                      >
                        {isExpanded ? '▲ Hide Details' : '▼ Show Full Details'}
                      </button>
                    </div>
                  </div>

                  {/* Primary Info Grid (Always Visible) */}
                  <div className="record-info-grid">
                    <div className="info-cell">
                      <span className="cell-label">Customer Name</span>
                      <strong className="cell-val">👤 {repair.customerName}</strong>
                    </div>

                    <div className="info-cell">
                      <span className="cell-label">Mobile Number</span>
                      <strong className="cell-val">📱 {repair.mobileNumber || repair.phone || '-'}</strong>
                    </div>

                    <div className="info-cell">
                      <span className="cell-label">Vehicle Model</span>
                      <strong className="cell-val">🏍️ {repair.bikeModel || repair.vehicleModel || '-'}</strong>
                    </div>

                    <div className="info-cell">
                      <span className="cell-label">Service Date</span>
                      <strong className="cell-val">
                        📅 {repair.createdDate ? new Date(repair.createdDate).toLocaleDateString('en-IN') : '-'}
                      </strong>
                    </div>

                    <div className="info-cell">
                      <span className="cell-label">Odometer Reading</span>
                      <strong className="cell-val">⏱️ {repair.odoMeter ? `${repair.odoMeter} KM` : '-'}</strong>
                    </div>

                    <div className="info-cell">
                      <span className="cell-label">Fuel Level</span>
                      <strong className="cell-val">⛽ {repair.fuelLevel || '-'}</strong>
                    </div>
                  </div>

                  {/* Work Required Summary */}
                  {repair.workRequired && repair.workRequired.length > 0 && (
                    <div className="record-work-summary">
                      <span className="work-label">Work Requisition:</span>
                      <div className="work-chips-wrapper">
                        {repair.workRequired.map((w, i) => (
                          <span className="work-chip" key={i}>{w}</span>
                        ))}
                      </div>
                      {repair.otherWork && (
                        <span className="work-chip other-note">Note: {repair.otherWork}</span>
                      )}
                    </div>
                  )}

                  {/* Customer Complaints */}
                  {repair.complaints && (
                    <div className="record-complaints-box">
                      <span className="complaints-label">Customer Complaints:</span>
                      <div className="complaints-pills-list">
                        {repair.complaints.split(' || ').map((c, i) => (
                          <span className="complaint-pill-item" key={i}>• {c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ongoing Repair / Technician Notes Log */}
                  <div className="record-comments-box">
                    <div className="comments-box-header">
                      <span className="comments-label">
                        🔧 Ongoing Repair Notes ({repair.repairComments?.length || 0})
                      </span>
                      <button
                        type="button"
                        className="btn-add-note-action"
                        onClick={() => openCommentModal(repair)}
                        title="Add notes while vehicle is undergoing repair"
                      >
                        <span className="btn-icon">✏️</span>
                        <span>+ Add Repair Note</span>
                      </button>
                    </div>

                    {Array.isArray(repair.repairComments) && repair.repairComments.length > 0 ? (
                      <div className="comments-timeline-list">
                        {repair.repairComments.map((c, i) => (
                          <div className="comment-timeline-item" key={i}>
                            <span className="comment-time-tag">📅 {c.date}:</span>
                            <span className="comment-body">{c.text}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-notes-hint">
                        No ongoing repair notes logged yet. Click "+ Add Repair Note" to add comments while working on this vehicle.
                      </div>
                    )}
                  </div>

                  {/* EXPANDED FULL INITIAL JOB CARD DETAILS */}
                  {isExpanded && (
                    <div className="record-expanded-details-container">
                      {/* SECTION A: Pre-Service Condition & Checklist */}
                      <div className="details-card-subblock">
                        <h4 className="subblock-heading">
                          <span>🔍</span> Pre-Service Inspection & Accessories Checklist
                        </h4>
                        <div className="inspection-check-pills-grid">
                          <div className="check-item-box">
                            <span className="check-item-name">Toolkit / First Aid</span>
                            <strong className={`check-item-status ${repair.toolkitFirstAid === 'Yes' ? 'ok' : 'subtle'}`}>
                              {repair.toolkitFirstAid || 'Not recorded'}
                            </strong>
                          </div>

                          <div className="check-item-box">
                            <span className="check-item-name">Helmet Left with Bike</span>
                            <strong className={`check-item-status ${repair.helmetLeft === 'Yes' ? 'ok' : 'subtle'}`}>
                              {repair.helmetLeft || 'Not recorded'}
                            </strong>
                          </div>

                          <div className="check-item-box">
                            <span className="check-item-name">Body Condition / Paint</span>
                            <strong className={`check-item-status ${repair.bodyCondition === 'Scratches' ? 'warn' : 'ok'}`}>
                              {repair.bodyCondition || 'Not recorded'}
                            </strong>
                          </div>

                          <div className="check-item-box">
                            <span className="check-item-name">Rear View Mirrors</span>
                            <strong className={`check-item-status ${repair.rearViewMirrors === 'Missing' ? 'warn' : 'ok'}`}>
                              {repair.rearViewMirrors || 'Not recorded'}
                            </strong>
                          </div>

                          <div className="check-item-box">
                            <span className="check-item-name">Indicator & Horn</span>
                            <strong className={`check-item-status ${repair.indicatorHorn === 'Faulty' ? 'danger' : 'ok'}`}>
                              {repair.indicatorHorn || 'Not recorded'}
                            </strong>
                          </div>

                          <div className="check-item-box">
                            <span className="check-item-name">Battery / Self-Start</span>
                            <strong className={`check-item-status ${repair.batteryCondition === 'Weak' ? 'danger' : 'ok'}`}>
                              {repair.batteryCondition || 'Not recorded'}
                            </strong>
                          </div>
                        </div>
                      </div>

                      {/* SECTION B: Cost Estimate Breakdown */}
                      <div className="details-card-subblock">
                        <h4 className="subblock-heading">
                          <span>📊</span> Cost Estimation Breakdown
                        </h4>
                        <div className="estimate-breakdown-subtable-wrapper">
                          <table className="estimate-subtable">
                            <thead>
                              <tr>
                                <th>Category</th>
                                <th className="text-right">Spares</th>
                                <th className="text-right">Labour</th>
                                <th className="text-right">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td>General Service & Labour</td>
                                <td className="text-right">₹{repair.serviceSpares || 0}</td>
                                <td className="text-right">₹{repair.serviceLabour || 0}</td>
                                <td className="text-right font-bold">₹{repair.serviceTotal || 0}</td>
                              </tr>
                              <tr>
                                <td>Additional Spares & Overhaul</td>
                                <td className="text-right">₹{repair.additionalSpares || 0}</td>
                                <td className="text-right">₹{repair.additionalLabour || 0}</td>
                                <td className="text-right font-bold">₹{repair.additionalTotal || 0}</td>
                              </tr>
                              {Array.isArray(repair.customCharges) && repair.customCharges.map((c, i) => (
                                <tr key={i}>
                                  <td><strong>Custom:</strong> {c.description || 'Special Charge'}</td>
                                  <td className="text-right">₹{c.spares || 0}</td>
                                  <td className="text-right">₹{c.labour || 0}</td>
                                  <td className="text-right font-bold">
                                    ₹{(Number(c.spares) || 0) + (Number(c.labour) || 0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td colSpan="3">Total Bill Amount:</td>
                                <td className="text-right font-bold total-highlight">
                                  ₹{repair.finalAmount || repair.totalEstimatedAmount || 0}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>

                      {/* SECTION C: Advance Deposit */}
                      <div className="details-card-subblock">
                        <h4 className="subblock-heading">
                          <span>💵</span> Initial Advance Payment
                        </h4>
                        <div className="advance-details-grid">
                          <div className="advance-cell">
                            <span>Advance Paid:</span>
                            <strong>{repair.advanceAmount ? `₹${repair.advanceAmount}` : 'None'}</strong>
                          </div>
                          <div className="advance-cell">
                            <span>Payment Mode:</span>
                            <strong>{repair.advancePaymentMode || '-'}</strong>
                          </div>
                          <div className="advance-cell">
                            <span>Advance Date:</span>
                            <strong>{repair.advanceDate || '-'}</strong>
                          </div>
                          <div className="advance-cell">
                            <span>Notes:</span>
                            <span className="text-muted">{repair.advanceNotes || 'None'}</span>
                          </div>
                        </div>
                      </div>

                      {/* SECTION D: Delivery & Settlement Info (if delivered) */}
                      {isDelivered && (
                        <div className="details-card-subblock">
                          <h4 className="subblock-heading">
                            <span>🚚</span> Delivery & Settlement Handover
                          </h4>
                          <div className="delivery-details-grid">
                            <div className="delivery-cell">
                              <span>Delivery Date:</span>
                              <strong>{repair.deliveryDate || '-'}</strong>
                            </div>
                            <div className="delivery-cell">
                              <span>Delivered By (Staff):</span>
                              <strong>{repair.deliveredBy || '-'}</strong>
                            </div>
                            <div className="delivery-cell">
                              <span>Paid at Delivery:</span>
                              <strong className="text-primary">
                                ₹{repair.finalPaid || 0} ({repair.paymentMode || 'Cash'})
                              </strong>
                            </div>
                            {Number(repair.discountAmount) > 0 && (
                              <div className="delivery-cell">
                                <span>Discount Allowed:</span>
                                <strong className="text-emerald">₹{repair.discountAmount}</strong>
                              </div>
                            )}
                            <div className="delivery-cell">
                              <span>Outstanding Balance:</span>
                              <strong className={pending > 0 ? 'text-danger' : 'text-emerald'}>
                                {pending > 0 ? `₹${pending}` : 'Fully Settled'}
                              </strong>
                            </div>
                            <div className="delivery-cell full-width">
                              <span>Handover Notes:</span>
                              <span className="text-muted">{repair.deliveryNotes || 'None'}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SECTION E: Payment Installment History */}
                      {Array.isArray(repair.paymentHistory) && repair.paymentHistory.length > 0 && (
                        <div className="details-card-subblock">
                          <h4 className="subblock-heading">
                            <span>📜</span> Complete Payment History Ledger
                          </h4>
                          <div className="payment-history-timeline-box">
                            {repair.paymentHistory.map((entry, idx) => (
                              <div className="timeline-payment-row" key={idx}>
                                <div className="payment-type-badge-col">
                                  <span className={`payment-pill-tag ${entry.type || 'DELIVERY'}`}>
                                    {entry.type === 'ADVANCE'
                                      ? 'Advance Deposit'
                                      : entry.type === 'PENDING_SETTLEMENT'
                                      ? 'Post-Delivery Settlement'
                                      : 'Delivery Payment'}
                                  </span>
                                </div>
                                <div className="payment-meta-col">
                                  <span className="pay-date">📅 {entry.date}</span>
                                  <span className="pay-mode">({entry.mode || 'Cash'})</span>
                                  {entry.notes && <span className="pay-notes">• {entry.notes}</span>}
                                </div>
                                <div className="payment-amount-col">
                                  <strong>₹{entry.amount}</strong>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Financial Footer (Always Visible) */}
                  <div className="record-financial-footer">
                    <div className="financial-sub-ledger">
                      <div className="ledger-cell">
                        <span>Total Bill</span>
                        <strong>₹{repair.finalAmount || repair.totalEstimatedAmount || 0}</strong>
                      </div>
                      <div className="ledger-cell">
                        <span>Advance Paid</span>
                        <strong className="text-emerald">₹{repair.advanceAmount || 0}</strong>
                      </div>
                      <div className="ledger-cell">
                        <span>Delivery Paid</span>
                        <strong className="text-primary">₹{repair.finalPaid || 0}</strong>
                      </div>
                      <div className="ledger-cell">
                        <span>{isDelivered ? 'Pending Due' : 'Balance to Pay'}</span>
                        <strong className={pending > 0 ? (isDelivered ? 'text-danger' : 'text-amber') : 'text-emerald'}>
                          {pending > 0 ? `₹${pending}` : 'Fully Settled'}
                        </strong>
                      </div>
                    </div>

                    <div className="record-action-btns">
                      {isDelivered ? (
                        <>
                          <button
                            className="btn-secondary-flat"
                            onClick={() => navigate(`/receipt/${repair.id}`)}
                          >
                            📄 View Receipt
                          </button>
                          {pending > 0 && (
                            <button
                              className="btn-primary-elevated"
                              onClick={() => navigate('/pending-payments')}
                            >
                              💳 Settle Pending Due
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          className="btn-primary-elevated"
                          onClick={() => navigate(`/delivery/${repair.id}`)}
                        >
                          Deliver & Settle &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* MODAL: Add/Update Repair Notes */}
        {commentModalRepair && (
          <div className="popup-backdrop">
            <div className="delivery-success-modal" style={{ maxWidth: '520px', textAlign: 'left' }}>
              <button className="modal-close-x" onClick={closeCommentModal}>✕</button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ fontSize: '1.8rem' }}>🔧</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Add Repair Progress Note</h2>
                  <span className="text-muted small">
                    Job Card #{commentModalRepair.id} • {commentModalRepair.bikeNumber} ({commentModalRepair.customerName})
                  </span>
                </div>
              </div>

              {Array.isArray(commentModalRepair.repairComments) && commentModalRepair.repairComments.length > 0 && (
                <div style={{ marginBottom: '16px', background: 'var(--bg-surface)', padding: '12px', borderRadius: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Previous Notes Logged:
                  </span>
                  {commentModalRepair.repairComments.map((c, i) => (
                    <div key={i} style={{ fontSize: '0.84rem', padding: '4px 0', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--primary-700)', fontWeight: 600 }}>{c.date}: </span>
                      <span>{c.text}</span>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSaveComment}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: 700, marginBottom: '6px' }}>
                    New Repair Note / Mechanic Update <span className="req-star">*</span>
                  </label>
                  <textarea
                    rows="4"
                    placeholder="e.g. Engine noise diagnosed - piston pin loose. Replaced oil filter. Informed customer."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    required
                    autoFocus
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-medium)', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn-secondary-flat"
                    onClick={closeCommentModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-elevated"
                    disabled={savingComment || !newCommentText.trim()}
                  >
                    {savingComment ? 'Saving...' : '💾 Save Note to Job Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GetIssue