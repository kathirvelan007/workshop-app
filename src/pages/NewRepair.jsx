import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function NewRepair() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    vehicleNumber: '',
    vehicleModel: '',
    issue: '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
        await db.repairs.add(formData)

        alert('Repair saved successfully!')

        setFormData({
        customerName: '',
        phone: '',
        vehicleNumber: '',
        vehicleModel: '',
        issue: '',
        })

    } catch (error) {
        console.error('Failed to save repair:', error)
        alert('Failed to save repair')
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

        <h1>New Repair</h1>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="customerName">
              Customer Name
            </label>

            <input
              id="customerName"
              name="customerName"
              type="text"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="Enter customer name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              Phone Number
            </label>

            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehicleNumber">
              Vehicle Number
            </label>

            <input
              id="vehicleNumber"
              name="vehicleNumber"
              type="text"
              value={formData.vehicleNumber}
              onChange={handleChange}
              placeholder="e.g. TN57AB1234"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="vehicleModel">
              Vehicle Model
            </label>

            <input
              id="vehicleModel"
              name="vehicleModel"
              type="text"
              value={formData.vehicleModel}
              onChange={handleChange}
              placeholder="e.g. Honda Activa"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="issue">
              Issue / Problem
            </label>

            <textarea
              id="issue"
              name="issue"
              value={formData.issue}
              onChange={handleChange}
              placeholder="Describe the vehicle issue"
              rows="4"
              required
            />
          </div>

          <button
            type="submit"
            className="primary-button full-width"
          >
            Save Repair
          </button>

        </form>
      </div>
    </div>
  )
}

export default NewRepair