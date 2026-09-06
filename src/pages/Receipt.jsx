import { useEffect, useRef, useState } from 'react'
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'

import { db } from '../db/database'

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'


function Receipt() {
  const { id } = useParams()

  const navigate = useNavigate()
  const location = useLocation()

  const receiptRef = useRef(null)

  const [repair, setRepair] =
    useState(null)

  const [sharing, setSharing] =
    useState(false)


  useEffect(() => {
    loadRepair()
  }, [id])


  useEffect(() => {
    /*
      If DeliveryRepair opened Receipt
      specifically for WhatsApp sharing,
      automatically start sharing.
    */
    if (
      repair &&
      location.state?.autoShareWhatsApp
    ) {
      sharePdfToWhatsApp()
    }
  }, [repair, location.state])


  const loadRepair = async () => {
    const repairData =
      await db.repairs.get(Number(id))

    if (!repairData) {
      alert('Receipt not found')

      navigate('/')

      return
    }

    setRepair(repairData)
  }


  const handlePrint = () => {
    window.print()
  }


  const createPdf = async () => {
    if (!receiptRef.current) {
      return null
    }

    const canvas =
      await html2canvas(
        receiptRef.current,
        {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
        }
      )

    const imageData =
      canvas.toDataURL('image/png')

    const pdf =
      new jsPDF(
        'p',
        'mm',
        'a4'
      )

    const pageWidth =
      pdf.internal.pageSize.getWidth()

    const pageHeight =
      pdf.internal.pageSize.getHeight()

    const imageWidth =
      pageWidth - 20

    const imageHeight =
      (
        canvas.height *
        imageWidth
      ) / canvas.width

    let heightLeft =
      imageHeight

    let position = 10

    pdf.addImage(
      imageData,
      'PNG',
      10,
      position,
      imageWidth,
      imageHeight
    )

    heightLeft -=
      pageHeight - 20

    while (heightLeft > 0) {

      position =
        heightLeft -
        imageHeight +
        10

      pdf.addPage()

      pdf.addImage(
        imageData,
        'PNG',
        10,
        position,
        imageWidth,
        imageHeight
      )

      heightLeft -=
        pageHeight - 20
    }

    return pdf
  }


  const sharePdfToWhatsApp = async () => {
    if (sharing) {
      return
    }

    try {

      setSharing(true)

      const pdf =
        await createPdf()

      if (!pdf) {
        alert(
          'Unable to create PDF.'
        )

        return
      }


      const pdfBlob =
        pdf.output('blob')


      const fileName =
        `Workshop-Receipt-${repair.id}.pdf`


      const pdfFile =
        new File(
          [pdfBlob],
          fileName,
          {
            type: 'application/pdf',
          }
        )


      /*
        Best option:
        Use native Web Share API when the
        browser supports sharing files.
      */

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [pdfFile],
        })
      ) {

        await navigator.share({
          title:
            `Workshop Receipt #${repair.id}`,

          text:
            `Workshop receipt for ${repair.bikeNumber}`,

          files: [pdfFile],
        })

        return
      }


      /*
        Fallback:
        Download the PDF and open WhatsApp
        with a prepared message.

        The browser cannot directly attach
        a locally generated PDF to WhatsApp
        using a normal WhatsApp URL.
      */

      pdf.save(fileName)


      const message =
        `Workshop Receipt #${repair.id}%0A` +
        `Vehicle: ${repair.bikeNumber}%0A` +
        `Amount: ₹${repair.finalAmount || 0}%0A` +
        `Pending Amount: ₹${repair.pendingAmount || 0}`


      window.open(
        `https://wa.me/?text=${message}`,
        '_blank'
      )

    } catch (error) {

      /*
        User cancelled the native share dialog.
        Don't show an error in that case.
      */

      if (
        error?.name !==
        'AbortError'
      ) {
        console.error(
          'PDF sharing failed:',
          error
        )

        alert(
          'Unable to share the PDF. The PDF will be downloaded instead.'
        )
      }

    } finally {

      setSharing(false)

    }
  }


  const handleBack = () => {
    navigate(
      `/delivery/${id}`,
      {
        state: {
          openDeliveryPopup: true,
        },
      }
    )
  }


  if (!repair) {
    return (
      <div className="page">
        <h2>
          Loading receipt...
        </h2>
      </div>
    )
  }


  return (
    <div className="page receipt-page">

      <div
        className="receipt-container"
        ref={receiptRef}
      >

        {/* HEADER */}

        <div className="receipt-header">

          <h1>
            WORKSHOP RECEIPT
          </h1>

          <p>
            Job Card #{repair.id}
          </p>

          <p>
            Date:{' '}

            {repair.deliveryDate ||
              new Date().toLocaleDateString()}
          </p>

        </div>


        {/* CUSTOMER DETAILS */}

        <section className="receipt-section">

          <h2>
            Customer Details
          </h2>

          <div className="receipt-grid">

            <ReceiptItem
              label="Customer Name"
              value={
                repair.customerName
              }
            />

            <ReceiptItem
              label="Mobile Number"
              value={
                repair.mobileNumber
              }
            />

            <ReceiptItem
              label="Vehicle Number"
              value={
                repair.bikeNumber
              }
            />

            <ReceiptItem
              label="Vehicle Model"
              value={
                repair.bikeModel
              }
            />

          </div>

        </section>


        {/* WORK DETAILS */}

        <section className="receipt-section">

          <h2>
            Work Details
          </h2>

          <ReceiptItem
            label="Work Required"
            value={
              repair.workRequired?.join(
                ', '
              ) || '-'
            }
          />

          {repair.otherWork && (

            <ReceiptItem
              label="Other Work"
              value={
                repair.otherWork
              }
            />

          )}

        </section>


        {/* CUSTOMER COMPLAINTS */}

        <section className="receipt-section">

          <h2>
            Customer Complaints
          </h2>

          <ul className="receipt-complaints">

            {repair.complaints
              ?.split(' || ')
              .filter(
                (complaint) =>
                  complaint.trim() !== ''
              )
              .map(
                (
                  complaint,
                  index
                ) => (

                  <li key={index}>
                    {complaint}
                  </li>

                )
              )}

          </ul>

        </section>


        {/* COST DETAILS */}

        <section className="receipt-section">

          <h2>
            Payment Details
          </h2>


          <div className="receipt-cost-row">

            <span>
              General Service / Welding
            </span>

            <strong>
              ₹ {repair.serviceTotal || 0}
            </strong>

          </div>


          <div className="receipt-cost-row">

            <span>
              Additional Repair / Parts
            </span>

            <strong>
              ₹ {repair.additionalTotal || 0}
            </strong>

          </div>


          <div className="receipt-cost-row total-row">

            <span>
              Total Amount
            </span>

            <strong>
              ₹ {repair.finalAmount || 0}
            </strong>

          </div>


          <div className="receipt-cost-row">

            <span>
              Advance Paid
            </span>

            <strong>
              ₹ {repair.advanceAmount || 0}
            </strong>

          </div>


          <div className="receipt-cost-row">

            <span>
              Advance Payment Date
            </span>

            <strong>
              {repair.advanceDate || '-'}
            </strong>

          </div>


          <div className="receipt-cost-row">

            <span>
              Advance Payment Mode
            </span>

            <strong>
              {repair.advancePaymentMode || '-'}
            </strong>

          </div>


          <div className="receipt-cost-row">

            <span>
              Discount
            </span>

            <strong>
              ₹ {repair.discountAmount || 0}
            </strong>

          </div>


          <div className="receipt-cost-row final-payment-row">

            <span>
              Pending Amount
            </span>

            <strong>
              ₹ {repair.pendingAmount || 0}
            </strong>

          </div>


          {repair.advanceNotes && (

            <div className="receipt-cost-row">

              <span>
                Advance Notes
              </span>

              <strong>
                {repair.advanceNotes}
              </strong>

            </div>

          )}

        </section>


        {/* DELIVERY DETAILS */}

        <section className="receipt-section">

          <h2>
            Delivery Details
          </h2>

          <div className="receipt-grid">

            <ReceiptItem
              label="Delivery Date"
              value={
                repair.deliveryDate
              }
            />

            <ReceiptItem
              label="Delivered By"
              value={
                repair.deliveredBy
              }
            />

            <ReceiptItem
              label="Status"
              value={
                repair.status
              }
            />

          </div>


          {repair.deliveryNotes && (

            <ReceiptItem
              label="Delivery Notes"
              value={
                repair.deliveryNotes
              }
            />

          )}

        </section>


        {/* FOOTER */}

        <div className="receipt-footer">

          <p>
            Thank you for choosing our workshop.
          </p>

          <p>
            Please visit us again!
          </p>

        </div>


        {/* BUTTONS */}

        <div className="receipt-actions">

          <button
            className="secondary-button"
            onClick={handleBack}
          >
            Back to Delivery
          </button>


          <button
            className="primary-button"
            onClick={handlePrint}
          >
            Print / Save as PDF
          </button>


          <button
            className="whatsapp-button"
            onClick={
              sharePdfToWhatsApp
            }
            disabled={sharing}
          >
            {sharing
              ? 'Preparing PDF...'
              : 'Share PDF via WhatsApp'}
          </button>

        </div>

      </div>

    </div>
  )
}


function ReceiptItem({
  label,
  value,
}) {
  return (
    <div className="receipt-item">

      <span>
        {label}
      </span>

      <strong>
        {value || '-'}
      </strong>

    </div>
  )
}


export default Receipt