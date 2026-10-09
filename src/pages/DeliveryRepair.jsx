import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/database'

function getToday() {
  return new Date().toISOString().split('T')[0]
}

function DeliveryRepair() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [repair, setRepair] = useState(null)
  const [showDeliveryPopup, setShowDeliveryPopup] = useState(() => Boolean(location.state?.openDeliveryPopup))
  const [activeTab, setActiveTab] = useState('billing') // 'billing' or 'details'

  // Editable Workshop Cost breakdown (Spares & Labour)
  const [costs, setCosts] = useState({
    serviceSpares: '',
    serviceLabour: '',
    additionalSpares: '',
    additionalLabour: '',
  })

  // Dynamic custom parts / charges added during service or delivery
  const [customCharges, setCustomCharges] = useState([])

  // Modal for logging a new repair note directly at delivery check
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  const [formData, setFormData] = useState({
    deliveryDate: getToday(),
    deliveredBy: '',
    finalPaid: '',
    paymentMode: '',
    discountAmount: '',
    deliveryNotes: '',
  })

  const loadRepair = async () => {
    const repairData = await db.repairs.get(Number(id))
    if (!repairData) {
      alert('Repair job not found')
      navigate('/')
      return
    }

    setRepair(repairData)

    setFormData({
      deliveryDate: repairData.deliveryDate || getToday(),
      deliveredBy: repairData.deliveredBy || '',
      finalPaid: repairData.finalPaid !== undefined && repairData.finalPaid !== null ? repairData.finalPaid : '',
      paymentMode: repairData.paymentMode || '',
      discountAmount: repairData.discountAmount !== undefined && repairData.discountAmount !== null ? repairData.discountAmount : '',
      deliveryNotes: repairData.deliveryNotes || '',
    })

    setCosts({
      serviceSpares: repairData.serviceSpares !== undefined && repairData.serviceSpares !== null ? repairData.serviceSpares : '',
      serviceLabour: repairData.serviceLabour !== undefined && repairData.serviceLabour !== null ? repairData.serviceLabour : '',
      additionalSpares: repairData.additionalSpares !== undefined && repairData.additionalSpares !== null ? repairData.additionalSpares : '',
      additionalLabour: repairData.additionalLabour !== undefined && repairData.additionalLabour !== null ? repairData.additionalLabour : '',
    })

    if (Array.isArray(repairData.customCharges)) {
      setCustomCharges(
        repairData.customCharges.map((c, idx) => ({
          id: c.id || idx + 1,
          description: c.description || '',
          spares: c.spares !== undefined && c.spares !== null ? c.spares : '',
          labour: c.labour !== undefined && c.labour !== null ? c.labour : '',
        }))
      )
    } else {
      setCustomCharges([])
    }
  }

  useEffect(() => {
    loadRepair()
  }, [id])

  const handleCostChange = (field, value) => {
    setCosts((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddCustomCharge = () => {
    setCustomCharges((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        description: '',
        spares: '',
        labour: '',
      },
    ])
  }

  const handleCustomChargeChange = (chargeId, field, value) => {
    setCustomCharges((prev) =>
      prev.map((item) => (item.id === chargeId ? { ...item, [field]: value } : item))
    )
  }

  const handleRemoveCustomCharge = (chargeId) => {
    setCustomCharges((prev) => prev.filter((item) => item.id !== chargeId))
  }

  // Cost calculations
  const calculateServiceTotal = () =>
    (Number(costs.serviceSpares) || 0) + (Number(costs.serviceLabour) || 0)

  const calculateAdditionalTotal = () =>
    (Number(costs.additionalSpares) || 0) + (Number(costs.additionalLabour) || 0)

  const calculateCustomTotal = () =>
    customCharges.reduce(
      (sum, c) => sum + (Number(c.spares) || 0) + (Number(c.labour) || 0),
      0
    )

  const calculateTotalAmount = () =>
    calculateServiceTotal() + calculateAdditionalTotal() + calculateCustomTotal()

  const calculateAdvanceAmount = () => Number(repair?.advanceAmount) || 0

  const calculateRemainingBeforeDiscount = () =>
    Math.max(calculateTotalAmount() - calculateAdvanceAmount(), 0)

  const calculateDiscountAmount = () => Number(formData.discountAmount) || 0

  const calculateAmountDue = () =>
    Math.max(calculateRemainingBeforeDiscount() - calculateDiscountAmount(), 0)

  const calculateFinalPaid = () => Number(formData.finalPaid) || 0

  const calculatePendingAmount = () =>
    Math.max(calculateAmountDue() - calculateFinalPaid(), 0)

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDiscountChange = (event) => {
    const value = event.target.value
    setFormData((prev) => ({
      ...prev,
      discountAmount: value,
    }))
  }

  const handleFinalPaidChange = (event) => {
    const value = event.target.value
    setFormData((prev) => ({
      ...prev,
      finalPaid: value,
    }))
  }

  // Quick fill button: Set Final Paid to full Amount Due
  const handlePayFullDue = () => {
    const due = calculateAmountDue()
    setFormData((prev) => ({
      ...prev,
      finalPaid: due.toString(),
    }))
  }

  // Save technician repair comment
  const handleSaveRepairNote = async (e) => {
    e.preventDefault()
    if (!newNoteText.trim()) return

    setSavingNote(true)
    try {
      const existingNotes = Array.isArray(repair.repairComments) ? [...repair.repairComments] : []
      const now = new Date()
      const timestamp =
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }) +
        ' ' +
        now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

      const updatedNotes = [
        ...existingNotes,
        {
          id: existingNotes.length + 1,
          date: timestamp,
          text: newNoteText.trim(),
        },
      ]

      await db.repairs.update(Number(id), {
        repairComments: updatedNotes,
      })

      setRepair((prev) => ({
        ...prev,
        repairComments: updatedNotes,
      }))

      setNewNoteText('')
      setShowNoteModal(false)
    } catch (err) {
      console.error('Failed to save repair note:', err)
      alert('Failed to save repair note: ' + err.message)
    } finally {
      setSavingNote(false)
    }
  }

  const handleDelivery = async () => {
    if (!formData.deliveryDate) {
      alert('Delivery date is required.')
      return
    }

    if (!formData.deliveredBy.trim()) {
      alert('Please enter staff name in Delivered By.')
      return
    }

    const totalWorkshopBill = calculateTotalAmount()
    const advanceAmount = calculateAdvanceAmount()
    const remainingBeforeDiscount = calculateRemainingBeforeDiscount()
    const discountAmount = calculateDiscountAmount()

    if (discountAmount > remainingBeforeDiscount) {
      alert('Discount amount cannot be greater than the remaining net balance.')
      return
    }

    const amountDue = calculateAmountDue()
    const finalPaid = calculateFinalPaid()

    if (finalPaid > amountDue) {
      alert(`Final Paid amount cannot be greater than ₹${amountDue}.`)
      return
    }

    if (finalPaid > 0 && !formData.paymentMode) {
      alert('Please select the payment mode for the amount received today.')
      return
    }

    const pendingAmount = Math.max(amountDue - finalPaid, 0)
    const completedDate = new Date().toISOString()

    let existingHistory = Array.isArray(repair.paymentHistory) ? [...repair.paymentHistory] : []
    if (existingHistory.length === 0 && advanceAmount > 0) {
      existingHistory.push({
        id: 1,
        date: repair.advanceDate || repair.createdDate?.split('T')[0] || getToday(),
        amount: advanceAmount,
        mode: repair.advancePaymentMode || 'Cash',
        type: 'ADVANCE',
        notes: repair.advanceNotes || 'Advance payment',
      })
    }

    const nextPaymentId = existingHistory.length + 1
    const newDeliveryPayment =
      finalPaid > 0
        ? {
            id: nextPaymentId,
            date: formData.deliveryDate || getToday(),
            amount: finalPaid,
            mode: formData.paymentMode,
            type: 'DELIVERY',
            notes: formData.deliveryNotes || 'Payment received at vehicle delivery',
          }
        : null

    const updatedHistory = newDeliveryPayment ? [...existingHistory, newDeliveryPayment] : existingHistory
    const updatedTotalPaid = advanceAmount + finalPaid

    const serviceSparesNum = Number(costs.serviceSpares) || 0
    const serviceLabourNum = Number(costs.serviceLabour) || 0
    const serviceTotal = serviceSparesNum + serviceLabourNum

    const additionalSparesNum = Number(costs.additionalSpares) || 0
    const additionalLabourNum = Number(costs.additionalLabour) || 0
    const additionalTotal = additionalSparesNum + additionalLabourNum

    const cleanedCustomCharges = customCharges
      .filter((c) => (c.description || '').trim() || (Number(c.spares) || 0) > 0 || (Number(c.labour) || 0) > 0)
      .map((c, i) => ({
        id: c.id || i + 1,
        description: (c.description || '').trim() || `Custom Work #${i + 1}`,
        spares: Number(c.spares) || 0,
        labour: Number(c.labour) || 0,
        total: (Number(c.spares) || 0) + (Number(c.labour) || 0),
      }))

    const updatePayload = {
      deliveryDate: formData.deliveryDate,
      deliveredBy: formData.deliveredBy,
      serviceSpares: serviceSparesNum,
      serviceLabour: serviceLabourNum,
      serviceTotal,
      additionalSpares: additionalSparesNum,
      additionalLabour: additionalLabourNum,
      additionalTotal,
      customCharges: cleanedCustomCharges,
      totalEstimatedAmount: totalWorkshopBill,
      finalAmount: totalWorkshopBill,
      finalAmountAfterAdvance: remainingBeforeDiscount,
      finalPaid,
      paymentMode: formData.paymentMode,
      discountAmount,
      pendingAmount,
      deliveryNotes: formData.deliveryNotes,
      paymentHistory: updatedHistory,
      totalPaid: updatedTotalPaid,
      status: 'DELIVERED',
      completedDate,
    }

    await db.repairs.update(Number(id), updatePayload)

    setRepair((prev) => ({
      ...prev,
      ...updatePayload,
    }))

    setShowDeliveryPopup(true)
  }

  const closePopup = () => {
    setShowDeliveryPopup(false)
    navigate('/delivery-vehicles')
  }

  const viewReceipt = () => {
    setShowDeliveryPopup(false)
    navigate(`/receipt/${id}`, {
      state: { fromDelivery: true },
    })
  }

  const sharePdfViaWhatsApp = () => {
    setShowDeliveryPopup(false)
    navigate(`/receipt/${id}`, {
      state: { autoShareWhatsApp: true, fromDelivery: true },
    })
  }

  if (!repair) {
    return (
      <div className="page loading-center">
        <div className="loading-spinner"></div>
        <p>Loading vehicle job card...</p>
      </div>
    )
  }

  const serviceTotal = calculateServiceTotal()
  const additionalTotal = calculateAdditionalTotal()
  const customTotal = calculateCustomTotal()
  const totalAmount = calculateTotalAmount()
  const advanceAmount = calculateAdvanceAmount()
  const remainingBeforeDiscount = calculateRemainingBeforeDiscount()
  const discountAmount = calculateDiscountAmount()
  const amountDue = calculateAmountDue()
  const finalPaid = calculateFinalPaid()
  const pendingAmount = calculatePendingAmount()
  const isDelivered = repair.status === 'DELIVERED'

  return (
    <div className="page delivery-terminal-page">
      <div className="terminal-container">
        {/* Top Navigation */}
        <div className="terminal-nav-bar">
          <button className="btn-back-link" onClick={() => navigate('/delivery-vehicles')}>
            &larr; Back to Delivery Bay
          </button>
          <div className="status-indicator-pill">
            <span className={`status-pill-dot ${isDelivered ? 'green' : 'amber'}`}></span>
            <span className="status-pill-text">{repair.status}</span>
          </div>
        </div>

        {/* Hero Vehicle Overview Card */}
        <div className="vehicle-banner-card">
          <div className="banner-left">
            <div className="vehicle-plate-badge large">
              <span className="plate-country">IND</span>
              <span className="plate-number">{repair.bikeNumber || 'NO PLATE'}</span>
            </div>
            <div className="banner-titles">
              <h2>{repair.bikeModel || 'Vehicle'}</h2>
              <div className="customer-row">
                <span>👤 {repair.customerName}</span>
                {repair.mobileNumber && <span>📞 {repair.mobileNumber}</span>}
                <span>⏱️ {repair.odoMeter ? `${repair.odoMeter} KM` : 'Odo: N/A'}</span>
              </div>
            </div>
          </div>

          <div className="banner-right">
            <div className="job-id-box">
              <span className="job-label">JOB CARD</span>
              <strong className="job-val">#{repair.id}</strong>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="terminal-tabs-row">
          <button
            className={`tab-btn ${activeTab === 'billing' ? 'active' : ''}`}
            onClick={() => setActiveTab('billing')}
          >
            💰 Final Billing & Settlement
          </button>
          <button
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📋 Service & Inspection Summary
          </button>
        </div>

        {activeTab === 'details' && (
          <div className="job-details-overview-tab">
            {/* Work & Complaints */}
            <div className="details-card-block">
              <h3>Work Requisition</h3>
              <div className="work-tags-list">
                {repair.workRequired?.map((w, idx) => (
                  <span className="work-chip" key={idx}>{w}</span>
                )) || <p>No specific work marked</p>}
              </div>
              {repair.otherWork && (
                <p className="mt-2 text-muted"><strong>Other Work:</strong> {repair.otherWork}</p>
              )}
            </div>

            <div className="details-card-block">
              <h3>Customer Complaints</h3>
              <ul className="complaints-bullet-list">
                {repair.complaints?.split(' || ').map((c, idx) => (
                  <li key={idx}>{c}</li>
                )) || <li>No complaints noted</li>}
              </ul>
            </div>

            {/* Checklist */}
            <div className="details-card-block">
              <h3>Physical Inspection Records</h3>
              <div className="inspection-mini-grid">
                <div className="mini-item"><span>Toolkit:</span> <strong>{repair.toolkitFirstAid || '-'}</strong></div>
                <div className="mini-item"><span>Helmet:</span> <strong>{repair.helmetLeft || '-'}</strong></div>
                <div className="mini-item"><span>Body Condition:</span> <strong>{repair.bodyCondition || '-'}</strong></div>
                <div className="mini-item"><span>Mirrors:</span> <strong>{repair.rearViewMirrors || '-'}</strong></div>
                <div className="mini-item"><span>Horn / Indicators:</span> <strong>{repair.indicatorHorn || '-'}</strong></div>
                <div className="mini-item"><span>Battery:</span> <strong>{repair.batteryCondition || '-'}</strong></div>
              </div>
            </div>

            {/* Ongoing Repair Notes */}
            <div className="details-card-block">
              <div className="notes-block-header">
                <h3>Ongoing Repair Notes & Observations</h3>
                <span className="notes-count-badge">
                  {repair.repairComments?.length || 0} notes
                </span>
              </div>
              {Array.isArray(repair.repairComments) && repair.repairComments.length > 0 ? (
                <div className="delivery-notes-timeline">
                  {repair.repairComments.map((note, idx) => (
                    <div className="delivery-note-item" key={idx}>
                      <div className="note-time">📅 {note.date}</div>
                      <div className="note-content">{note.text}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-notes-text">No notes recorded during repair.</p>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="details-card-block">
              <h3>Quotation Breakdown</h3>
              <div className="cost-breakdown-list">
                <div className="cost-line">
                  <span>General Service (Spares: ₹{costs.serviceSpares || 0}, Labour: ₹{costs.serviceLabour || 0})</span>
                  <strong>₹{serviceTotal}</strong>
                </div>
                <div className="cost-line">
                  <span>Additional Work (Spares: ₹{costs.additionalSpares || 0}, Labour: ₹{costs.additionalLabour || 0})</span>
                  <strong>₹{additionalTotal}</strong>
                </div>
                {customCharges.map((c, idx) => (
                  <div className="cost-line" key={c.id || idx}>
                    <span>
                      Custom: {c.description || `Item #${idx + 1}`} (Spares: ₹{c.spares || 0}, Labour: ₹{c.labour || 0})
                    </span>
                    <strong>₹{(Number(c.spares) || 0) + (Number(c.labour) || 0)}</strong>
                  </div>
                ))}
                <div className="cost-line total">
                  <span>Total Workshop Bill</span>
                  <strong>₹{totalAmount}</strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="billing-view-wrapper">
            {/* 🛠️ TECHNICIAN REPAIR NOTES CALLOUT BANNER */}
            <div className="delivery-repair-notes-card">
              <div className="notes-banner-header">
                <div className="notes-banner-title">
                  <span className="wrench-icon">🔧</span>
                  <div>
                    <h4>Technician Repair Notes (Recorded During Service)</h4>
                    <p className="notes-subtitle">
                      Review faults, parts replaced, and updates reported while repairing this vehicle.
                    </p>
                  </div>
                </div>
                <div className="notes-header-actions">
                  <span className="notes-count-badge">
                    {repair.repairComments?.length || 0} {repair.repairComments?.length === 1 ? 'note' : 'notes'}
                  </span>
                  {!isDelivered && (
                    <button
                      type="button"
                      className="btn-add-quick-note"
                      onClick={() => setShowNoteModal(true)}
                    >
                      + Add Note
                    </button>
                  )}
                </div>
              </div>

              {Array.isArray(repair.repairComments) && repair.repairComments.length > 0 ? (
                <div className="delivery-notes-timeline">
                  {repair.repairComments.map((note, idx) => (
                    <div className="delivery-note-item" key={idx}>
                      <span className="note-time">📅 {note.date}</span>
                      <span className="note-content">{note.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-notes-banner-hint">
                  <span>ℹ️ No technician notes were logged during repair.</span>
                  {!isDelivered && (
                    <button
                      type="button"
                      className="btn-text-link"
                      onClick={() => setShowNoteModal(true)}
                    >
                      Log a note now &rarr;
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* MAIN BALANCED TWO-COLUMN TERMINAL GRID */}
            <div className="settlement-terminal-grid">
              {/* COLUMN 1: EDITABLE WORKSHOP COST BREAKDOWN & CUSTOM CHARGES */}
              <div className="delivery-costs-panel">
                <div className="panel-header-row">
                  <div>
                    <h3 className="panel-title mb-1">1. Workshop Cost Breakdown</h3>
                    <p className="panel-subtitle">
                      Adjust spares & labour amounts based on actual work done, or add new parts below.
                    </p>
                  </div>
                  <span className="editable-status-tag">
                    {isDelivered ? 'Locked (Delivered)' : '✏️ Editable at Delivery'}
                  </span>
                </div>

                {/* Section A: General Service */}
                <div className="cost-group-card">
                  <div className="cost-group-header">
                    <span className="group-name">🧰 General Service & Routine Labour</span>
                    <span className="group-subtotal">Subtotal: ₹{serviceTotal}</span>
                  </div>
                  <div className="cost-inputs-row">
                    <div className="cost-field">
                      <label>Spares (₹)</label>
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={costs.serviceSpares}
                        onChange={(e) => handleCostChange('serviceSpares', e.target.value)}
                        disabled={isDelivered}
                      />
                    </div>
                    <div className="cost-field">
                      <label>Labour (₹)</label>
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={costs.serviceLabour}
                        onChange={(e) => handleCostChange('serviceLabour', e.target.value)}
                        disabled={isDelivered}
                      />
                    </div>
                  </div>
                </div>

                {/* Section B: Additional Work */}
                <div className="cost-group-card">
                  <div className="cost-group-header">
                    <span className="group-name">⚙️ Additional Repairs, Parts & Overhaul</span>
                    <span className="group-subtotal">Subtotal: ₹{additionalTotal}</span>
                  </div>
                  <div className="cost-inputs-row">
                    <div className="cost-field">
                      <label>Spares (₹)</label>
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={costs.additionalSpares}
                        onChange={(e) => handleCostChange('additionalSpares', e.target.value)}
                        disabled={isDelivered}
                      />
                    </div>
                    <div className="cost-field">
                      <label>Labour (₹)</label>
                      <input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={costs.additionalLabour}
                        onChange={(e) => handleCostChange('additionalLabour', e.target.value)}
                        disabled={isDelivered}
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Custom Dynamic Parts & Charges */}
                <div className="cost-group-card custom-charges-card">
                  <div className="cost-group-header">
                    <div>
                      <span className="group-name">➕ Custom Parts & Specialized Charges</span>
                      <p className="group-subtext">Add specific part names, lathe works, welding, oils, etc.</p>
                    </div>
                    {!isDelivered && (
                      <button
                        type="button"
                        className="btn-add-custom-charge"
                        onClick={handleAddCustomCharge}
                      >
                        + Add Custom Charge
                      </button>
                    )}
                  </div>

                  {customCharges.length === 0 ? (
                    <div className="custom-charges-empty-hint">
                      <p>No customized parts or extra charges added yet.</p>
                      {!isDelivered && (
                        <button
                          type="button"
                          className="btn-add-item-subtle"
                          onClick={handleAddCustomCharge}
                        >
                          + Click here to add a custom part or work
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="custom-charges-container">
                      {/* Desktop Table-Style Header */}
                      <div className="custom-charges-table-header">
                        <span className="th-col th-desc">Description / Part Name</span>
                        <span className="th-col th-num">Spares (₹)</span>
                        <span className="th-col th-num">Labour (₹)</span>
                        <span className="th-col th-total">Total</span>
                        <span className="th-col th-action"></span>
                      </div>

                      <div className="custom-charges-list">
                        {customCharges.map((c, index) => {
                          const lineTotal = (Number(c.spares) || 0) + (Number(c.labour) || 0)
                          return (
                            <div className="custom-charge-row" key={c.id || index}>
                              <div className="row-cell cell-desc">
                                <label className="mobile-only-label">Description / Part Name</label>
                                <input
                                  type="text"
                                  placeholder="e.g. Motul 15W50, Brake Shoe..."
                                  value={c.description}
                                  onChange={(e) =>
                                    handleCustomChargeChange(c.id, 'description', e.target.value)
                                  }
                                  disabled={isDelivered}
                                />
                              </div>

                              <div className="row-cell cell-spares">
                                <label className="mobile-only-label">Spares (₹)</label>
                                <input
                                  type="number"
                                  placeholder="0"
                                  min="0"
                                  value={c.spares}
                                  onChange={(e) =>
                                    handleCustomChargeChange(c.id, 'spares', e.target.value)
                                  }
                                  disabled={isDelivered}
                                />
                              </div>

                              <div className="row-cell cell-labour">
                                <label className="mobile-only-label">Labour (₹)</label>
                                <input
                                  type="number"
                                  placeholder="0"
                                  min="0"
                                  value={c.labour}
                                  onChange={(e) =>
                                    handleCustomChargeChange(c.id, 'labour', e.target.value)
                                  }
                                  disabled={isDelivered}
                                />
                              </div>

                              <div className="row-cell cell-total">
                                <label className="mobile-only-label">Total</label>
                                <div className="custom-line-total-badge">₹{lineTotal}</div>
                              </div>

                              <div className="row-cell cell-action">
                                {!isDelivered && (
                                  <button
                                    type="button"
                                    className="btn-remove-custom-charge"
                                    onClick={() => handleRemoveCustomCharge(c.id)}
                                    title="Remove this charge"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="custom-charges-subtotal-bar">
                        <span>Custom Items Total:</span>
                        <strong>₹{customTotal}</strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* Real-time Bill Summary Banner */}
                <div className="realtime-bill-total-card">
                  <div className="bill-summary-breakdown">
                    <span>Service: ₹{serviceTotal}</span>
                    <span>•</span>
                    <span>Additional: ₹{additionalTotal}</span>
                    {customTotal > 0 && (
                      <>
                        <span>•</span>
                        <span>Custom: ₹{customTotal}</span>
                      </>
                    )}
                  </div>
                  <div className="bill-total-highlight-row">
                    <span className="total-label">Revised Total Workshop Bill:</span>
                    <strong className="total-number">₹{totalAmount}</strong>
                  </div>
                </div>
              </div>

              {/* COLUMN 2: UNIFIED BILLING SETTLEMENT & HANDOVER */}
              <div className="settlement-unified-panel">
                <div className="panel-header-row">
                  <div>
                    <h3 className="panel-title mb-1">2. Financial Settlement & Handover</h3>
                    <p className="panel-subtitle">
                      Review live ledger, apply discount, record payment, and complete vehicle handover.
                    </p>
                  </div>
                </div>

                {/* Financial Ledger Flow */}
                <div className="ledger-flow">
                  <div className="ledger-row">
                    <span className="ledger-label">Total Workshop Bill</span>
                    <span className="ledger-amount font-bold">₹{totalAmount}</span>
                  </div>

                  <div className="ledger-row deduction">
                    <span className="ledger-label">Less: Advance Already Paid</span>
                    <span className="ledger-amount">- ₹{advanceAmount}</span>
                  </div>

                  <div className="ledger-row subtotal">
                    <span className="ledger-label">Net Balance Before Discount</span>
                    <span className="ledger-amount">₹{remainingBeforeDiscount}</span>
                  </div>

                  <div className="ledger-row deduction">
                    <span className="ledger-label">Less: Special Workshop Discount</span>
                    <span className="ledger-amount">- ₹{discountAmount}</span>
                  </div>

                  <div className="ledger-row highlight-due">
                    <span className="ledger-label">Total Amount Due for Delivery</span>
                    <span className="ledger-amount">₹{amountDue}</span>
                  </div>
                </div>

                {/* Handover & Payment Inputs */}
                <div className="handover-inputs">
                  <div className="form-field-row">
                    <div className="field-block">
                      <div className="field-label-row">
                        <label>Handover Date <span className="req-star">*</span></label>
                      </div>
                      <input
                        type="date"
                        name="deliveryDate"
                        value={formData.deliveryDate}
                        onChange={handleChange}
                        disabled={isDelivered}
                      />
                    </div>

                    <div className="field-block">
                      <div className="field-label-row">
                        <label>Delivered By (Staff Name) <span className="req-star">*</span></label>
                      </div>
                      <input
                        type="text"
                        name="deliveredBy"
                        placeholder="e.g. Raja / Staff name"
                        value={formData.deliveredBy}
                        onChange={handleChange}
                        maxLength={50}
                        disabled={isDelivered}
                      />
                    </div>
                  </div>

                  <div className="form-field-row">
                    <div className="field-block">
                      <div className="field-label-row">
                        <label>
                          Special Discount (₹)
                          {remainingBeforeDiscount > 0 && (
                            <span className="hint-max"> (Max ₹{remainingBeforeDiscount})</span>
                          )}
                        </label>
                      </div>
                      <input
                        type="number"
                        name="discountAmount"
                        placeholder="0"
                        value={formData.discountAmount}
                        onChange={handleDiscountChange}
                        min="0"
                        max={remainingBeforeDiscount}
                        disabled={isDelivered}
                      />
                    </div>

                    <div className="field-block highlight-input">
                      <div className="field-label-row">
                        <label>Final Paid Now (₹)</label>
                        {!isDelivered && amountDue > 0 && (
                          <button
                            type="button"
                            className="btn-quick-fill-due"
                            onClick={handlePayFullDue}
                          >
                            Pay Full Due (₹{amountDue})
                          </button>
                        )}
                      </div>
                      <input
                        type="number"
                        name="finalPaid"
                        placeholder="Enter amount customer pays"
                        value={formData.finalPaid}
                        onChange={handleFinalPaidChange}
                        min="0"
                        max={amountDue}
                        disabled={isDelivered}
                      />
                    </div>
                  </div>

                  <div className="field-block">
                    <div className="field-label-row">
                      <label>Payment Mode at Delivery {finalPaid > 0 && <span className="req-star">*</span>}</label>
                    </div>
                    <div className="payment-method-selector">
                      {['Cash', 'UPI/GPay', 'Card'].map((mode) => (
                        <button
                          type="button"
                          key={mode}
                          className={`payment-mode-btn ${formData.paymentMode === mode ? 'selected' : ''}`}
                          onClick={() => setFormData({ ...formData, paymentMode: mode })}
                          disabled={isDelivered}
                        >
                          <span className="mode-icon">
                            {mode === 'Cash' ? '💵' : mode.includes('UPI') ? '📱' : '💳'}
                          </span>
                          <span>{mode}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Settlement Outcome Strip */}
                  <div className={`settlement-status-box ${pendingAmount === 0 ? 'settled' : 'pending-dues'}`}>
                    <div className="status-box-header">
                      <span>{pendingAmount === 0 ? '✅ FULLY SETTLED' : '⚠️ PARTIAL PAYMENT (PENDING DUES)'}</span>
                    </div>
                    <div className="status-box-values">
                      <div className="status-col">
                        <span className="col-label">Paid at Delivery</span>
                        <strong className="col-val text-emerald">₹{finalPaid}</strong>
                      </div>
                      <div className="status-col">
                        <span className="col-label">Outstanding Pending</span>
                        <strong className="col-val text-danger">₹{pendingAmount}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="field-block">
                    <div className="field-label-row">
                      <label>Delivery / Settlement Notes</label>
                    </div>
                    <textarea
                      name="deliveryNotes"
                      placeholder="e.g. Customer promised to pay remaining pending by next week, or test ride notes"
                      value={formData.deliveryNotes}
                      onChange={handleChange}
                      disabled={isDelivered}
                      maxLength={250}
                      rows="2"
                    />
                  </div>

                  <div className="action-buttons-strip">
                    {isDelivered ? (
                      <div className="already-delivered-actions">
                        <p className="delivered-badge-text">✓ Vehicle Already Delivered & Marked Complete</p>
                        <button
                          type="button"
                          className="btn-primary-elevated"
                          onClick={() => navigate(`/receipt/${id}`)}
                        >
                          View Official Receipt
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn-deliver-execute"
                        onClick={handleDelivery}
                      >
                        <span>Complete Delivery & Generate Invoice</span>
                        <span>&rarr;</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: ADD REPAIR NOTE DIRECTLY AT DELIVERY CHECK */}
        {showNoteModal && (
          <div className="popup-backdrop">
            <div className="comment-modal-box">
              <div className="modal-top-bar">
                <h3>🛠️ Add Repair Note / Comment</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowNoteModal(false)}
                >
                  ✕
                </button>
              </div>

              <p className="modal-context-hint">
                Add progress note for <strong>{repair.bikeNumber}</strong> ({repair.customerName}). This note will be recorded in the job card history.
              </p>

              <form onSubmit={handleSaveRepairNote}>
                <div className="form-group-block">
                  <label>Technician Comment / Work Done:</label>
                  <textarea
                    rows="4"
                    placeholder="e.g. Replaced front brake pads, clutch wire lubricated, chain slackness adjusted..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className="modal-buttons-strip">
                  <button
                    type="button"
                    className="btn-secondary-flat"
                    onClick={() => setShowNoteModal(false)}
                    disabled={savingNote}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-elevated"
                    disabled={savingNote || !newNoteText.trim()}
                  >
                    {savingNote ? 'Saving Note...' : 'Save Note to Job Card'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL POPUP: Delivery Success */}
        {showDeliveryPopup && (
          <div className="popup-backdrop">
            <div className="delivery-success-modal">
              <button className="modal-close-x" onClick={closePopup}>✕</button>

              <div className="modal-icon-badge">🎉</div>
              <h2 className="modal-title">Vehicle Delivered Successfully!</h2>
              <p className="modal-desc">
                Job Card #{repair.id} for <strong>{repair.bikeNumber}</strong> has been completed and marked DELIVERED.
              </p>

              <div className="modal-ledger-box">
                <div className="ledger-cell">
                  <span>Paid Now</span>
                  <strong className="text-emerald">₹{finalPaid}</strong>
                </div>
                <div className="ledger-cell">
                  <span>Pending Dues</span>
                  <strong className={pendingAmount > 0 ? 'text-danger' : 'text-muted'}>
                    ₹{pendingAmount}
                  </strong>
                </div>
              </div>

              <div className="modal-actions-list">
                <button
                  type="button"
                  className="btn-modal-action whatsapp"
                  onClick={sharePdfViaWhatsApp}
                >
                  <span>📲 Share PDF via WhatsApp</span>
                </button>

                <button
                  type="button"
                  className="btn-modal-action primary"
                  onClick={viewReceipt}
                >
                  <span>🧾 View & Print Receipt</span>
                </button>

                <button
                  type="button"
                  className="btn-modal-action neutral"
                  onClick={closePopup}
                >
                  <span>Done / Back to Bay</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryRepair