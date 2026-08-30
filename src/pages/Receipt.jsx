import { useEffect, useState } from 'react'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import { db } from '../db/database'


function Receipt() {
  const { id } = useParams()

  const navigate = useNavigate()

  const [repair, setRepair] =
    useState(null)


  useEffect(() => {
    loadRepair()
  }, [])


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


  if (!repair) {
    return (
      <div className="page">
        <h2>Loading receipt...</h2>
      </div>
    )
  }


  return (
    <div className="page receipt-page">

      <div className="receipt-container">

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
              value={repair.customerName}
            />

            <ReceiptItem
              label="Mobile Number"
              value={repair.mobileNumber}
            />

            <ReceiptItem
              label="Vehicle Number"
              value={repair.bikeNumber}
            />

            <ReceiptItem
              label="Vehicle Model"
              value={repair.bikeModel}
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
              value={repair.otherWork}
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
              Final Amount
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


          <div className="receipt-cost-row final-payment-row">

            <span>
              Amount Paid Now
            </span>

            <strong>
              ₹ {repair.finalPaid || 0}
            </strong>

          </div>

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
              label="Payment Mode"
              value={
                repair.paymentMode
              }
            />

            <ReceiptItem
              label="Status"
              value={
                repair.status
              }
            />

          </div>

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
            onClick={() =>
              navigate('/')
            }
          >
            Back to Home
          </button>


          <button
            className="primary-button"
            onClick={handlePrint}
          >
            Print / Save as PDF
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