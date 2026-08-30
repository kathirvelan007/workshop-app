import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function NewRepair() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    customerName: '',
    mobileNumber: '',
    bikeNumber: '',
    bikeModel: '',
    odoMeter: '',
    fuelLevel: '',

    workRequired: [],
    otherWork: '',

    complaints: [''],

    toolkitFirstAid: '',
    helmetLeft: '',
    bodyCondition: '',
    rearViewMirrors: '',
    indicatorHorn: '',
    batteryCondition: '',

    serviceSpares: '',
    serviceLabour: '',
    additionalSpares: '',
    additionalLabour: '',

    advanceAmount: '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))
  }

  const handleWorkChange = (event) => {
    const { value, checked } = event.target

    setFormData((previousData) => {
      const updatedWork = checked
        ? [...previousData.workRequired, value]
        : previousData.workRequired.filter(
            (work) => work !== value
          )

      return {
        ...previousData,
        workRequired: updatedWork,
        otherWork:
          value === 'Others' && !checked
            ? ''
            : previousData.otherWork,
      }
    })
  }

  const handleComplaintChange = (index, value) => {
    const updatedComplaints = [...formData.complaints]

    updatedComplaints[index] = value

    setFormData((previousData) => ({
      ...previousData,
      complaints: updatedComplaints,
    }))
  }

  const addComplaint = () => {
    setFormData((previousData) => ({
      ...previousData,
      complaints: [...previousData.complaints, ''],
    }))
  }

  const removeComplaint = (index) => {
    if (formData.complaints.length === 1) {
      return
    }

    setFormData((previousData) => ({
      ...previousData,
      complaints: previousData.complaints.filter(
        (_, complaintIndex) =>
          complaintIndex !== index
      ),
    }))
  }

  const calculateServiceTotal = () => {
    const spares =
      Number(formData.serviceSpares) || 0

    const labour =
      Number(formData.serviceLabour) || 0

    return spares + labour
  }

  const calculateAdditionalTotal = () => {
    const spares =
      Number(formData.additionalSpares) || 0

    const labour =
      Number(formData.additionalLabour) || 0

    return spares + labour
  }

  const calculateTotalEstimate = () => {
    return (
      calculateServiceTotal() +
      calculateAdditionalTotal()
    )
  }

  const calculateRemainingAmount = () => {
    const total =
      calculateTotalEstimate()

    const advance =
      Number(formData.advanceAmount) || 0

    return Math.max(total - advance, 0)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const filteredComplaints =
      formData.complaints
        .map((complaint) =>
          complaint.trim()
        )
        .filter(
          (complaint) =>
            complaint !== ''
        )

    const repairData = {
      ...formData,

      complaints:
        filteredComplaints.join(' || '),

      createdDate:
        new Date().toISOString(),

      status:
        'IN_PROGRESS',

      serviceTotal:
        calculateServiceTotal(),

      additionalTotal:
        calculateAdditionalTotal(),

      totalEstimatedAmount:
        calculateTotalEstimate(),

      remainingEstimatedAmount:
        calculateRemainingAmount(),

      deliveryDate: '',
      deliveredBy: '',
      finalAmount: '',
      finalAmountAfterAdvance: '',
      finalPaid: '',
      paymentMode: '',
    }

    await db.repairs.add(repairData)

    alert('Repair saved successfully')

    navigate('/')
  }

  return (
    <div className="page">
      <div className="job-card-container">

        <div className="job-card-header">
          <div>
            <h1>New Repair</h1>
            <p>Create a new workshop job card</p>
          </div>

          <div className="auto-details">
            <div>
              <span>Date</span>
              <strong>
                {new Date().toLocaleDateString()}
              </strong>
            </div>

            <div>
              <span>Job ID</span>
              <strong>Auto Generated</strong>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>

          {/* SET 1 */}

          <section className="form-section">
            <h2>
              1. Customer and Vehicle Details
            </h2>

            <div className="form-grid">

              <div className="form-group">
                <label>Customer Name *</label>

                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile Number *</label>

                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Bike Number *</label>

                <input
                  type="text"
                  name="bikeNumber"
                  value={formData.bikeNumber}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Bike Model / Make</label>

                <input
                  type="text"
                  name="bikeModel"
                  value={formData.bikeModel}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Odometer (KM)</label>

                <input
                  type="number"
                  name="odoMeter"
                  value={formData.odoMeter}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>Fuel Level</label>

                <select
                  name="fuelLevel"
                  value={formData.fuelLevel}
                  onChange={handleChange}
                >
                  <option value="">
                    Select Fuel Level
                  </option>

                  <option value="E">E</option>
                  <option value="1/4">1/4</option>
                  <option value="1/2">1/2</option>
                  <option value="3/4">3/4</option>
                  <option value="F">F</option>
                </select>
              </div>

            </div>
          </section>


          {/* SET 2 */}

          <section className="form-section">
            <h2>
              2. Type of Work Required
            </h2>

            <div className="checkbox-grid">

              {[
                'General Service',
                'Oil Change Only',
                'Welding/Lathe Work',
                'Brake/Suspension',
                'Engine Repair/Overhaul',
                'Electrical/Wiring Work',
                'Others',
              ].map((work) => (

                <label
                  className="checkbox-item"
                  key={work}
                >
                  <input
                    type="checkbox"
                    value={work}
                    checked={
                      formData.workRequired.includes(
                        work
                      )
                    }
                    onChange={handleWorkChange}
                  />

                  {work}
                </label>

              ))}

            </div>

            {formData.workRequired.includes(
              'Others'
            ) && (
              <div className="form-group other-work-input">
                <label>
                  Other Work Required
                </label>

                <input
                  type="text"
                  name="otherWork"
                  value={formData.otherWork}
                  onChange={handleChange}
                />
              </div>
            )}

          </section>


          {/* SET 3 */}

          <section className="form-section">
            <h2>
              3. Customer Complaints / Demands
            </h2>

            {formData.complaints.map(
              (complaint, index) => (

                <div
                  className="complaint-row"
                  key={index}
                >
                  <input
                    type="text"
                    value={complaint}
                    placeholder={`Complaint ${index + 1}`}
                    onChange={(event) =>
                      handleComplaintChange(
                        index,
                        event.target.value
                      )
                    }
                  />

                  {formData.complaints.length > 1 && (
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() =>
                        removeComplaint(index)
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>

              )
            )}

            <button
              type="button"
              className="add-complaint-button"
              onClick={addComplaint}
            >
              + Add Complaint
            </button>

          </section>


          {/* SET 4 */}

          <section className="form-section">
            <h2>
              4. Inspection Checklist
            </h2>

            <div className="inspection-grid">

              <RadioGroup
                label="Toolkit / First Aid"
                name="toolkitFirstAid"
                options={['Yes', 'No']}
                value={formData.toolkitFirstAid}
                onChange={handleChange}
              />

              <RadioGroup
                label="Helmet Left"
                name="helmetLeft"
                options={['Yes', 'No']}
                value={formData.helmetLeft}
                onChange={handleChange}
              />

              <RadioGroup
                label="Body Condition"
                name="bodyCondition"
                options={[
                  'Normal',
                  'Scratches',
                ]}
                value={formData.bodyCondition}
                onChange={handleChange}
              />

              <RadioGroup
                label="Rear View Mirrors"
                name="rearViewMirrors"
                options={[
                  'OK',
                  'Missing',
                ]}
                value={formData.rearViewMirrors}
                onChange={handleChange}
              />

              <RadioGroup
                label="Indicator and Horn"
                name="indicatorHorn"
                options={[
                  'Working',
                  'Faulty',
                ]}
                value={formData.indicatorHorn}
                onChange={handleChange}
              />

              <RadioGroup
                label="Battery Condition"
                name="batteryCondition"
                options={[
                  'Good',
                  'Weak',
                ]}
                value={formData.batteryCondition}
                onChange={handleChange}
              />

            </div>
          </section>


          {/* SET 5 */}

          <section className="form-section">
            <h2>
              5. Cost Estimation
            </h2>

            <div className="cost-table">

              <div className="cost-header">
                <span>Description</span>
                <span>Spares (₹)</span>
                <span>Labour (₹)</span>
                <span>Total (₹)</span>
              </div>

              <div className="cost-row">
                <span>
                  General Service / Welding Charges
                </span>

                <input
                  type="number"
                  name="serviceSpares"
                  value={formData.serviceSpares}
                  onChange={handleChange}
                  min="0"
                />

                <input
                  type="number"
                  name="serviceLabour"
                  value={formData.serviceLabour}
                  onChange={handleChange}
                  min="0"
                />

                <strong>
                  ₹ {calculateServiceTotal()}
                </strong>
              </div>

              <div className="cost-row">
                <span>
                  Additional Repair / Parts
                </span>

                <input
                  type="number"
                  name="additionalSpares"
                  value={formData.additionalSpares}
                  onChange={handleChange}
                  min="0"
                />

                <input
                  type="number"
                  name="additionalLabour"
                  value={formData.additionalLabour}
                  onChange={handleChange}
                  min="0"
                />

                <strong>
                  ₹ {calculateAdditionalTotal()}
                </strong>
              </div>

            </div>

            <div className="amount-summary">

              <div>
                <span>
                  Total Estimated Amount
                </span>

                <strong>
                  ₹ {calculateTotalEstimate()}
                </strong>
              </div>

              <div className="form-group">
                <label>
                  Advance Amount
                </label>

                <input
                  type="number"
                  name="advanceAmount"
                  value={formData.advanceAmount}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <div>
                <span>
                  Remaining Amount
                </span>

                <strong>
                  ₹ {calculateRemainingAmount()}
                </strong>
              </div>

            </div>

          </section>


          <div className="form-actions">

            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
            >
              Save Repair
            </button>

          </div>

        </form>

      </div>
    </div>
  )
}


function RadioGroup({
  label,
  name,
  options,
  value,
  onChange,
}) {
  return (
    <div className="inspection-item">

      <span className="inspection-label">
        {label}
      </span>

      <div className="radio-options">

        {options.map((option) => (
          <label
            className="radio-item"
            key={option}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={onChange}
            />

            {option}
          </label>
        ))}

      </div>

    </div>
  )
}

export default NewRepair