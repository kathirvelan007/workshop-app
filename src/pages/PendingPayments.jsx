import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function PendingPayments() {
  const navigate = useNavigate()

  const [repairs, setRepairs] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Collection Modal State
  const [selectedRepair, setSelectedRepair] = useState(null)
  const [payingAmount, setPayingAmount] = useState('')
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [paymentDate, setPaymentDate] = useState(getToday())
  const [paymentNotes, setPaymentNotes] = useState('')
  const [successInfo, setSuccessInfo] = useState(null)

  const loadPendingDues = async () => {
    try {
      setLoading(true)
      const all = await db.repairs.toArray()
      const withPending = all.filter((r) => Number(r.pendingAmount) > 0)
      setRepairs(withPending.reverse())
    } catch (err) {
      console.error('Error loading pending dues:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPendingDues()
  }, [])

  const filteredRepairs = repairs.filter((r) => {
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      (r.bikeNumber && r.bikeNumber.toLowerCase().includes(q)) ||
      (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(q)) ||
      (r.customerName && r.customerName.toLowerCase().includes(q)) ||
      (r.mobileNumber && r.mobileNumber.toLowerCase().includes(q)) ||
      (r.phone && r.phone.toLowerCase().includes(q)) ||
      (r.bikeModel && r.bikeModel.toLowerCase().includes(q)) ||
      (r.id && String(r.id).includes(q))
    )
  })

  const totalOutstanding = repairs.reduce(
    (acc, r) => acc + (Number(r.pendingAmount) || 0),
    0
  )

  const openCollectionModal = (repair) => {
    setSelectedRepair(repair)
    setPayingAmount(String(repair.pendingAmount))
    setPaymentMode('Cash')
    setPaymentDate(getToday())
    setPaymentNotes('')
    setSuccessInfo(null)
  }

  const closeCollectionModal = () => {
    setSelectedRepair(null)
    setSuccessInfo(null)
  }

  const handleCollectPayment = async (e) => {
    e.preventDefault()
    if (!selectedRepair) return

    const amount = Number(payingAmount)
    const currentPending = Number(selectedRepair.pendingAmount) || 0

    if (amount <= 0) {
      alert('Please enter a valid payment amount greater than ₹0')
      return
    }

    if (amount > currentPending) {
      alert(`Amount cannot exceed the current outstanding due of ₹${currentPending}`)
      return
    }

    if (!paymentMode) {
      alert('Please select a payment mode')
      return
    }

    const newPending = Math.max(currentPending - amount, 0)
    const nextPaymentId = (selectedRepair.paymentHistory?.length || 0) + 1
    const newPaymentEntry = {
      id: nextPaymentId,
      date: paymentDate || getToday(),
      amount: amount,
      mode: paymentMode,
      type: 'PENDING_SETTLEMENT',
      notes: paymentNotes || 'Pending dues collection',
    }

    const updatedHistory = [
      ...(selectedRepair.paymentHistory || []),
      newPaymentEntry,
    ]

    const updatedTotalPaid = (Number(selectedRepair.totalPaid) || ((Number(selectedRepair.advanceAmount) || 0) + (Number(selectedRepair.finalPaid) || 0))) + amount

    await db.repairs.update(selectedRepair.id, {
      pendingAmount: newPending,
      paymentHistory: updatedHistory,
      totalPaid: updatedTotalPaid,
      lastPaymentDate: paymentDate || getToday(),
    })

    setSuccessInfo({
      repairId: selectedRepair.id,
      collectedAmount: amount,
      remainingPending: newPending,
      customerName: selectedRepair.customerName,
      bikeNumber: selectedRepair.bikeNumber,
    })

    // Reload records in table
    loadPendingDues()
  }

  return (
    <div className="page pending-payments-page">
      <div className="dashboard-container">
        {/* Header Strip */}
        <div className="page-header-row">
          <div>
            <div className="sub-badge">FINANCIAL RECEIVABLES</div>
            <h1 className="page-main-title">Pending Payment Dues</h1>
            <p className="page-sub-title">
              Track and collect outstanding payment balances from delivered vehicles
            </p>
          </div>

          <button className="btn-secondary-flat" onClick={() => navigate('/')}>
            &larr; Back to Dashboard
          </button>
        </div>

        {/* Top KPI Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-due">
            <div className="stat-icon-wrapper">
              <span>💳</span>
            </div>
            <div className="stat-data">
              <span className="stat-title">Total Outstanding Dues</span>
              <div className="stat-number-row">
                <span className="stat-number">₹{totalOutstanding}</span>
                <span className="stat-badge danger">Receivables</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-pending">
            <div className="stat-icon-wrapper">
              <span>👥</span>
            </div>
            <div className="stat-data">
              <span className="stat-title">Customers With Dues</span>
              <div className="stat-number-row">
                <span className="stat-number">{repairs.length}</span>
                <span className="stat-badge warning">Unsettled</span>
              </div>
            </div>
          </div>

          <div className="stat-card stat-delivered">
            <div className="stat-icon-wrapper">
              <span>⚡</span>
            </div>
            <div className="stat-data">
              <span className="stat-title">Quick Action</span>
              <div className="stat-number-row">
                <span className="stat-badge success">Ready to Collect</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Toolbar */}
        <div className="records-toolbar">
          <div className="search-box-elevated">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by bike plate, customer name, mobile, or Job ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && <button className="clear-btn" onClick={() => setSearch('')}>✕</button>}
          </div>
        </div>

        {/* Pending Table / Cards */}
        {loading ? (
          <div className="loading-card">
            <div className="loading-spinner"></div>
            <p>Loading pending dues list...</p>
          </div>
        ) : filteredRepairs.length === 0 ? (
          <div className="empty-state-card">
            <div className="empty-icon">🎉</div>
            <h3>{search ? 'No Matching Records' : 'All Dues Collected!'}</h3>
            <p>
              {search
                ? `No pending bills matched "${search}". Try searching another name, plate, or mobile number.`
                : 'There are currently no customers with outstanding pending amounts! Excellent job!'}
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
                  <th>Model</th>
                  <th>Total Bill</th>
                  <th>Advance Paid</th>
                  <th>Delivered Paid</th>
                  <th>Pending Balance</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRepairs.map((r) => {
                  const plate = r.bikeNumber || r.vehicleNumber || 'NO PLATE'
                  const total = r.finalAmount || r.totalEstimatedAmount || 0
                  const advance = Number(r.advanceAmount) || 0
                  const paid = Number(r.finalPaid) || 0
                  const pending = Number(r.pendingAmount) || 0

                  return (
                    <tr key={r.id}>
                      <td>
                        <strong>#{r.id}</strong>
                      </td>
                      <td>
                        <div className="vehicle-plate-badge mini">
                          <span className="plate-country">IND</span>
                          <span className="plate-number">{plate}</span>
                        </div>
                      </td>
                      <td>
                        <div className="cell-customer">
                          <strong>{r.customerName}</strong>
                          {r.mobileNumber && (
                            <a
                              href={`tel:${r.mobileNumber}`}
                              className="text-primary small"
                              title="Call Customer"
                            >
                              📞 {r.mobileNumber}
                            </a>
                          )}
                        </div>
                      </td>
                      <td>{r.bikeModel || '-'}</td>
                      <td>₹{total}</td>
                      <td className="text-emerald">₹{advance}</td>
                      <td className="text-primary">₹{paid}</td>
                      <td>
                        <span className="badge-due">₹{pending}</span>
                      </td>
                      <td className="text-right">
                        <button
                          className="btn-primary-elevated"
                          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                          onClick={() => openCollectionModal(r)}
                        >
                          Collect Payment
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

        {/* MODAL: Collect Payment */}
        {selectedRepair && (
          <div className="popup-backdrop">
            <div className="delivery-success-modal" style={{ maxWidth: '520px', textAlign: 'left' }}>
              <button className="modal-close-x" onClick={closeCollectionModal}>✕</button>

              {!successInfo ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ fontSize: '1.8rem' }}>💰</div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Record Payment</h2>
                      <span className="text-muted small">Job Card #{selectedRepair.id}</span>
                    </div>
                  </div>

                  <div className="modal-ledger-box" style={{ marginBottom: '18px' }}>
                    <div className="ledger-cell">
                      <span>Customer:</span>
                      <strong>{selectedRepair.customerName}</strong>
                    </div>
                    <div className="ledger-cell">
                      <span>Vehicle:</span>
                      <strong>{selectedRepair.bikeNumber}</strong>
                    </div>
                    <div className="ledger-cell">
                      <span>Pending Due:</span>
                      <strong className="text-danger">₹{selectedRepair.pendingAmount}</strong>
                    </div>
                  </div>

                  <form onSubmit={handleCollectPayment}>
                    <div className="field-block" style={{ marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label>Amount Paying Now (₹) <span className="req-star">*</span></label>
                        <button
                          type="button"
                          className="btn-back-link"
                          style={{ fontSize: '0.78rem' }}
                          onClick={() => setPayingAmount(String(selectedRepair.pendingAmount))}
                        >
                          Full Balance (₹{selectedRepair.pendingAmount})
                        </button>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={selectedRepair.pendingAmount}
                        value={payingAmount}
                        onChange={(e) => setPayingAmount(e.target.value)}
                        required
                        autoFocus
                        style={{ fontSize: '1.15rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}
                      />
                    </div>

                    <div className="field-block" style={{ marginBottom: '14px' }}>
                      <label>Payment Method <span className="req-star">*</span></label>
                      <div className="payment-method-selector">
                        {['Cash', 'UPI/GPay', 'Card'].map((mode) => (
                          <button
                            type="button"
                            key={mode}
                            className={`payment-mode-btn ${paymentMode === mode ? 'selected' : ''}`}
                            onClick={() => setPaymentMode(mode)}
                          >
                            <span>{mode === 'Cash' ? '💵' : mode.includes('UPI') ? '📱' : '💳'}</span>
                            <span>{mode}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="form-field-row" style={{ marginBottom: '14px' }}>
                      <div className="field-block">
                        <label>Payment Date</label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          required
                        />
                      </div>
                      <div className="field-block">
                        <label>Payment Notes / Staff</label>
                        <input
                          type="text"
                          placeholder="e.g. Collected by Prem"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                        />
                      </div>
                    </div>

                    {payingAmount && (
                      <div style={{ padding: '10px 14px', background: 'var(--bg-card-muted)', borderRadius: '8px', marginBottom: '18px', fontSize: '0.85rem' }}>
                        Remaining Due After Payment:{' '}
                        <strong className="text-primary">
                          ₹{Math.max(Number(selectedRepair.pendingAmount) - Number(payingAmount), 0)}
                        </strong>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn-secondary-flat"
                        style={{ flex: 1 }}
                        onClick={closeCollectionModal}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-primary-elevated"
                        style={{ flex: 1.5, justifyContent: 'center' }}
                      >
                        Save Payment
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div className="modal-icon-badge">✅</div>
                  <h2 className="modal-title">Payment Saved Successfully!</h2>
                  <p className="modal-desc">
                    Collected <strong>₹{successInfo.collectedAmount}</strong> for Job #{successInfo.repairId} ({successInfo.bikeNumber}).
                  </p>

                  <div className="modal-ledger-box" style={{ justifyContent: 'center', textAlign: 'center' }}>
                    <div className="ledger-cell">
                      <span>Remaining Balance:</span>
                      <strong className={successInfo.remainingPending > 0 ? 'text-danger' : 'text-emerald'}>
                        {successInfo.remainingPending > 0 ? `₹${successInfo.remainingPending} Due` : 'Fully Settled!'}
                      </strong>
                    </div>
                  </div>

                  <div className="modal-actions-list" style={{ marginTop: '20px' }}>
                    <button
                      className="btn-modal-action primary"
                      onClick={() => navigate(`/receipt/${successInfo.repairId}`)}
                    >
                      View / Print Updated Receipt
                    </button>
                    <button
                      className="btn-modal-action neutral"
                      onClick={closeCollectionModal}
                    >
                      Done / Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PendingPayments
