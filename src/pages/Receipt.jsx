import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/database'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

function Receipt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const receiptRef = useRef(null)

  const [repair, setRepair] = useState(null)
  const [sharing, setSharing] = useState(false)

  const loadRepair = async () => {
    const repairData = await db.repairs.get(Number(id))
    if (!repairData) {
      alert('Receipt not found')
      navigate('/')
      return
    }
    setRepair(repairData)
  }

  const createPdf = async () => {
    if (!receiptRef.current) return null

    const canvas = await html2canvas(receiptRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })

    const imageData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const imageWidth = pageWidth - 20
    const imageHeight = (canvas.height * imageWidth) / canvas.width

    let heightLeft = imageHeight
    let position = 10

    pdf.addImage(imageData, 'PNG', 10, position, imageWidth, imageHeight)
    heightLeft -= pageHeight - 20

    while (heightLeft > 0) {
      position = heightLeft - imageHeight + 10
      pdf.addPage()
      pdf.addImage(imageData, 'PNG', 10, position, imageWidth, imageHeight)
      heightLeft -= pageHeight - 20
    }

    return pdf
  }

  const sharePdfToWhatsApp = async () => {
    if (sharing) return

    try {
      setSharing(true)
      const pdf = await createPdf()
      if (!pdf) {
        alert('Unable to generate PDF invoice.')
        return
      }

      const fileName = `Workshop-Invoice-Job-${repair.id}.pdf`
      const pdfBlob = pdf.output('blob')
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `Prem Workshop Invoice #${repair.id}`,
          text: `Workshop invoice for ${repair.bikeNumber} (Job #${repair.id})`,
          files: [pdfFile],
        })
        return
      }

      // Fallback
      pdf.save(fileName)
      const message =
        `*PREM WORKSHOP INVOICE*%0A` +
        `Job Card: #${repair.id}%0A` +
        `Vehicle: ${repair.bikeNumber}%0A` +
        `Customer: ${repair.customerName}%0A` +
        `Total Bill: ₹${repair.finalAmount || repair.totalEstimatedAmount || 0}%0A` +
        `Advance: ₹${repair.advanceAmount || 0}%0A` +
        `Paid: ₹${repair.finalPaid || 0}%0A` +
        `Pending Balance: ₹${repair.pendingAmount || 0}`

      window.open(`https://wa.me/?text=${message}`, '_blank')
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('PDF sharing error:', error)
        alert('Unable to share PDF directly. The PDF will be downloaded.')
      }
    } finally {
      setSharing(false)
    }
  }

  useEffect(() => {
    loadRepair()
  }, [id])

  useEffect(() => {
    if (repair && location.state?.autoShareWhatsApp) {
      sharePdfToWhatsApp()
    }
  }, [repair, location.state])

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    navigate(`/delivery/${id}`, {
      state: { openDeliveryPopup: true },
    })
  }

  if (!repair) {
    return (
      <div className="page loading-center">
        <div className="loading-spinner"></div>
        <p>Loading invoice receipt...</p>
      </div>
    )
  }

  const totalEstimate = Number(repair.finalAmount) || Number(repair.totalEstimatedAmount) || 0
  const advance = Number(repair.advanceAmount) || 0
  const discount = Number(repair.discountAmount) || 0
  const finalPaid = Number(repair.finalPaid) || 0
  const pendingAmount = Number(repair.pendingAmount) || 0
  const deliveryDateFormatted = repair.deliveryDate || new Date().toLocaleDateString('en-IN')

  return (
    <div className="page receipt-page-view">
      {/* Top Floating Action Bar (Hidden during print) */}
      <div className="receipt-action-toolbar print-hide">
        <button className="btn-secondary-flat" onClick={handleBack}>
          &larr; Back to Settlement
        </button>

        <div className="toolbar-right-btns">
          <button className="btn-secondary-flat" onClick={handlePrint}>
            🖨️ Print / Save PDF
          </button>
          <button
            className="btn-whatsapp"
            onClick={sharePdfToWhatsApp}
            disabled={sharing}
          >
            {sharing ? 'Generating PDF...' : '📲 Share on WhatsApp'}
          </button>
        </div>
      </div>

      {/* Printable Invoice Container */}
      <div className="invoice-paper-sheet" ref={receiptRef}>
        {/* Header */}
        <div className="invoice-header-strip">
          <div className="workshop-brand-block">
            <div className="brand-logo-text">
              <span className="logo-icon">🔧</span>
              <h1>PREM WORKSHOP</h1>
            </div>
            <p className="workshop-tagline">TWO WHEELER SERVICE & GENERAL REPAIR WORKSHOP</p>
            <p className="workshop-subtext">Multi-brand Bike Service • Lathe & Welding Works • Water Wash</p>
          </div>

          <div className="invoice-meta-block">
            <div className="invoice-type-pill">TAX INVOICE / RECEIPT</div>
            <div className="meta-row">
              <span>Job Card No:</span>
              <strong>#{repair.id}</strong>
            </div>
            <div className="meta-row">
              <span>Delivery Date:</span>
              <strong>{deliveryDateFormatted}</strong>
            </div>
            <div className="meta-row">
              <span>Status:</span>
              <strong className="status-text">{repair.status}</strong>
            </div>
          </div>
        </div>

        {/* Customer & Vehicle Grid */}
        <div className="invoice-two-col-grid">
          <div className="info-box-panel">
            <h3 className="box-title">CUSTOMER DETAILS</h3>
            <div className="info-line"><span>Name:</span> <strong>{repair.customerName}</strong></div>
            <div className="info-line"><span>Mobile:</span> <strong>{repair.mobileNumber || '-'}</strong></div>
          </div>

          <div className="info-box-panel">
            <h3 className="box-title">VEHICLE DETAILS</h3>
            <div className="info-line">
              <span>Vehicle No:</span>
              <span className="license-plate-chip">{repair.bikeNumber}</span>
            </div>
            <div className="info-line"><span>Model:</span> <strong>{repair.bikeModel || '-'}</strong></div>
            <div className="info-line"><span>Odometer:</span> <strong>{repair.odoMeter ? `${repair.odoMeter} KM` : '-'}</strong></div>
            <div className="info-line"><span>Fuel Level:</span> <strong>{repair.fuelLevel || '-'}</strong></div>
          </div>
        </div>

        {/* Work & Complaints Section */}
        <div className="invoice-details-section">
          <div className="details-sub-box">
            <h4>Work Requisition / Service Type:</h4>
            <p>{repair.workRequired?.join(', ') || 'General Repair'}{repair.otherWork ? ` • ${repair.otherWork}` : ''}</p>
          </div>

          {repair.complaints && (
            <div className="details-sub-box">
              <h4>Customer Reported Complaints Attended:</h4>
              <ul className="invoice-complaints-list">
                {repair.complaints.split(' || ').map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Itemized Charges Table */}
        <div className="table-scroll-hint-row print-hide">
          <span className="scroll-hint-text">↔ Swipe table horizontally to view all charges</span>
        </div>
        <div className="invoice-charges-table-wrapper">
          <table className="invoice-charges-table">
            <thead>
              <tr>
                <th className="col-num">#</th>
                <th className="col-desc">Service / Work Description</th>
                <th className="text-right col-amt">Spares (₹)</th>
                <th className="text-right col-amt">Labour (₹)</th>
                <th className="text-right col-amt">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="col-num">1</td>
                <td className="col-desc">
                  <strong>General Service & Labour</strong>
                  <div className="text-muted small">Standard service checklist & labour tasks</div>
                </td>
                <td className="text-right col-amt">{repair.serviceSpares || 0}</td>
                <td className="text-right col-amt">{repair.serviceLabour || 0}</td>
                <td className="text-right font-bold col-amt">₹{repair.serviceTotal || 0}</td>
              </tr>
              <tr>
                <td className="col-num">2</td>
                <td className="col-desc">
                  <strong>Additional Repair & Spares</strong>
                  <div className="text-muted small">Extra parts, oils, consumables & lathe works</div>
                </td>
                <td className="text-right col-amt">{repair.additionalSpares || 0}</td>
                <td className="text-right col-amt">{repair.additionalLabour || 0}</td>
                <td className="text-right font-bold col-amt">₹{repair.additionalTotal || 0}</td>
              </tr>
              {Array.isArray(repair.customCharges) && repair.customCharges.map((c, i) => (
                <tr key={`custom-${i}`}>
                  <td className="col-num">{3 + i}</td>
                  <td className="col-desc">
                    <strong>{c.description || `Custom Work / Part #${i + 1}`}</strong>
                    <div className="text-muted small">Specialized part or custom work added at delivery</div>
                  </td>
                  <td className="text-right col-amt">{c.spares || 0}</td>
                  <td className="text-right col-amt">{c.labour || 0}</td>
                  <td className="text-right font-bold col-amt">
                    ₹{(Number(c.spares) || 0) + (Number(c.labour) || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Ledger */}
        <div className="invoice-bottom-grid">
          <div className="terms-panel">
            <h4>Payment & Handover Notes:</h4>
            <p className="notes-text">
              {repair.deliveryNotes || 'Vehicle delivered in good running condition after trial inspection.'}
            </p>
            {repair.deliveredBy && (
              <p className="staff-text">Delivered By: <strong>{repair.deliveredBy}</strong></p>
            )}
            <div className="sign-block">
              <div className="sign-line"></div>
              <span>Authorized Signatory</span>
            </div>
          </div>

          <div className="totals-panel">
            <div className="totals-row">
              <span>Total Bill Amount:</span>
              <strong>₹{totalEstimate}</strong>
            </div>

            {discount > 0 && (
              <div className="totals-row">
                <span>Special Discount:</span>
                <strong className="text-emerald">- ₹{discount}</strong>
              </div>
            )}

            {/* If payment history is available, list all installment payments */}
            {Array.isArray(repair.paymentHistory) && repair.paymentHistory.length > 0 ? (
              <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Payments Collected:
                </span>
                {repair.paymentHistory.map((p, idx) => (
                  <div key={idx} className="totals-row" style={{ fontSize: '0.82rem', padding: '2px 0' }}>
                    <span>
                      {p.type === 'ADVANCE' ? '• Advance Deposit' : p.type === 'DELIVERY' ? '• Delivery Payment' : '• Balance Settlement'} ({p.mode || 'Cash'}, {p.date}):
                    </span>
                    <strong className="text-emerald">₹{p.amount}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {advance > 0 && (
                  <div className="totals-row">
                    <span>Advance Paid ({repair.advancePaymentMode || 'Cash'}):</span>
                    <strong className="text-emerald">- ₹{advance}</strong>
                  </div>
                )}
                <div className="totals-row subtotal">
                  <span>Amount Paid at Delivery:</span>
                  <strong className="text-primary">₹{finalPaid} ({repair.paymentMode || 'Cash'})</strong>
                </div>
              </>
            )}

            <div className={`totals-row grand-due ${pendingAmount > 0 ? 'has-pending' : 'settled'}`}>
              <span>{pendingAmount > 0 ? 'Pending Balance Due:' : 'Net Balance Status:'}</span>
              <strong>{pendingAmount > 0 ? `₹${pendingAmount}` : 'PAID IN FULL'}</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="invoice-footer">
          <p>Thank you for choosing Prem Workshop! Safe Riding!</p>
          <p className="footer-small">Official Workshop Service Receipt • Prem Workshop</p>
        </div>
      </div>
    </div>
  )
}

export default Receipt