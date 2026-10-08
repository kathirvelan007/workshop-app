import { useEffect, useState } from 'react'
import { db } from '../db/database'
import './Analyze.css'

function Analyze() {
  const getToday = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const [fromDate, setFromDate] = useState(getToday())
  const [toDate, setToDate] = useState(getToday())

  const [allRepairs, setAllRepairs] = useState([])

  const [summary, setSummary] = useState({
    received: 0,
    delivered: 0,
    pending: 0,

    totalEarned: 0,
    totalAdvance: 0,
    totalCollected: 0,

    averageBill: 0,

    cash: 0,
    upi: 0,
    card: 0,

    advanceCash: 0,
    advanceUpi: 0,
    advanceCard: 0,

    finalCash: 0,
    finalUpi: 0,
    finalCard: 0,
  })

  const [receivedVehicles, setReceivedVehicles] = useState([])
  const [deliveredVehicles, setDeliveredVehicles] = useState([])
  const [advancePayments, setAdvancePayments] = useState([])


  const loadRepairs = async () => {
    try {
      const repairs = await db.repairs.toArray()

      setAllRepairs(repairs)
    } catch (error) {
      console.error(
        'Error loading repairs:',
        error
      )
    }
  }

  const resetDashboard = () => {
    setSummary({
      received: 0,
      delivered: 0,
      pending: 0,

      totalEarned: 0,
      totalAdvance: 0,
      totalCollected: 0,

      averageBill: 0,

      cash: 0,
      upi: 0,
      card: 0,

      advanceCash: 0,
      advanceUpi: 0,
      advanceCard: 0,

      finalCash: 0,
      finalUpi: 0,
      finalCard: 0,
    })

    setReceivedVehicles([])
    setDeliveredVehicles([])
    setAdvancePayments([])
  }

  const getDateOnly = (dateValue) => {
    if (!dateValue) {
      return ''
    }

    /*
     * Date fields coming from the HTML date input
     * are already YYYY-MM-DD.
     */
    if (
      typeof dateValue === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
      return dateValue
    }

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) {
      return ''
    }

    return date.toISOString().split('T')[0]
  }

  const isDateInRange = (dateValue) => {
    const date = getDateOnly(dateValue)

    if (!date) {
      return false
    }

    return date >= fromDate && date <= toDate
  }

  const analyzeData = () => {
    if (!fromDate || !toDate) {
      return
    }

    if (fromDate > toDate) {
      resetDashboard()
      return
    }

    // ---------------------------------------
    // Vehicles Received
    // Based on createdDate
    // ---------------------------------------

    const received = allRepairs.filter((repair) =>
      isDateInRange(repair.createdDate)
    )

    // ---------------------------------------
    // Vehicles Delivered
    // Based on completedDate
    // ---------------------------------------

    const delivered = allRepairs.filter(
      (repair) =>
        repair.status === 'DELIVERED' &&
        isDateInRange(repair.completedDate)
    )

    // ---------------------------------------
    // Currently Pending Vehicles
    // ---------------------------------------

    const pending = allRepairs.filter(
      (repair) =>
        repair.status === 'IN_PROGRESS'
    )

    // ---------------------------------------
    // Advance Payments
    //
    // IMPORTANT:
    // Advance is filtered using advanceDate,
    // NOT createdDate.
    // ---------------------------------------

    const advancePaymentRecords =
      allRepairs.filter((repair) => {
        const advance =
          Number(repair.advanceAmount) || 0

        return (
          advance > 0 &&
          isDateInRange(repair.advanceDate)
        )
      })

    // ---------------------------------------
    // Total Advance Collected
    // ---------------------------------------

    const totalAdvance =
      advancePaymentRecords.reduce(
        (total, repair) =>
          total +
          (Number(repair.advanceAmount) || 0),
        0
      )

    // ---------------------------------------
    // Final Payments
    // ---------------------------------------

    const totalEarned =
      delivered.reduce(
        (total, repair) =>
          total +
          (Number(repair.finalPaid) || 0),
        0
      )

    // ---------------------------------------
    // Pending Settlements Collected in Period
    // ---------------------------------------
    let pendingSettlements = []
    allRepairs.forEach((r) => {
      if (Array.isArray(r.paymentHistory)) {
        r.paymentHistory.forEach((p) => {
          if (p.type === 'PENDING_SETTLEMENT' && isDateInRange(p.date)) {
            pendingSettlements.push({ ...p, repair: r })
          }
        })
      }
    })

    const totalPendingCollected = pendingSettlements.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    )

    // ---------------------------------------
    // Total Money Collected
    // Advance + Final Payment + Pending Settlements
    // ---------------------------------------
    const totalCollected =
      totalAdvance + totalEarned + totalPendingCollected

    // ---------------------------------------
    // Average Final Bill
    // ---------------------------------------

    const averageBill =
      delivered.length > 0
        ? totalEarned / delivered.length
        : 0

    // ---------------------------------------
    // ADVANCE PAYMENT MODES
    // ---------------------------------------

    const advanceCash =
      advancePaymentRecords
        .filter(
          (repair) =>
            repair.advancePaymentMode ===
            'Cash'
        )
        .reduce(
          (total, repair) =>
            total +
            (Number(
              repair.advanceAmount
            ) || 0),
          0
        )

    const advanceUpi =
      advancePaymentRecords
        .filter(
          (repair) =>
            repair.advancePaymentMode ===
              'UPI' ||
            repair.advancePaymentMode ===
              'UPI/GPay'
        )
        .reduce(
          (total, repair) =>
            total +
            (Number(
              repair.advanceAmount
            ) || 0),
          0
        )

    const advanceCard =
      advancePaymentRecords
        .filter(
          (repair) =>
            repair.advancePaymentMode ===
            'Card'
        )
        .reduce(
          (total, repair) =>
            total +
            (Number(
              repair.advanceAmount
            ) || 0),
          0
        )

    // ---------------------------------------
    // FINAL PAYMENT MODES
    // ---------------------------------------

    const finalCash =
      delivered
        .filter(
          (repair) =>
            repair.paymentMode ===
            'Cash'
        )
        .reduce(
          (total, repair) =>
            total +
            (Number(
              repair.finalPaid
            ) || 0),
          0
        )

    const finalUpi =
      delivered
        .filter(
          (repair) =>
            repair.paymentMode ===
              'UPI' ||
            repair.paymentMode ===
              'UPI/GPay'
        )
        .reduce(
          (total, repair) =>
            total +
            (Number(
              repair.finalPaid
            ) || 0),
          0
        )

    const finalCard =
      delivered
        .filter(
          (repair) =>
            repair.paymentMode ===
            'Card'
        )
        .reduce(
          (total, repair) =>
            total +
            (Number(
              repair.finalPaid
            ) || 0),
          0
        )

    // ---------------------------------------
    // TOTAL PAYMENT MODE
    const pendingCash = pendingSettlements
      .filter((p) => p.mode === 'Cash')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    const pendingUpi = pendingSettlements
      .filter((p) => p.mode === 'UPI' || p.mode === 'UPI/GPay')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    const pendingCard = pendingSettlements
      .filter((p) => p.mode === 'Card')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0)

    const cash = advanceCash + finalCash + pendingCash
    const upi = advanceUpi + finalUpi + pendingUpi
    const card = advanceCard + finalCard + pendingCard

    // ---------------------------------------
    // Update Summary
    // ---------------------------------------

    setSummary({
      received: received.length,
      delivered: delivered.length,
      pending: pending.length,

      totalEarned,
      totalAdvance,
      totalCollected,

      averageBill,

      cash,
      upi,
      card,

      advanceCash,
      advanceUpi,
      advanceCard,

      finalCash,
      finalUpi,
      finalCard,
    })

    setReceivedVehicles(received)
    setDeliveredVehicles(delivered)
    setAdvancePayments(advancePaymentRecords)
  }

  useEffect(() => {
    loadRepairs()
  }, [])

  useEffect(() => {
    analyzeData()
  }, [fromDate, toDate, allRepairs])

  const formatCurrency = (amount) => {
    return `₹${Number(
      amount || 0
    ).toLocaleString('en-IN')}`
  }

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return '-'
    }

    /*
     * Handle YYYY-MM-DD separately.
     * This avoids timezone shifting for date-only
     * values stored from <input type="date">.
     */
    if (
      typeof dateValue === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
      const [
        year,
        month,
        day,
      ] = dateValue.split('-')

      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day)
      ).toLocaleDateString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }
      )
    }

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) {
      return '-'
    }

    return date.toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    )
  }

  const handleFromDateChange = (event) => {
    setFromDate(event.target.value)
  }

  const handleToDateChange = (event) => {
    setToDate(event.target.value)
  }

  const setToday = () => {
    const today = getToday()

    setFromDate(today)
    setToDate(today)
  }

  const setThisMonth = () => {
    const today = new Date()

    const year =
      today.getFullYear()

    const month = String(
      today.getMonth() + 1
    ).padStart(2, '0')

    const firstDay =
      `${year}-${month}-01`

    const currentDay =
      today.toISOString().split('T')[0]

    setFromDate(firstDay)
    setToDate(currentDay)
  }

  return (
    <div className="analyze-page">

      {/* PAGE HEADER */}

      <div className="analyze-header">
        <div>
          <h1>
            Workshop Analysis
          </h1>

          <p>
            View workshop performance
            and payment details
          </p>
        </div>
      </div>


      {/* DATE FILTER */}

      <div className="date-filter-card">

        <div className="date-field">
          <label>
            From Date
          </label>

          <input
            type="date"
            value={fromDate}
            onChange={
              handleFromDateChange
            }
          />
        </div>

        <div className="date-field">
          <label>
            To Date
          </label>

          <input
            type="date"
            value={toDate}
            onChange={
              handleToDateChange
            }
          />
        </div>

        <div className="date-buttons">

          <button
            className="today-button"
            onClick={setToday}
          >
            Today
          </button>

          <button
            className="month-button"
            onClick={setThisMonth}
          >
            This Month
          </button>

        </div>

      </div>


      {fromDate > toDate && (
        <div className="date-error">
          From date cannot be greater
          than To date.
        </div>
      )}


      {/* SUMMARY CARDS */}

      <div className="dashboard-grid">

        {/* RECEIVED */}

        <div className="dashboard-card">

          <div className="card-title">
            Vehicles Received
          </div>

          <div className="card-value">
            {summary.received}
          </div>

          <div className="card-description">
            Vehicles entered during
            selected period
          </div>

        </div>


        {/* DELIVERED */}

        <div className="dashboard-card">

          <div className="card-title">
            Vehicles Delivered
          </div>

          <div className="card-value">
            {summary.delivered}
          </div>

          <div className="card-description">
            Vehicles delivered during
            selected period
          </div>

        </div>


        {/* PENDING */}

        <div className="dashboard-card">

          <div className="card-title">
            Pending Vehicles
          </div>

          <div className="card-value">
            {summary.pending}
          </div>

          <div className="card-description">
            Currently waiting for
            delivery
          </div>

        </div>


        {/* FINAL PAYMENTS */}

        <div className="dashboard-card money-card">

          <div className="card-title">
            Final Payments
          </div>

          <div className="card-value">
            {formatCurrency(
              summary.totalEarned
            )}
          </div>

          <div className="card-description">
            Final payments received
            during selected period
          </div>

        </div>


        {/* ADVANCE */}

        <div className="dashboard-card">

          <div className="card-title">
            Advance Collected
          </div>

          <div className="card-value">
            {formatCurrency(
              summary.totalAdvance
            )}
          </div>

          <div className="card-description">
            Advance payments received
            during selected period
          </div>

        </div>


        {/* TOTAL */}

        <div className="dashboard-card money-card">

          <div className="card-title">
            Total Collected
          </div>

          <div className="card-value">
            {formatCurrency(
              summary.totalCollected
            )}
          </div>

          <div className="card-description">
            Advance + final payments
          </div>

        </div>


        {/* AVERAGE */}

        <div className="dashboard-card">

          <div className="card-title">
            Average Final Bill
          </div>

          <div className="card-value">
            {formatCurrency(
              summary.averageBill
            )}
          </div>

          <div className="card-description">
            Average final payment per
            delivered vehicle
          </div>

        </div>

      </div>


      {/* PAYMENT SUMMARY */}

      <section className="dashboard-section">

        <div className="section-header">

          <h2>
            Payment Collection
          </h2>

          <span>
            Actual money received
            during selected period
          </span>

        </div>


        <div className="payment-grid">

          {/* CASH */}

          <div className="payment-card">

            <div className="payment-label">
              Cash
            </div>

            <div className="payment-value">
              {formatCurrency(
                summary.cash
              )}
            </div>

            <div className="payment-breakdown">
              Advance:{' '}
              {formatCurrency(
                summary.advanceCash
              )}
              <br />

              Final:{' '}
              {formatCurrency(
                summary.finalCash
              )}
            </div>

          </div>


          {/* UPI */}

          <div className="payment-card">

            <div className="payment-label">
              UPI / GPay
            </div>

            <div className="payment-value">
              {formatCurrency(
                summary.upi
              )}
            </div>

            <div className="payment-breakdown">
              Advance:{' '}
              {formatCurrency(
                summary.advanceUpi
              )}
              <br />

              Final:{' '}
              {formatCurrency(
                summary.finalUpi
              )}
            </div>

          </div>


          {/* CARD */}

          <div className="payment-card">

            <div className="payment-label">
              Card
            </div>

            <div className="payment-value">
              {formatCurrency(
                summary.card
              )}
            </div>

            <div className="payment-breakdown">
              Advance:{' '}
              {formatCurrency(
                summary.advanceCard
              )}
              <br />

              Final:{' '}
              {formatCurrency(
                summary.finalCard
              )}
            </div>

          </div>

        </div>

      </section>


      {/* ADVANCE PAYMENTS */}

      <section className="dashboard-section">

        <div className="section-header">

          <h2>
            Advance Payments
          </h2>

          <span>
            {advancePayments.length}
            {' '}payment(s)
          </span>

        </div>


        {advancePayments.length === 0 ? (

          <div className="empty-table">
            No advance payments received
            during the selected period.
          </div>

        ) : (

          <div className="analysis-table-wrapper">

            <table className="analysis-table">

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Customer Name</th>
                  <th>Bike Number</th>
                  <th>Model</th>
                  <th>Advance Date</th>
                  <th>Amount</th>
                  <th>Payment Mode</th>
                  <th>Notes</th>
                </tr>

              </thead>


              <tbody>

                {advancePayments
                  .sort(
                    (a, b) =>
                      getDateOnly(
                        b.advanceDate
                      ).localeCompare(
                        getDateOnly(
                          a.advanceDate
                        )
                      )
                  )
                  .map((repair) => (

                    <tr key={repair.id}>

                      <td>
                        {repair.id}
                      </td>

                      <td>
                        {repair.customerName ||
                          '-'}
                      </td>

                      <td>
                        <strong>
                          {repair.bikeNumber ||
                            '-'}
                        </strong>
                      </td>

                      <td>
                        {repair.bikeModel ||
                          '-'}
                      </td>

                      <td>
                        {formatDate(
                          repair.advanceDate
                        )}
                      </td>

                      <td className="amount-cell">
                        {formatCurrency(
                          repair.advanceAmount
                        )}
                      </td>

                      <td>
                        {repair.advancePaymentMode ||
                          '-'}
                      </td>

                      <td>
                        {repair.advanceNotes ||
                          '-'}
                      </td>

                    </tr>

                  ))}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* VEHICLES RECEIVED */}

      <section className="dashboard-section">

        <div className="section-header">

          <h2>
            Vehicles Received
          </h2>

          <span>
            {receivedVehicles.length}
            {' '}vehicle(s)
          </span>

        </div>


        {receivedVehicles.length === 0 ? (

          <div className="empty-table">
            No vehicles received during
            the selected period.
          </div>

        ) : (

          <div className="analysis-table-wrapper">

            <table className="analysis-table">

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Customer Name</th>
                  <th>Bike Number</th>
                  <th>Model</th>
                  <th>Received Date</th>
                  <th>Status</th>
                </tr>

              </thead>


              <tbody>

                {receivedVehicles
                  .sort(
                    (a, b) =>
                      new Date(
                        b.createdDate
                      ) -
                      new Date(
                        a.createdDate
                      )
                  )
                  .map((repair) => (

                    <tr key={repair.id}>

                      <td>
                        {repair.id}
                      </td>

                      <td>
                        {repair.customerName ||
                          '-'}
                      </td>

                      <td>
                        <strong>
                          {repair.bikeNumber ||
                            '-'}
                        </strong>
                      </td>

                      <td>
                        {repair.bikeModel ||
                          '-'}
                      </td>

                      <td>
                        {formatDate(
                          repair.createdDate
                        )}
                      </td>

                      <td>

                        {repair.status ===
                        'DELIVERED' ? (

                          <span className="status-badge delivered">
                            Delivered
                          </span>

                        ) : (

                          <span className="status-badge pending">
                            Pending
                          </span>

                        )}

                      </td>

                    </tr>

                  ))}

              </tbody>

            </table>

          </div>

        )}

      </section>


      {/* DELIVERED VEHICLES */}

      <section className="dashboard-section">

        <div className="section-header">

          <h2>
            Delivered Vehicles
          </h2>

          <span>
            {deliveredVehicles.length}
            {' '}vehicle(s)
          </span>

        </div>


        {deliveredVehicles.length === 0 ? (

          <div className="empty-table">
            No vehicles delivered during
            the selected period.
          </div>

        ) : (

          <div className="analysis-table-wrapper">

            <table className="analysis-table">

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Customer Name</th>
                  <th>Bike Number</th>
                  <th>Model</th>
                  <th>Delivery Date</th>
                  <th>Amount Paid</th>
                  <th>Payment Mode</th>
                </tr>

              </thead>


              <tbody>

                {deliveredVehicles
                  .sort(
                    (a, b) =>
                      new Date(
                        b.completedDate
                      ) -
                      new Date(
                        a.completedDate
                      )
                  )
                  .map((repair) => (

                    <tr key={repair.id}>

                      <td>
                        {repair.id}
                      </td>

                      <td>
                        {repair.customerName ||
                          '-'}
                      </td>

                      <td>
                        <strong>
                          {repair.bikeNumber ||
                            '-'}
                        </strong>
                      </td>

                      <td>
                        {repair.bikeModel ||
                          '-'}
                      </td>

                      <td>
                        {formatDate(
                          repair.completedDate
                        )}
                      </td>

                      <td className="amount-cell">
                        {formatCurrency(
                          repair.finalPaid
                        )}
                      </td>

                      <td>
                        {repair.paymentMode ||
                          '-'}
                      </td>

                    </tr>

                  ))}

              </tbody>

            </table>

          </div>

        )}

      </section>

    </div>
  )
}

export default Analyze