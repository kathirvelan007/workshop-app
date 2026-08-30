import { useEffect, useState } from 'react'
import {
  useNavigate,
  useParams,
} from 'react-router-dom'

import { db } from '../db/database'


function DeliveryRepair() {
  const { id } = useParams()

  const navigate = useNavigate()

  const [repair, setRepair] =
    useState(null)

  const [formData, setFormData] =
    useState({
      deliveryDate: '',
      deliveredBy: '',
      finalPaid: '',
      paymentMode: '',
    })


  useEffect(() => {
    loadRepair()
  }, [])


  const loadRepair = async () => {
    const repairData =
      await db.repairs.get(Number(id))

    if (!repairData) {
      alert('Repair not found')

      navigate('/')

      return
    }

    setRepair(repairData)

    setFormData({
      deliveryDate:
        repairData.deliveryDate || '',

      deliveredBy:
        repairData.deliveredBy || '',

      finalPaid:
        repairData.finalPaid || '',

      paymentMode:
        repairData.paymentMode || '',
    })
  }


  const handleChange = (event) => {
    const { name, value } =
      event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }


  const calculateFinalAmount = () => {
    return (
      Number(
        repair?.totalEstimatedAmount
      ) || 0
    )
  }


  const calculateFinalBalance = () => {
    const finalAmount =
      calculateFinalAmount()

    const advance =
      Number(
        repair?.advanceAmount
      ) || 0

    return Math.max(
      finalAmount - advance,
      0
    )
  }


  const isPaymentCompleted = () => {
    const finalPaid =
      Number(formData.finalPaid) || 0

    const amountToPay =
      calculateFinalBalance()

    return (
      finalPaid === amountToPay &&
      amountToPay >= 0
    )
  }


  const handleDelivery = async () => {
    if (!isPaymentCompleted()) {
      alert(
        'Final Paid amount must match the remaining amount.'
      )

      return
    }

    await db.repairs.update(
      Number(id),
      {
        ...formData,

        finalAmount:
          calculateFinalAmount(),

        finalAmountAfterAdvance:
          calculateFinalBalance(),

        status:
          'DELIVERED',

        completedDate:
          new Date().toISOString(),
      }
    )

    navigate(`/receipt/${id}`)
  }


  if (!repair) {
    return (
      <div className="page">
        <h2>Loading...</h2>
      </div>
    )
  }


  return (
    <div className="page">

      <div className="job-card-container">

        <div className="job-card-header">

          <div>
            <h1>
              Delivery and Payment
            </h1>

            <p>
              Job ID: {repair.id}
            </p>
          </div>


          <div>
            <span
              className="status-badge"
            >
              {repair.status}
            </span>
          </div>

        </div>


        {/* SETS 1 TO 5 READ ONLY */}

        <section className="form-section">

          <h2>
            Customer and Vehicle Details
          </h2>

          <div className="details-grid">

            <Detail
              label="Customer Name"
              value={repair.customerName}
            />

            <Detail
              label="Mobile Number"
              value={repair.mobileNumber}
            />

            <Detail
              label="Bike Number"
              value={repair.bikeNumber}
            />

            <Detail
              label="Bike Model"
              value={repair.bikeModel}
            />

            <Detail
              label="Odometer"
              value={
                repair.odoMeter
                  ? `${repair.odoMeter} KM`
                  : '-'
              }
            />

            <Detail
              label="Fuel Level"
              value={repair.fuelLevel}
            />

          </div>

        </section>



        <section className="form-section">

          <h2>
            Type of Work Required
          </h2>

          <p>
            {repair.workRequired?.join(
              ', '
            ) || '-'}
          </p>


          {repair.otherWork && (
            <p>
              <strong>
                Other Work:
              </strong>{' '}
              {repair.otherWork}
            </p>
          )}

        </section>



        <section className="form-section">

          <h2>
            Customer Complaints
          </h2>

          <ul>

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



        <section className="form-section">

          <h2>
            Inspection Checklist
          </h2>

          <div className="details-grid">

            <Detail
              label="Toolkit / First Aid"
              value={repair.toolkitFirstAid}
            />

            <Detail
              label="Helmet Left"
              value={repair.helmetLeft}
            />

            <Detail
              label="Body Condition"
              value={repair.bodyCondition}
            />

            <Detail
              label="Rear View Mirrors"
              value={repair.rearViewMirrors}
            />

            <Detail
              label="Indicator and Horn"
              value={repair.indicatorHorn}
            />

            <Detail
              label="Battery Condition"
              value={repair.batteryCondition}
            />

          </div>

        </section>



        <section className="form-section">

          <h2>
            Cost Estimation
          </h2>

          <div className="details-grid">

            <Detail
              label="Service Spares"
              value={`₹ ${repair.serviceSpares || 0}`}
            />

            <Detail
              label="Service Labour"
              value={`₹ ${repair.serviceLabour || 0}`}
            />

            <Detail
              label="Service Total"
              value={`₹ ${repair.serviceTotal || 0}`}
            />

            <Detail
              label="Additional Spares"
              value={`₹ ${repair.additionalSpares || 0}`}
            />

            <Detail
              label="Additional Labour"
              value={`₹ ${repair.additionalLabour || 0}`}
            />

            <Detail
              label="Additional Total"
              value={`₹ ${repair.additionalTotal || 0}`}
            />

            <Detail
              label="Total Estimated Amount"
              value={`₹ ${repair.totalEstimatedAmount || 0}`}
            />

            <Detail
              label="Advance Amount"
              value={`₹ ${repair.advanceAmount || 0}`}
            />

            <Detail
              label="Remaining Amount"
              value={`₹ ${repair.remainingEstimatedAmount || 0}`}
            />

          </div>

        </section>



        {/* SET 6 ENABLED */}

        <section className="form-section">

          <h2>
            6. Final Delivery and Payment
          </h2>


          <div className="form-grid">

            <div className="form-group">

              <label>
                Delivery Date
              </label>

              <input
                type="date"
                name="deliveryDate"
                value={
                  formData.deliveryDate
                }
                onChange={handleChange}
              />

            </div>


            <div className="form-group">

              <label>
                Delivered By
              </label>

              <input
                type="text"
                name="deliveredBy"
                value={
                  formData.deliveredBy
                }
                onChange={handleChange}
              />

            </div>


            <div className="form-group">

              <label>
                Final Amount
              </label>

              <input
                type="text"
                value={`₹ ${calculateFinalAmount()}`}
                disabled
              />

            </div>


            <div className="form-group">

              <label>
                Final Amount After Deducting Advance
              </label>

              <input
                type="text"
                value={`₹ ${calculateFinalBalance()}`}
                disabled
              />

            </div>


            <div className="form-group">

              <label>
                Final Paid
              </label>

              <input
                type="number"
                name="finalPaid"
                value={
                  formData.finalPaid
                }
                onChange={handleChange}
                min="0"
              />

            </div>

          </div>


          <div className="payment-section">

            <label className="section-label">
              Payment Mode
            </label>


            <div className="radio-options">

              {[
                'Cash',
                'UPI/GPay',
                'Card',
              ].map((mode) => (

                <label
                  className="radio-item"
                  key={mode}
                >

                  <input
                    type="radio"
                    name="paymentMode"
                    value={mode}

                    checked={
                      formData.paymentMode ===
                      mode
                    }

                    onChange={
                      handleChange
                    }
                  />

                  {mode}

                </label>

              ))}

            </div>

          </div>


          {formData.finalPaid !== '' && (

            isPaymentCompleted() ? (

              <p className="payment-success">
                ✓ Payment completed.
                Receipt can be generated.
              </p>

            ) : (

              <p className="payment-pending">
                Final Paid must equal ₹{' '}
                {calculateFinalBalance()}
              </p>

            )

          )}


          <div className="form-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate('/')
              }
            >
              Cancel
            </button>


            <button
              type="button"
              className="receipt-button"
              disabled={
                !isPaymentCompleted()
              }
              onClick={
                handleDelivery
              }
            >
              View Receipt
            </button>

          </div>

        </section>

      </div>

    </div>
  )
}


function Detail({
  label,
  value,
}) {
  return (
    <div className="detail-item">

      <span>
        {label}
      </span>

      <strong>
        {value || '-'}
      </strong>

    </div>
  )
}


export default DeliveryRepair