import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function DeliveryVehicle() {
  const navigate = useNavigate()

  const [repairs, setRepairs] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadPendingRepairs()
  }, [])

  const loadPendingRepairs = async () => {
    const allRepairs = await db.repairs.toArray()

    const pendingRepairs = allRepairs.filter(
      (repair) => repair.status === 'IN_PROGRESS'
    )

    setRepairs(pendingRepairs)
  }

  // Dynamic filtering based on bike number
  const filteredRepairs = repairs.filter((repair) =>
    repair.bikeNumber
      ?.toLowerCase()
      .includes(search.toLowerCase())
  )

  const handleDeliver = (id) => {
    navigate(`/delivery/${id}`)
  }

  return (
    <div className="page">

      <div className="delivery-container">

        <div className="page-header">
          <div>
            <h1>Delivery Vehicles</h1>
            <p>
              Vehicles pending for delivery
            </p>
          </div>

          <div className="pending-count">
            Pending: {filteredRepairs.length}
          </div>
        </div>


        {/* SEARCH */}

        <div className="delivery-search">

          <input
            type="text"
            placeholder="Search by bike number..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>


        {/* TABLE */}

        {filteredRepairs.length === 0 ? (

          <div className="no-delivery">

            {search ? (
              <p>
                No pending vehicle found for
                "{search}".
              </p>
            ) : (
              <p>
                No vehicles are pending for delivery.
              </p>
            )}

          </div>

        ) : (

          <div className="table-wrapper">

            <table className="delivery-table">

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Customer Name</th>
                  <th>Bike Number</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>

              </thead>


              <tbody>

                {filteredRepairs.map(
                  (repair) => (

                    <tr key={repair.id}>

                      <td>
                        {repair.id}
                      </td>

                      <td>
                        {repair.customerName}
                      </td>

                      <td>
                        <strong>
                          {repair.bikeNumber}
                        </strong>
                      </td>

                      <td>
                        {repair.bikeModel || '-'}
                      </td>

                      <td>

                        <span className="status-badge pending">
                          Pending
                        </span>

                      </td>

                      <td>

                        <button
                          className="deliver-button"
                          onClick={() =>
                            handleDeliver(
                              repair.id
                            )
                          }
                        >
                          Deliver
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  )
}

export default DeliveryVehicle