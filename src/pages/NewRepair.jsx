import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function NewRepair() {
  const navigate = useNavigate()

  const getToday = () => {
    return new Date().toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    bikeNumber: '',
    bikeModel: '',
    odoMeter: '',
    fuelLevel: '',

    workRequired: [],
    otherWork: '',

    complaints: [''],

    toolkitFirstAid: '',
    helmetLeft: '',
    bodyCondition: '',
    rearViewMirrors: '',
    indicatorHorn: '',
    batteryCondition: '',

    serviceSpares: '',
    serviceLabour: '',
    additionalSpares: '',
    additionalLabour: '',

    advanceAmount: '',
    advanceDate: getToday(),
    advancePaymentMode: '',
    advanceNotes: '',
  })

  // Repeat customer detection state
  const [repeatMatches, setRepeatMatches] = useState([])
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  // Check for repeat customer when mobile or bike number changes
  useEffect(() => {
    const checkRepeatCustomer = async () => {
      const phone = formData.mobileNumber.trim()
      const plate = formData.bikeNumber.trim()

      if (phone.length < 5 && plate.length < 4) {
        setRepeatMatches([])
        return
      }

      try {
        const all = await db.repairs.toArray()
        const matches = all.filter((r) => {
          const mPhone = (r.mobileNumber || r.phone || '').trim()
          const mPlate = (r.bikeNumber || r.vehicleNumber || '').trim().toUpperCase()

          return (phone.length >= 5 && mPhone === phone) ||
                 (plate.length >= 4 && mPlate === plate)
        })

        setRepeatMatches(matches.reverse())
      } catch (err) {
        console.error(err)
      }
    }

    const timer = setTimeout(checkRepeatCustomer, 300)
    return () => clearTimeout(timer)
  }, [formData.mobileNumber, formData.bikeNumber])

  const autoFillFromPrevious = (record) => {
    setFormData((prev) => ({
      ...prev,
      customerName: record.customerName || prev.customerName,
      mobileNumber: record.mobileNumber || record.phone || prev.mobileNumber,
      bikeNumber: record.bikeNumber || record.vehicleNumber || prev.bikeNumber,
      bikeModel: record.bikeModel || record.vehicleModel || prev.bikeModel,
    }))
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Sanitize mobile input: digits only, maximum 10 digits
  const handleMobileChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 10)
    setFormData((prev) => ({
      ...prev,
      mobileNumber: digitsOnly,
    }))
  }

  // Vehicle registration plate: auto uppercase, maximum 13 chars
  const handleBikeNumberChange = (event) => {
    setFormData((prev) => ({
      ...prev,
      bikeNumber: event.target.value.toUpperCase().slice(0, 13),
    }))
  }

  // Odometer reading: positive digits only, maximum 7 digits
  const handleOdoMeterChange = (event) => {
    const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 7)
    setFormData((prev) => ({
      ...prev,
      odoMeter: digitsOnly,
    }))
  }

  const handleWorkToggle = (work) => {
    setFormData((prev) => {
      const isSelected = prev.workRequired.includes(work)
      const updatedWork = isSelected
        ? prev.workRequired.filter((w) => w !== work)
        : [...prev.workRequired, work]

      return {
        ...prev,
        workRequired: updatedWork,
        otherWork: work === 'Others' && isSelected ? '' : prev.otherWork,
      }
    })
  }

  const handleComplaintChange = (index, value) => {
    const updatedComplaints = [...formData.complaints]
    updatedComplaints[index] = value
    setFormData((prev) => ({
      ...prev,
      complaints: updatedComplaints,
    }))
  }

  const addComplaint = () => {
    setFormData((prev) => ({
      ...prev,
      complaints: [...prev.complaints, ''],
    }))
  }

  const removeComplaint = (index) => {
    if (formData.complaints.length === 1) return
    setFormData((prev) => ({
      ...prev,
      complaints: prev.complaints.filter((_, idx) => idx !== index),
    }))
  }

  const calculateServiceTotal = () => {
    const spares = Number(formData.serviceSpares) || 0
    const labour = Number(formData.serviceLabour) || 0
    return spares + labour
  }

  const calculateAdditionalTotal = () => {
    const spares = Number(formData.additionalSpares) || 0
    const labour = Number(formData.additionalLabour) || 0
    return spares + labour
  }

  const calculateTotalEstimate = () => {
    return calculateServiceTotal() + calculateAdditionalTotal()
  }

  const calculateRemainingAmount = () => {
    const total = calculateTotalEstimate()
    const advance = Number(formData.advanceAmount) || 0
    return Math.max(total - advance, 0)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const advance = Number(formData.advanceAmount) || 0

    if (advance > 0) {
      if (!formData.advanceDate) {
        alert('Please select the advance payment date.')
        return
      }
      if (!formData.advancePaymentMode) {
        alert('Please choose the advance payment mode (Cash, UPI, or Card).')
        return
      }
    }

    const totalEstimate = calculateTotalEstimate()
    if (advance > totalEstimate) {
      alert('Advance amount cannot be more than the total estimated amount.')
      return
    }

    const filteredComplaints = formData.complaints
      .map((c) => c.trim())
      .filter((c) => c !== '')

    // Initialize payment history if advance is given
    const initialPaymentHistory = advance > 0 ? [
      {
        id: Date.now(),
        date: formData.advanceDate || getToday(),
        amount: advance,
        mode: formData.advancePaymentMode,
        type: 'ADVANCE',
        notes: formData.advanceNotes || 'Token advance deposit received',
      }
    ] : []

    const repairData = {
      ...formData,
      complaints: filteredComplaints.join(' || '),
      createdDate: new Date().toISOString(),
      status: 'IN_PROGRESS',
      serviceTotal: calculateServiceTotal(),
      additionalTotal: calculateAdditionalTotal(),
      totalEstimatedAmount: totalEstimate,
      remainingEstimatedAmount: calculateRemainingAmount(),

      // Payment Tracking Log
      paymentHistory: initialPaymentHistory,
      totalPaid: advance,

      deliveryDate: '',
      deliveredBy: '',
      finalAmount: '',
      finalAmountAfterAdvance: '',
      finalPaid: '',
      paymentMode: '',
      completedDate: '',
    }

    await db.repairs.add(repairData)
    alert('✅ Job Card created successfully!')
    navigate('/')
  }

  const workOptions = [
    { id: 'General Service', label: 'General Service', icon: '⚙️' },
    { id: 'Oil Change Only', label: 'Oil Change Only', icon: '🛢️' },
    { id: 'Brake/Suspension', label: 'Brake / Suspension', icon: '🛑' },
    { id: 'Engine Repair/Overhaul', label: 'Engine Overhaul', icon: '🔧' },
    { id: 'Electrical/Wiring Work', label: 'Electrical & Wiring', icon: '⚡' },
    { id: 'Welding/Lathe Work', label: 'Welding / Lathe', icon: '🔥' },
    { id: 'Others', label: 'Other Special Work', icon: '📝' },
  ]

  const fuelOptions = ['E', '1/4', '1/2', '3/4', 'F']

  return (
    <div className="page form-page-container">
      <div className="job-card-form-wrapper">
        {/* Header Bar */}
        <div className="form-header-bar">
          <div className="header-left">
            <button className="btn-back-link" onClick={() => navigate('/')}>
              &larr; Back to Dashboard
            </button>
            <h1 className="form-page-title">Create New Job Card</h1>
            <p className="form-page-desc">
              Customer details, vehicle inspection, complaints list, and estimated repair bill
            </p>
          </div>

          <div className="header-meta-tags">
            <div className="meta-tag-box">
              <span className="tag-label">ENTRY DATE</span>
              <span className="tag-val">{new Date().toLocaleDateString('en-IN')}</span>
            </div>
            <div className="meta-tag-box highlight">
              <span className="tag-label">INITIAL STATUS</span>
              <span className="tag-val status-badge-pulse">IN PROGRESS</span>
            </div>
          </div>
        </div>

        {/* Repeat Customer Alert Banner */}
        {repeatMatches.length > 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: 'var(--amber-50)',
            border: '1.5px solid var(--amber-500)',
            borderRadius: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.4rem' }}>⭐</span>
              <div>
                <strong style={{ color: 'var(--amber-700)', fontSize: '0.95rem' }}>
                  Returning Customer Detected!
                </strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  Found <strong>{repeatMatches[0].customerName}</strong> ({repeatMatches[0].bikeModel || 'Vehicle'}) with <strong>{repeatMatches.length} previous visit{repeatMatches.length > 1 ? 's' : ''}</strong>.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn-primary-elevated"
                style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                onClick={() => autoFillFromPrevious(repeatMatches[0])}
              >
                Auto-Fill Details
              </button>

              <button
                type="button"
                className="btn-secondary-flat"
                style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                onClick={() => setShowHistoryModal(true)}
              >
                View Past Jobs ({repeatMatches.length})
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="job-card-main-form">
          {/* SECTION 1: Customer & Vehicle Profile */}
          <section className="form-card-section">
            <div className="section-title-row">
              <div className="section-number-badge">1</div>
              <div>
                <h2>Customer & Vehicle Details</h2>
                <p>Contact details and vehicle identification</p>
              </div>
            </div>

            <div className="form-fields-grid">
              <div className="input-group">
                <label>Customer Name <span className="req-star">*</span></label>
                <div className="input-with-icon">
                  <span className="field-icon">👤</span>
                  <input
                    type="text"
                    name="customerName"
                    placeholder="Enter customer full name"
                    value={formData.customerName}
                    onChange={handleChange}
                    maxLength={50}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Mobile Number <span className="req-star">*</span></label>
                <div className="input-with-icon">
                  <span className="field-icon">📱</span>
                  <input
                    type="tel"
                    name="mobileNumber"
                    placeholder="10-digit mobile number"
                    value={formData.mobileNumber}
                    onChange={handleMobileChange}
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Bike License Plate Number <span className="req-star">*</span></label>
                <div className="license-plate-input-wrapper">
                  <span className="plate-ind-tag">IND</span>
                  <input
                    type="text"
                    name="bikeNumber"
                    className="license-plate-input"
                    placeholder="TN 01 AB 1234"
                    value={formData.bikeNumber}
                    onChange={handleBikeNumberChange}
                    maxLength={13}
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Bike Model & Make</label>
                <div className="input-with-icon">
                  <span className="field-icon">🏍️</span>
                  <input
                    type="text"
                    name="bikeModel"
                    placeholder="e.g. Royal Enfield Classic 350 / Activa"
                    value={formData.bikeModel}
                    onChange={handleChange}
                    maxLength={50}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Odometer Reading (KM)</label>
                <div className="input-with-icon">
                  <span className="field-icon">⏱️</span>
                  <input
                    type="text"
                    name="odoMeter"
                    placeholder="e.g. 24500"
                    value={formData.odoMeter}
                    onChange={handleOdoMeterChange}
                    maxLength={7}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Fuel Gauge Level</label>
                <div className="fuel-gauge-pills">
                  {fuelOptions.map((f) => (
                    <button
                      type="button"
                      key={f}
                      className={`fuel-pill ${formData.fuelLevel === f ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, fuelLevel: f })}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Work Requisition */}
          <section className="form-card-section">
            <div className="section-title-row">
              <div className="section-number-badge">2</div>
              <div>
                <h2>Work Required</h2>
                <p>Select required services or repair items</p>
              </div>
            </div>

            <div className="work-options-grid">
              {workOptions.map((work) => {
                const checked = formData.workRequired.includes(work.id)
                return (
                  <div
                    key={work.id}
                    className={`work-option-pill ${checked ? 'selected' : ''}`}
                    onClick={() => handleWorkToggle(work.id)}
                    role="button"
                    tabIndex={0}
                  >
                    <span className="work-icon">{work.icon}</span>
                    <span className="work-label">{work.label}</span>
                    <span className="work-checkbox">{checked ? '✓' : '+'}</span>
                  </div>
                )
              })}
            </div>

            {formData.workRequired.includes('Others') && (
              <div className="input-group other-work-group">
                <label>Specify Other Work Description</label>
                <input
                  type="text"
                  name="otherWork"
                  placeholder="Detail any custom or lathe work..."
                  value={formData.otherWork}
                  onChange={handleChange}
                  maxLength={100}
                />
              </div>
            )}
          </section>

          {/* SECTION 3: Customer Complaints */}
          <section className="form-card-section">
            <div className="section-title-row">
              <div className="section-number-badge">3</div>
              <div>
                <h2>Customer Complaints</h2>
                <p>Specific complaints reported by customer</p>
              </div>
            </div>

            <div className="complaints-list">
              {formData.complaints.map((complaint, index) => (
                <div className="complaint-input-row" key={index}>
                  <span className="complaint-num">#{index + 1}</span>
                  <input
                    type="text"
                    value={complaint}
                    placeholder={`e.g. ${index === 0 ? 'Engine noise on high speed or brake vibration' : 'Additional complaint description...'}`}
                    onChange={(e) => handleComplaintChange(index, e.target.value)}
                    maxLength={150}
                  />
                  {formData.complaints.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-complaint"
                      onClick={() => removeComplaint(index)}
                      title="Remove complaint"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="btn-add-complaint"
                onClick={addComplaint}
              >
                + Add Another Complaint
              </button>
            </div>
          </section>

          {/* SECTION 4: Pre-Service Inspection Checklist */}
          <section className="form-card-section">
            <div className="section-title-row">
              <div className="section-number-badge">4</div>
              <div>
                <h2>Vehicle Condition Check</h2>
                <p>Pre-service inspection to prevent delivery disputes</p>
              </div>
            </div>

            <div className="inspection-items-grid">
              <SegmentedInspection
                label="Toolkit / First Aid Box"
                name="toolkitFirstAid"
                options={['Yes', 'No']}
                value={formData.toolkitFirstAid}
                onChange={handleChange}
              />

              <SegmentedInspection
                label="Helmet Left with Bike"
                name="helmetLeft"
                options={['Yes', 'No']}
                value={formData.helmetLeft}
                onChange={handleChange}
              />

              <SegmentedInspection
                label="Body Paint Condition"
                name="bodyCondition"
                options={['Normal', 'Scratches']}
                value={formData.bodyCondition}
                onChange={handleChange}
              />

              <SegmentedInspection
                label="Rear View Mirrors"
                name="rearViewMirrors"
                options={['OK', 'Missing']}
                value={formData.rearViewMirrors}
                onChange={handleChange}
              />

              <SegmentedInspection
                label="Indicator & Horn"
                name="indicatorHorn"
                options={['Working', 'Faulty']}
                value={formData.indicatorHorn}
                onChange={handleChange}
              />

              <SegmentedInspection
                label="Battery Condition"
                name="batteryCondition"
                options={['Good', 'Weak']}
                value={formData.batteryCondition}
                onChange={handleChange}
              />
            </div>
          </section>

          {/* SECTION 5: Cost Estimation */}
          <section className="form-card-section">
            <div className="section-title-row">
              <div className="section-number-badge">5</div>
              <div>
                <h2>Cost Estimation</h2>
                <p>Estimated charges for spare parts and labour</p>
              </div>
            </div>

            <div className="estimate-cards-container">
              {/* Category 1: General Service */}
              <div className="cost-group-card">
                <div className="cost-group-header">
                  <div>
                    <span className="group-name">🧰 General Service & Routine Labour</span>
                    <p className="group-subtext">Standard servicing, water wash, and routine check</p>
                  </div>
                  <span className="group-subtotal">Subtotal: ₹{calculateServiceTotal()}</span>
                </div>
                <div className="cost-inputs-row">
                  <div className="cost-field">
                    <label>Spares (₹)</label>
                    <input
                      type="number"
                      name="serviceSpares"
                      placeholder="0"
                      value={formData.serviceSpares}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  <div className="cost-field">
                    <label>Labour (₹)</label>
                    <input
                      type="number"
                      name="serviceLabour"
                      placeholder="0"
                      value={formData.serviceLabour}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Category 2: Additional Work */}
              <div className="cost-group-card">
                <div className="cost-group-header">
                  <div>
                    <span className="group-name">⚙️ Additional Repairs, Parts & Overhaul</span>
                    <p className="group-subtext">Extra spare replacements, lathe work, oil & overhaul</p>
                  </div>
                  <span className="group-subtotal">Subtotal: ₹{calculateAdditionalTotal()}</span>
                </div>
                <div className="cost-inputs-row">
                  <div className="cost-field">
                    <label>Spares (₹)</label>
                    <input
                      type="number"
                      name="additionalSpares"
                      placeholder="0"
                      value={formData.additionalSpares}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                  <div className="cost-field">
                    <label>Labour (₹)</label>
                    <input
                      type="number"
                      name="additionalLabour"
                      placeholder="0"
                      value={formData.additionalLabour}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="estimate-grand-banner">
              <span className="banner-title">Total Estimated Bill</span>
              <span className="banner-value">₹{calculateTotalEstimate()}</span>
            </div>
          </section>

          {/* SECTION 6: Advance Payment Deposit */}
          <section className="form-card-section">
            <div className="section-title-row">
              <div className="section-number-badge">6</div>
              <div>
                <h2>Advance Deposit</h2>
                <p>Token advance amount received from customer</p>
              </div>
            </div>

            <div className="form-fields-grid">
              <div className="input-group">
                <label>Advance Amount Received (₹)</label>
                <div className="input-with-icon">
                  <span className="field-icon">₹</span>
                  <input
                    type="number"
                    name="advanceAmount"
                    placeholder="0"
                    value={formData.advanceAmount}
                    onChange={handleChange}
                    min="0"
                    max={calculateTotalEstimate()}
                  />
                </div>
              </div>

              <div className="input-group">
                <label>
                  Deposit Date {Number(formData.advanceAmount) > 0 && <span className="req-star">*</span>}
                </label>
                <input
                  type="date"
                  name="advanceDate"
                  value={formData.advanceDate}
                  onChange={handleChange}
                  disabled={Number(formData.advanceAmount) <= 0}
                  required={Number(formData.advanceAmount) > 0}
                />
              </div>

              <div className="input-group full-span">
                <label>
                  Payment Mode {Number(formData.advanceAmount) > 0 && <span className="req-star">*</span>}
                </label>
                <div className="payment-method-selector">
                  {['Cash', 'UPI', 'Card'].map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      className={`payment-mode-btn ${formData.advancePaymentMode === mode ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, advancePaymentMode: mode })}
                      disabled={Number(formData.advanceAmount) <= 0}
                    >
                      <span className="mode-icon">
                        {mode === 'Cash' ? '💵' : mode === 'UPI' ? '📱' : '💳'}
                      </span>
                      <span>{mode === 'UPI' ? 'UPI / GPay' : mode}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="input-group full-span">
                <label>Advance Payment Notes / Staff</label>
                <input
                  type="text"
                  name="advanceNotes"
                  placeholder="e.g. GPay UPI Ref #12345 or Cash received by Raja / Staff"
                  value={formData.advanceNotes}
                  onChange={handleChange}
                  maxLength={100}
                  disabled={Number(formData.advanceAmount) <= 0}
                />
              </div>
            </div>
          </section>

          {/* Sticky Summary Action Bar */}
          <div className="form-footer-action-bar">
            <div className="footer-summary-chips">
              <div className="summary-chip">
                <span>Total Bill</span>
                <strong>₹{calculateTotalEstimate()}</strong>
              </div>
              <div className="summary-chip">
                <span>Advance Paid</span>
                <strong className="advance-text">₹{Number(formData.advanceAmount) || 0}</strong>
              </div>
              <div className="summary-chip">
                <span>Est. Balance Due</span>
                <strong className="balance-text">₹{calculateRemainingAmount()}</strong>
              </div>
            </div>

            <div className="footer-action-buttons">
              <button
                type="button"
                className="btn-secondary-flat"
                onClick={() => navigate('/')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary-elevated submit-job-btn"
              >
                <span>Save Job Card</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        </form>

        {/* Modal: Past Visits for Repeat Customer */}
        {showHistoryModal && (
          <div className="popup-backdrop">
            <div className="delivery-success-modal" style={{ maxWidth: '680px', textAlign: 'left' }}>
              <button className="modal-close-x" onClick={() => setShowHistoryModal(false)}>✕</button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <span style={{ fontSize: '1.8rem' }}>📋</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Previous Service History</h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Customer: <strong>{repeatMatches[0]?.customerName}</strong> • Phone: {repeatMatches[0]?.mobileNumber}
                  </p>
                </div>
              </div>

              <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {repeatMatches.map((past) => (
                  <div key={past.id} style={{ padding: '14px', background: 'var(--bg-surface)', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong>Job #{past.id} • {past.bikeNumber}</strong>
                      <span className="small text-muted">{past.createdDate ? new Date(past.createdDate).toLocaleDateString('en-IN') : '-'}</span>
                    </div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Model: <strong>{past.bikeModel || '-'}</strong> • Odo: {past.odoMeter ? `${past.odoMeter} KM` : '-'}
                    </div>
                    <div style={{ fontSize: '0.84rem', marginBottom: '8px' }}>
                      Work: {past.workRequired?.join(', ') || 'Service'}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '8px', fontSize: '0.84rem' }}>
                      <span>Total: <strong>₹{past.finalAmount || past.totalEstimatedAmount || 0}</strong></span>
                      <button
                        type="button"
                        className="btn-back-link"
                        style={{ fontSize: '0.8rem' }}
                        onClick={() => {
                          autoFillFromPrevious(past)
                          setShowHistoryModal(false)
                        }}
                      >
                        Use this vehicle &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <button
                  type="button"
                  className="btn-secondary-flat"
                  onClick={() => setShowHistoryModal(false)}
                >
                  Close History
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SegmentedInspection({ label, name, options, value, onChange }) {
  return (
    <div className="segmented-inspection-card">
      <span className="inspection-title">{label}</span>
      <div className="segmented-options">
        {options.map((opt) => (
          <label
            key={opt}
            className={`segmented-pill ${value === opt ? 'active' : ''}`}
          >
            <input
              type="radio"
              name={name}
              value={opt}
              checked={value === opt}
              onChange={onChange}
            />
            <span>{opt}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export default NewRepair