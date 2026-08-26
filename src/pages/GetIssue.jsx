import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function GetIssue() {
  const navigate = useNavigate()

  const [vehicleNumber, setVehicleNumber] = useState('')
  const [repair, setRepair] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = async (event) => {
    event.preventDefault()

    setRepair(null)
    setError('')

    const result = await db.repairs
      .where('vehicleNumber')
      .equalsIgnoreCase(vehicleNumber.trim())
      .first()

    if (result) {
      setRepair(result)
    } else {
      setError('No repair found for this vehicle number.')
    }
  }

  return (
    <div className="page">
      <div className="form-container">

        <button
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← Back
        </button>

        <h1>Get Issue</h1>

        <form onSubmit={handleSearch}>

          <div className="form-group">
            <label htmlFor="vehicleNumber">
              Vehicle Number
            </label>

            <input
              id="vehicleNumber"
              type="text"
              value={vehicleNumber}
              onChange={(event) =>
                setVehicleNumber(event.target.value)
              }
              placeholder="e.g. TN57AB1234"
              required
            />
          </div>

          <button
            type="submit"
            className="primary-button full-width"
          >
            Search
          </button>

        </form>

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        {repair && (
          <div className="repair-details">

            <h2>Vehicle Details</h2>

            <div className="detail-row">
              <strong>Customer:</strong>
              <span>{repair.customerName}</span>
            </div>

            <div className="detail-row">
              <strong>Phone:</strong>
              <span>{repair.phone}</span>
            </div>

            <div className="detail-row">
              <strong>Vehicle Number:</strong>
              <span>{repair.vehicleNumber}</span>
            </div>

            <div className="detail-row">
              <strong>Vehicle Model:</strong>
              <span>{repair.vehicleModel}</span>
            </div>

            <div className="detail-row">
              <strong>Issue:</strong>
              <span>{repair.issue}</span>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

export default GetIssue