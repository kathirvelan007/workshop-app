import { useState } from 'react'
import { db } from '../db/database'

function GetIssue() {
  const [bikeNumber, setBikeNumber] =
    useState('')

  const [repair, setRepair] =
    useState(null)

  const [searched, setSearched] =
    useState(false)


  const handleSearch = async () => {
    const searchValue =
      bikeNumber.trim()

    if (!searchValue) {
      alert(
        'Please enter a bike number'
      )

      return
    }

    const result =
      await db.repairs
        .where('bikeNumber')
        .equals(searchValue)
        .last()

    setRepair(result || null)

    setSearched(true)
  }


  return (
    <div className="page">

      <div className="job-card-container">

        <h1>
          Get Vehicle Details
        </h1>


        <div className="search-container">

          <input
            type="text"
            placeholder="Enter Bike Number"
            value={bikeNumber}
            onChange={(event) =>
              setBikeNumber(
                event.target.value
              )
            }
          />


          <button
            onClick={handleSearch}
          >
            Search
          </button>

        </div>


        {searched && !repair && (

          <p className="not-found">
            No repair found for this bike.
          </p>

        )}


        {repair && (

          <div className="repair-details">


            <div className="job-card-header">

              <div>
                <h2>
                  Job Card #{repair.id}
                </h2>

                <p>
                  Status:{' '}

                  <strong>
                    {repair.status}
                  </strong>
                </p>
              </div>

            </div>



            {/* CUSTOMER */}

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
                  label="Bike Model / Make"
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

                <Detail
                  label="Created Date"
                  value={
                    repair.createdDate
                      ? new Date(
                          repair.createdDate
                        ).toLocaleString()
                      : '-'
                  }
                />

              </div>

            </section>



            {/* WORK */}

            <section className="form-section">

              <h2>
                Type of Work Required
              </h2>

              <p>
                <strong>
                  Work:
                </strong>{' '}

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



            {/* COMPLAINTS */}

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



            {/* INSPECTION */}

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



            {/* COST */}

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



            {/* DELIVERY */}

            <section className="form-section">

              <h2>
                Final Delivery and Payment
              </h2>

              <div className="details-grid">

                <Detail
                  label="Delivery Date"
                  value={
                    repair.deliveryDate
                  }
                />

                <Detail
                  label="Delivered By"
                  value={
                    repair.deliveredBy
                  }
                />

                <Detail
                  label="Final Amount"
                  value={
                    repair.finalAmount
                      ? `₹ ${repair.finalAmount}`
                      : '-'
                  }
                />

                <Detail
                  label="Amount After Advance"
                  value={
                    repair.finalAmountAfterAdvance
                      ? `₹ ${repair.finalAmountAfterAdvance}`
                      : '-'
                  }
                />

                <Detail
                  label="Final Paid"
                  value={
                    repair.finalPaid
                      ? `₹ ${repair.finalPaid}`
                      : '-'
                  }
                />

                <Detail
                  label="Payment Mode"
                  value={
                    repair.paymentMode
                  }
                />

              </div>

            </section>

          </div>

        )}

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


export default GetIssue