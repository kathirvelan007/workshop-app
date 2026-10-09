import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { db } from '../db/database'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import RajaLogo from '../components/RajaLogo'

function Receipt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const onScreenReceiptRef = useRef(null)
  const printTemplateRef = useRef(null) // Fixed A4 Desktop layout canvas (Guarantees Document 2)

  const [repair, setRepair] = useState(null)
  const [sharing, setSharing] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const loadRepair = async () => {
    const repairData = await db.repairs.get(Number(id))
    if (!repairData) {
      alert('Receipt not found for this vehicle job card.')
      navigate('/')
      return
    }
    setRepair(repairData)
  }

  // Generate crisp, single-page A4 PDF matching Document 2 layout on all devices
  const createPdf = async () => {
    const targetElement = printTemplateRef.current || onScreenReceiptRef.current
    if (!targetElement) return null

    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 1024,
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

    // Only add extra page if content genuinely exceeds 1 page
    while (heightLeft > 0) {
      position = heightLeft - imageHeight + 10
      pdf.addPage()
      pdf.addImage(imageData, 'PNG', 10, position, imageWidth, imageHeight)
      heightLeft -= pageHeight - 20
    }

    return pdf
  }

  // Handle direct PDF file download
  const handleDownloadPdf = async () => {
    if (downloading) return
    try {
      setDownloading(true)
      const pdf = await createPdf()
      if (!pdf) {
        alert('Failed to generate PDF document.')
        return
      }
      const fileName = `Raja-Garage-Invoice-Job-${repair.id}-${repair.bikeNumber || 'receipt'}.pdf`
      pdf.save(fileName)
    } catch (err) {
      console.error('PDF download error:', err)
      alert('Error generating PDF: ' + err.message)
    } finally {
      setDownloading(false)
    }
  }

  // Share pristine Document 2 PDF via WhatsApp or download with pre-filled message
  const sharePdfToWhatsApp = async () => {
    if (sharing) return

    try {
      setSharing(true)
      const pdf = await createPdf()
      if (!pdf) {
        alert('Unable to generate PDF invoice.')
        return
      }

      const fileName = `Raja-Garage-Invoice-Job-${repair.id}.pdf`
      const pdfBlob = pdf.output('blob')
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' })

      // If browser supports native Web Share API with files (Android, iOS Safari/Chrome)
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `Raja Two Wheeler Garage Invoice #${repair.id}`,
          text: `Service Tax Invoice for ${repair.bikeNumber} (Job #${repair.id}) - Raja Two Wheeler Garage Since 1985`,
          files: [pdfFile],
        })
        return
      }

      // Fallback: download PDF and open WhatsApp with pre-filled message
      pdf.save(fileName)

      const totalBill = repair.finalAmount || repair.totalEstimatedAmount || 0
      const advance = repair.advanceAmount || 0
      const paidAtDelivery = repair.finalPaid || 0
      const pending = repair.pendingAmount || 0

      const message =
        `*RAJA TWO WHEELER GARAGE SINCE 1985*%0A` +
        `_Service • Modified • Lath Works_%0A%0A` +
        `*TAX INVOICE / RECEIPT: Job Card #${repair.id}*%0A` +
        `----------------------------------------%0A` +
        `🏍️ *Vehicle:* ${repair.bikeNumber || '-'} (${repair.bikeModel || 'Vehicle'})%0A` +
        `👤 *Customer:* ${repair.customerName || '-'}%0A` +
        `📞 *Mobile:* ${repair.mobileNumber || '-'}` +
        (repair.odoMeter ? `%0A⏱️ *Odometer:* ${repair.odoMeter} KM` : '') +
        `%0A📅 *Delivery Date:* ${repair.deliveryDate || new Date().toLocaleDateString('en-IN')}%0A%0A` +
        `💰 *Total Workshop Bill:* ₹${totalBill}%0A` +
        (advance > 0 ? `💵 *Advance Paid:* ₹${advance}%0A` : '') +
        `💳 *Paid at Delivery:* ₹${paidAtDelivery} (${repair.paymentMode || 'Cash'})%0A` +
        `📊 *Balance Due:* ${pending > 0 ? `₹${pending} (Pending)` : 'PAID IN FULL ✅'}%0A%0A` +
        `🙏 _Thank you for choosing Raja Two Wheeler Garage! Safe Riding!_%0A` +
        `📄 _(Official invoice PDF has been downloaded to your device)_`

      window.open(`https://wa.me/?text=${message}`, '_blank')
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('PDF sharing error:', error)
        alert('Unable to share PDF directly. The invoice PDF will be downloaded.')
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
          <button className="btn-secondary-flat" onClick={handleDownloadPdf} disabled={downloading}>
            {downloading ? 'Preparing...' : '📄 Download PDF'}
          </button>
          <button className="btn-secondary-flat" onClick={handlePrint}>
            🖨️ Print Invoice
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

      {/* ON-SCREEN RESPONSIVE RECEIPT CONTAINER */}
      <div className="invoice-paper-sheet" ref={onScreenReceiptRef}>
        {/* Header */}
        <div className="invoice-header-strip">
          <div className="workshop-brand-block">
            <RajaLogo size="lg" showTagline={true} />
            <p className="workshop-subtext mt-1">
              Multi-brand Bike Service • Engine Overhaul • Modified & Lathe Works • Water Wash
            </p>
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
          <p>Thank you for choosing Raja Two Wheeler Garage! Safe Riding!</p>
          <p className="footer-small">Official Workshop Service Receipt • Raja Two Wheeler Garage Since 1985</p>
        </div>
      </div>

      {/* =========================================================================
          FIXED A4 PRINT/PDF CANVAS TEMPLATE (Guarantees Single-Page Document 2 on Mobile & PC)
          ========================================================================= */}
      <div
        className="fixed-a4-pdf-canvas"
        ref={printTemplateRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '794px',
          minWidth: '794px',
          maxWidth: '794px',
          backgroundColor: '#ffffff',
          padding: '28px 32px',
          boxSizing: 'border-box',
          color: '#0f172a',
          zIndex: -999,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #dc2626', paddingBottom: '16px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.6rem' }}>🔧</span>
              <div>
                <h1 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em' }}>
                  RAJA TWO WHEELER GARAGE
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#dc2626', letterSpacing: '0.06em' }}>
                    SERVICE • MODIFIED • LATH WORKS
                  </span>
                  <span style={{ background: '#f59e0b', color: '#0f172a', fontSize: '0.62rem', fontWeight: 900, padding: '1px 5px', borderRadius: '3px' }}>
                    SINCE 1985
                  </span>
                </div>
              </div>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '0.74rem', color: '#64748b' }}>
              Multi-brand Bike Service • Engine Overhaul • Modified & Lathe Works • Water Wash
            </p>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
            <div style={{ background: '#0f172a', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.05em' }}>
              TAX INVOICE / RECEIPT
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
              Job Card No: <strong style={{ color: '#0f172a' }}>#{repair.id}</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Delivery Date: <strong style={{ color: '#0f172a' }}>{deliveryDateFormatted}</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Status: <strong style={{ color: repair.status === 'DELIVERED' ? '#059669' : '#d97706' }}>{repair.status}</strong>
            </div>
          </div>
        </div>

        {/* Customer & Vehicle Two-Column Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '14px' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px', letterSpacing: '0.05em' }}>
              CUSTOMER DETAILS
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Name:</span>
              <strong style={{ color: '#0f172a' }}>{repair.customerName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: '#64748b' }}>Mobile:</span>
              <strong style={{ color: '#0f172a' }}>{repair.mobileNumber || '-'}</strong>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '6px', letterSpacing: '0.05em' }}>
              VEHICLE DETAILS
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '4px' }}>
              <span style={{ color: '#64748b' }}>Vehicle No:</span>
              <span style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                {repair.bikeNumber}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '2px' }}>
              <span style={{ color: '#64748b' }}>Model:</span>
              <strong style={{ color: '#0f172a' }}>{repair.bikeModel || '-'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
              <span style={{ color: '#64748b' }}>Odometer:</span>
              <strong style={{ color: '#0f172a' }}>{repair.odoMeter ? `${repair.odoMeter} KM` : '-'}</strong>
            </div>
          </div>
        </div>

        {/* Work & Complaints */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 14px', marginBottom: '14px', fontSize: '0.8rem' }}>
          <div>
            <strong style={{ color: '#0f172a' }}>Work Requisition / Service Type: </strong>
            <span style={{ color: '#334155' }}>
              {repair.workRequired?.join(', ') || 'General Repair'}{repair.otherWork ? ` • ${repair.otherWork}` : ''}
            </span>
          </div>
          {repair.complaints && (
            <div style={{ marginTop: '4px' }}>
              <strong style={{ color: '#0f172a' }}>Attended Complaints: </strong>
              <span style={{ color: '#475569' }}>
                {repair.complaints.split(' || ').join(' • ')}
              </span>
            </div>
          )}
        </div>

        {/* Charges Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '0.82rem' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
              <th style={{ padding: '8px 10px', width: '36px' }}>#</th>
              <th style={{ padding: '8px 10px' }}>SERVICE / WORK DESCRIPTION</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', width: '90px' }}>SPARES (₹)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', width: '90px' }}>LABOUR (₹)</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', width: '100px' }}>TOTAL (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 10px' }}>1</td>
              <td style={{ padding: '8px 10px' }}>
                <strong style={{ color: '#0f172a' }}>General Service & Labour</strong>
                <div style={{ color: '#64748b', fontSize: '0.74rem' }}>Standard service checklist & labour tasks</div>
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'right' }}>{repair.serviceSpares || 0}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right' }}>{repair.serviceLabour || 0}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>₹{repair.serviceTotal || 0}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px 10px' }}>2</td>
              <td style={{ padding: '8px 10px' }}>
                <strong style={{ color: '#0f172a' }}>Additional Repair & Spares</strong>
                <div style={{ color: '#64748b', fontSize: '0.74rem' }}>Extra parts, oils, consumables & lathe works</div>
              </td>
              <td style={{ padding: '8px 10px', textAlign: 'right' }}>{repair.additionalSpares || 0}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right' }}>{repair.additionalLabour || 0}</td>
              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>₹{repair.additionalTotal || 0}</td>
            </tr>
            {Array.isArray(repair.customCharges) && repair.customCharges.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 10px' }}>{3 + i}</td>
                <td style={{ padding: '8px 10px' }}>
                  <strong style={{ color: '#0f172a' }}>{c.description || `Custom Work #${i + 1}`}</strong>
                  <div style={{ color: '#64748b', fontSize: '0.74rem' }}>Specialized part or custom work added at delivery</div>
                </td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{c.spares || 0}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right' }}>{c.labour || 0}</td>
                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>
                  ₹{(Number(c.spares) || 0) + (Number(c.labour) || 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bottom Ledger Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Payment & Handover Notes:
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#334155', fontStyle: 'italic', lineHeight: 1.4 }}>
                {repair.deliveryNotes || 'Vehicle delivered in good running condition after trial inspection.'}
              </p>
              {repair.deliveredBy && (
                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#475569' }}>
                  Delivered By: <strong>{repair.deliveredBy}</strong>
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px' }}>
              <div style={{ width: '160px', borderBottom: '1px solid #94a3b8', marginBottom: '4px' }}></div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Authorized Signatory</span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>Total Bill Amount:</span>
              <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>₹{totalEstimate}</strong>
            </div>

            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#059669' }}>
                <span>Special Discount:</span>
                <strong>- ₹{discount}</strong>
              </div>
            )}

            {Array.isArray(repair.paymentHistory) && repair.paymentHistory.length > 0 ? (
              <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                  Payments Collected:
                </span>
                {repair.paymentHistory.map((p, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#059669', padding: '2px 0' }}>
                    <span>
                      {p.type === 'ADVANCE' ? '• Advance Deposit' : p.type === 'DELIVERY' ? '• Delivery Payment' : '• Balance Settlement'} ({p.mode || 'Cash'}):
                    </span>
                    <strong>₹{p.amount}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {advance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#059669' }}>
                    <span>Advance Paid ({repair.advancePaymentMode || 'Cash'}):</span>
                    <strong>- ₹{advance}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: '#2563eb' }}>
                  <span>Amount Paid at Delivery:</span>
                  <strong>₹{finalPaid} ({repair.paymentMode || 'Cash'})</strong>
                </div>
              </>
            )}

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '2px solid #0f172a',
              paddingTop: '8px',
              marginTop: '4px',
              fontSize: '0.9rem',
              fontWeight: 900,
            }}>
              <span>{pendingAmount > 0 ? 'Pending Balance Due:' : 'Net Balance Status:'}</span>
              <span style={{ color: pendingAmount > 0 ? '#dc2626' : '#059669', fontFamily: 'monospace' }}>
                {pendingAmount > 0 ? `₹${pendingAmount}` : 'PAID IN FULL'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
            Thank you for choosing Raja Two Wheeler Garage! Safe Riding!
          </p>
          <p style={{ margin: '3px 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>
            Official Workshop Service Receipt • Raja Two Wheeler Garage Since 1985
          </p>
        </div>
      </div>
    </div>
  )
}

export default Receipt