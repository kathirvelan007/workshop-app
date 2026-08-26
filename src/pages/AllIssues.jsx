import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function AllIssues() {
  const navigate = useNavigate()
  const [repairs, setRepairs] = useState([])

  useEffect(() => {
    loadRepairs()
  }, [])

  const loadRepairs = async () => {
    const data = await db.repairs
      .orderBy('id')
      .reverse()
      .toArray()

    setRepairs(data)
  }

  return (
    <div className="page">
      <div className="issues-container">

        <div className="page-header">
          <div>
            <h1>All Issues</h1>
            <p className="subtitle">
              View all vehicle repair records
            </p>
          </div>

          {/* <button
            className="primary-button add-repair-button"
            onClick={() => navigate('/new-repair')}
          >
            + New Repair
          </button> */}
        </div>

        {repairs.length === 0 ? (
          <div className="empty-state">
            <h2>No repair records</h2>
            <p>
              No vehicle repair details have been added yet.
            </p>

            <button
              className="primary-button"
              onClick={() => navigate('/new-repair')}
            >
              Add First Repair
            </button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="issues-table">

              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Vehicle Number</th>
                  <th>Vehicle Model</th>
                  <th>Issue</th>
                  <th>Status Change</th>
                </tr>
              </thead>

              <tbody>
                {repairs.map((repair, index) => (
                  <tr key={repair.id}>
                    <td>{index + 1}</td>
                    <td>{repair.customerName}</td>
                    <td>{repair.phone}</td>
                    <td>{repair.vehicleNumber}</td>
                    <td>{repair.vehicleModel}</td>
                    <td>{repair.issue}</td>
                    <td>

                        <button
                            className="primary-button issue-edit-button"
                            onClick={() => navigate('/new-repair')}
                        >
                            Edit
                        </button> 

                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        )}

      </div>
    </div>
  )
}

export default AllIssues