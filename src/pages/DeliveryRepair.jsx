import { useEffect, useState } from 'react'
import {
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'

import { db } from '../db/database'


function getToday() {
  return new Date().toISOString().split('T')[0]
}


function DeliveryRepair() {
  const { id } = useParams()

  const navigate = useNavigate()
  const location = useLocation()

  const [repair, setRepair] = useState(null)

  const [showDeliveryPopup, setShowDeliveryPopup] =
    useState(false)

  const [formData, setFormData] = useState({
    deliveryDate: getToday(),
    deliveredBy: '',
    finalPaid: '',
    paymentMode: '',
    discountAmount: '',
    pendingAmount: 0,
    deliveryNotes: '',
  })


  useEffect(() => {
    loadRepair()
  }, [id])


  useEffect(() => {
    /*
      When returning from Receipt page,
      open the delivery success popup again.
    */
    if (location.state?.openDeliveryPopup) {
      setShowDeliveryPopup(true)

      /*
        Clear the navigation state so that
        refreshing the page doesn't repeatedly
        open the popup.
      */
      window.history.replaceState(
        {},
        document.title,
        window.location.href
      )
    }
  }, [location.state])


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
        repairData.deliveryDate || getToday(),

      deliveredBy:
        repairData.deliveredBy || '',

      finalPaid:
        repairData.finalPaid || '',

      paymentMode:
        repairData.paymentMode || '',

      discountAmount:
        repairData.discountAmount || '',

      pendingAmount:
        Number(repairData.pendingAmount) || 0,

      deliveryNotes:
        repairData.deliveryNotes || '',
    })
  }


  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }


  /*
    Total estimated amount for the repair.
  */
  const calculateTotalAmount = () => {
    return (
      Number(
        repair?.totalEstimatedAmount
      ) || 0
    )
  }


  /*
    Advance amount already received.
  */
  const calculateAdvanceAmount = () => {
    return (
      Number(
        repair?.advanceAmount
      ) || 0
    )
  }


  /*
    Amount remaining after deducting advance.
  */
  const calculateRemainingBeforeDiscount = () => {
    const totalAmount =
      calculateTotalAmount()

    const advanceAmount =
      calculateAdvanceAmount()

    return Math.max(
      totalAmount - advanceAmount,
      0
    )
  }


  /*
    Discount given at delivery.
  */
  const calculateDiscountAmount = () => {
    return (
      Number(
        formData.discountAmount
      ) || 0
    )
  }


  /*
    Amount customer needs to pay after
    advance and discount.
  */
  const calculateAmountDue = () => {
    const remainingAmount =
      calculateRemainingBeforeDiscount()

    const discount =
      calculateDiscountAmount()

    return Math.max(
      remainingAmount - discount,
      0
    )
  }


  /*
    Amount paid by customer at delivery.
  */
  const calculateFinalPaid = () => {
    return (
      Number(
        formData.finalPaid
      ) || 0
    )
  }


  /*
    Pending amount after today's payment.

    Example:

    Total       = 2500
    Advance     = 1000
    Discount    = 200
    Amount Due  = 1300
    Final Paid  = 800

    Pending     = 500
  */
  const calculatePendingAmount = () => {
    const amountDue =
      calculateAmountDue()

    const finalPaid =
      calculateFinalPaid()

    return Math.max(
      amountDue - finalPaid,
      0
    )
  }


  const handleDiscountChange = (event) => {
    const value =
      event.target.value

    const discount =
      Number(value) || 0

    const remainingAmount =
      calculateRemainingBeforeDiscount()

    if (discount > remainingAmount) {
      setFormData((previousData) => ({
        ...previousData,
        discountAmount: value,
        pendingAmount: 0,
      }))

      return
    }

    setFormData((previousData) => ({
      ...previousData,
      discountAmount: value,
      pendingAmount:
        Math.max(
          remainingAmount -
          discount -
          (Number(
            previousData.finalPaid
          ) || 0),
          0
        ),
    }))
  }


  const handleFinalPaidChange = (event) => {
    const value =
      event.target.value

    const finalPaid =
      Number(value) || 0

    const amountDue =
      calculateAmountDue()

    setFormData((previousData) => ({
      ...previousData,
      finalPaid: value,
      pendingAmount:
        Math.max(
          amountDue - finalPaid,
          0
        ),
    }))
  }


  const handleDelivery = async () => {

    if (!formData.deliveryDate) {
      alert(
        'Delivery date is required.'
      )

      return
    }


    if (
      !formData.deliveredBy.trim()
    ) {
      alert(
        'Please enter Delivered By.'
      )

      return
    }


    const discountAmount =
      calculateDiscountAmount()

    const remainingAmount =
      calculateRemainingBeforeDiscount()


    /*
      Discount cannot be greater than
      the amount remaining after advance.
    */
    if (
      discountAmount >
      remainingAmount
    ) {
      alert(
        'Discount amount cannot be greater than the remaining amount.'
      )

      return
    }


    const amountDue =
      calculateAmountDue()

    const finalPaid =
      calculateFinalPaid()


    /*
      Customer cannot pay more than
      the amount actually due.
    */
    if (
      finalPaid >
      amountDue
    ) {
      alert(
        `Final Paid amount cannot be greater than ₹${amountDue}.`
      )

      return
    }


    /*
      If customer pays an amount now,
      payment mode is required.
    */
    if (
      finalPaid > 0 &&
      !formData.paymentMode
    ) {
      alert(
        'Please select the payment mode.'
      )

      return
    }


    const pendingAmount =
      Math.max(
        amountDue - finalPaid,
        0
      )


    const completedDate =
      new Date().toISOString()


    await db.repairs.update(
      Number(id),
      {

        /*
          Delivery details
        */
        deliveryDate:
          formData.deliveryDate,

        deliveredBy:
          formData.deliveredBy,


        /*
          Payment details
        */
        finalAmount:
          calculateTotalAmount(),

        finalAmountAfterAdvance:
          remainingAmount,

        finalPaid,

        paymentMode:
          formData.paymentMode,


        /*
          Discount and pending amount
        */
        discountAmount,

        pendingAmount,


        /*
          Additional delivery notes
        */
        deliveryNotes:
          formData.deliveryNotes,


        /*
          Repair status
        */
        status:
          'DELIVERED',

        completedDate,
      }
    )


    /*
      Update local state immediately so
      popup displays latest information.
    */
    setRepair((previousRepair) => ({
      ...previousRepair,

      deliveryDate:
        formData.deliveryDate,

      deliveredBy:
        formData.deliveredBy,

      finalAmount:
        calculateTotalAmount(),

      finalAmountAfterAdvance:
        remainingAmount,

      finalPaid,

      paymentMode:
        formData.paymentMode,

      discountAmount,

      pendingAmount,

      deliveryNotes:
        formData.deliveryNotes,

      status:
        'DELIVERED',

      completedDate,
    }))


    setFormData((previousData) => ({
      ...previousData,
      pendingAmount,
    }))


    /*
      Show success popup.
    */
    setShowDeliveryPopup(true)
  }


  /*
    Close popup and return to
    Delivery Vehicles page.
  */
  const closePopup = () => {
    setShowDeliveryPopup(false)

    navigate('/delivery-vehicles')
  }


  /*
    Open receipt.
  */
  const viewReceipt = () => {
    setShowDeliveryPopup(false)

    navigate(
      `/receipt/${id}`,
      {
        state: {
          fromDelivery: true,
        },
      }
    )
  }


  /*
    Open Receipt page with instruction
    to automatically start PDF sharing.
  */
  const sharePdfViaWhatsApp = () => {
    setShowDeliveryPopup(false)

    navigate(
      `/receipt/${id}`,
      {
        state: {
          autoShareWhatsApp: true,
          fromDelivery: true,
        },
      }
    )
  }


  if (!repair) {
    return (
      <div className="page">

        <h2>
          Loading...
        </h2>

      </div>
    )
  }


  const totalAmount =
    calculateTotalAmount()

  const advanceAmount =
    calculateAdvanceAmount()

  const remainingBeforeDiscount =
    calculateRemainingBeforeDiscount()

  const discountAmount =
    calculateDiscountAmount()

  const amountDue =
    calculateAmountDue()

  const finalPaid =
    calculateFinalPaid()

  const pendingAmount =
    calculatePendingAmount()


  return (
    <div className="page">

      <div className="job-card-container">


        {/* =========================
            HEADER
        ========================== */}

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

            <span className="status-badge">
              {repair.status}
            </span>

          </div>

        </div>



        {/* =========================
            SET 1
        ========================== */}

        <section className="form-section">

          <h2>
            Customer and Vehicle Details
          </h2>


          <div className="details-grid">

            <Detail
              label="Customer Name"
              value={
                repair.customerName
              }
            />

            <Detail
              label="Mobile Number"
              value={
                repair.mobileNumber
              }
            />

            <Detail
              label="Bike Number"
              value={
                repair.bikeNumber
              }
            />

            <Detail
              label="Bike Model"
              value={
                repair.bikeModel
              }
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
              value={
                repair.fuelLevel
              }
            />

          </div>

        </section>



        {/* =========================
            SET 2
        ========================== */}

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



        {/* =========================
            SET 3
        ========================== */}

        <section className="form-section">

          <h2>
            Customer Complaints
          </h2>


          <ul>

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



        {/* =========================
            SET 4
        ========================== */}

        <section className="form-section">

          <h2>
            Inspection Checklist
          </h2>


          <div className="details-grid">

            <Detail
              label="Toolkit / First Aid"
              value={
                repair.toolkitFirstAid
              }
            />

            <Detail
              label="Helmet Left"
              value={
                repair.helmetLeft
              }
            />

            <Detail
              label="Body Condition"
              value={
                repair.bodyCondition
              }
            />

            <Detail
              label="Rear View Mirrors"
              value={
                repair.rearViewMirrors
              }
            />

            <Detail
              label="Indicator and Horn"
              value={
                repair.indicatorHorn
              }
            />

            <Detail
              label="Battery Condition"
              value={
                repair.batteryCondition
              }
            />

          </div>

        </section>



        {/* =========================
            SET 5
        ========================== */}

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
              value={`₹ ${totalAmount}`}
            />

          </div>

        </section>



        {/* =========================
            ADVANCE PAYMENT
        ========================== */}

        <section className="form-section">

          <h2>
            Advance Payment
          </h2>


          <div className="details-grid">

            <Detail
              label="Advance Amount"
              value={`₹ ${advanceAmount}`}
            />

            <Detail
              label="Advance Payment Date"
              value={
                repair.advanceDate || '-'
              }
            />

            <Detail
              label="Advance Payment Mode"
              value={
                repair.advancePaymentMode || '-'
              }
            />

            <Detail
              label="Advance Notes"
              value={
                repair.advanceNotes || '-'
              }
            />

            <Detail
              label="Remaining Before Discount"
              value={`₹ ${remainingBeforeDiscount}`}
            />

          </div>

        </section>



        {/* =========================
            SET 6
        ========================== */}

        <section className="form-section">

          <h2>
            6. Final Delivery and Payment
          </h2>


          <div className="form-grid">


            {/* DELIVERY DATE */}

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
                disabled={
                  repair.status ===
                  'DELIVERED'
                }
              />

            </div>



            {/* DELIVERED BY */}

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
                disabled={
                  repair.status ===
                  'DELIVERED'
                }
                placeholder="Enter staff name"
              />

            </div>



            {/* TOTAL AMOUNT */}

            <div className="form-group">

              <label>
                Total Amount
              </label>


              <input
                type="text"
                value={`₹ ${totalAmount}`}
                disabled
              />

            </div>



            {/* ADVANCE */}

            <div className="form-group">

              <label>
                Advance Paid
              </label>


              <input
                type="text"
                value={`₹ ${advanceAmount}`}
                disabled
              />

            </div>



            {/* REMAINING */}

            <div className="form-group">

              <label>
                Remaining Before Discount
              </label>


              <input
                type="text"
                value={`₹ ${remainingBeforeDiscount}`}
                disabled
              />

            </div>



            {/* DISCOUNT */}

            <div className="form-group">

              <label>
                Discount Amount
              </label>


              <input
                type="number"
                name="discountAmount"
                value={
                  formData.discountAmount
                }
                onChange={
                  handleDiscountChange
                }
                min="0"
                max={
                  remainingBeforeDiscount
                }
                disabled={
                  repair.status ===
                  'DELIVERED'
                }
                placeholder="Enter discount"
              />

            </div>



            {/* AMOUNT DUE */}

            <div className="form-group">

              <label>
                Amount Due After Discount
              </label>


              <input
                type="text"
                value={`₹ ${amountDue}`}
                disabled
              />

            </div>



            {/* FINAL PAID */}

            <div className="form-group">

              <label>
                Final Paid Now
              </label>


              <input
                type="number"
                name="finalPaid"
                value={
                  formData.finalPaid
                }
                onChange={
                  handleFinalPaidChange
                }
                min="0"
                max={amountDue}
                disabled={
                  repair.status ===
                  'DELIVERED'
                }
                placeholder="Amount paid now"
              />

            </div>



            {/* PENDING */}

            <div className="form-group">

              <label>
                Pending Amount
              </label>


              <input
                type="text"
                value={`₹ ${pendingAmount}`}
                disabled
              />

            </div>

          </div>



          {/* =========================
              PAYMENT MODE
          ========================== */}

          <div className="payment-section">

            <label className="section-label">

              Payment Mode at Delivery

            </label>


            <div className="radio-options">

              {[
                'Cash',
                'UPI/GPay',
                'Card',
              ].map(
                (mode) => (

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
                      disabled={
                        repair.status ===
                        'DELIVERED'
                      }
                    />

                    {mode}

                  </label>

                )
              )}

            </div>

          </div>



          {/* =========================
              DELIVERY NOTES
          ========================== */}

          <div className="form-group">

            <label>
              Delivery Notes
            </label>


            <textarea
              name="deliveryNotes"
              value={
                formData.deliveryNotes
              }
              onChange={
                handleChange
              }
              disabled={
                repair.status ===
                'DELIVERED'
              }
              placeholder="Example: Customer will pay remaining amount later"
              rows="3"
            />

          </div>



          {/* =========================
              PAYMENT SUMMARY
          ========================== */}

          <div className="delivery-summary">

            <div>

              <span>
                Total Amount
              </span>

              <strong>
                ₹ {totalAmount}
              </strong>

            </div>


            <div>

              <span>
                Advance Paid
              </span>

              <strong>
                ₹ {advanceAmount}
              </strong>

            </div>


            <div>

              <span>
                Discount
              </span>

              <strong>
                ₹ {discountAmount}
              </strong>

            </div>


            <div>

              <span>
                Paid Now
              </span>

              <strong>
                ₹ {finalPaid}
              </strong>

            </div>


            <div>

              <span>
                Pending Amount
              </span>

              <strong>
                ₹ {pendingAmount}
              </strong>

            </div>

          </div>



          {/* =========================
              BUTTONS
          ========================== */}

          <div className="form-actions">


            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                navigate(
                  '/delivery-vehicles'
                )
              }
            >
              Cancel
            </button>


            {repair.status !==
              'DELIVERED' && (

              <button
                type="button"
                className="primary-button"
                onClick={
                  handleDelivery
                }
              >
                Deliver Vehicle
              </button>

            )}

          </div>

        </section>

      </div>



      {/* =========================
          DELIVERY SUCCESS POPUP
      ========================== */}

      {showDeliveryPopup && (

        <div className="popup-overlay">

          <div className="delivery-popup">


            {/* CLOSE */}

            <button
              type="button"
              className="popup-close"
              onClick={
                closePopup
              }
            >
              ×
            </button>



            {/* SUCCESS ICON */}

            <div className="popup-icon">
              ✓
            </div>



            <h2>
              Vehicle Delivered Successfully
            </h2>


            <p>
              Job ID:{' '}
              <strong>
                #{repair.id}
              </strong>
            </p>


            <p>
              Vehicle:{' '}
              <strong>
                {repair.bikeNumber}
              </strong>
            </p>


            <p>
              Paid Now:{' '}
              <strong>
                ₹ {finalPaid}
              </strong>
            </p>


            <p>
              Pending Amount:{' '}
              <strong>
                ₹ {pendingAmount}
              </strong>
            </p>



            {/* POPUP BUTTONS */}

            <div className="popup-actions">


              <button
                type="button"
                className="secondary-button"
                onClick={
                  closePopup
                }
              >
                OK
              </button>


              <button
                type="button"
                className="primary-button"
                onClick={
                  viewReceipt
                }
              >
                View Receipt
              </button>


              <button
                type="button"
                className="whatsapp-button"
                onClick={
                  sharePdfViaWhatsApp
                }
              >
                Share PDF via WhatsApp
              </button>

            </div>

          </div>

        </div>

      )}

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