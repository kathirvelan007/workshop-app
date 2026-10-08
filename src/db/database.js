import Dexie from 'dexie'

export const db = new Dexie('WorkshopDB')

// Version 1: Initial schema
db.version(1).stores({
  repairs: '++id, customerName, phone, vehicleNumber, vehicleModel, issue',
})

// Version 2: Standardized vehicle & mobile fields
db.version(2).stores({
  repairs: '++id, customerName, mobileNumber, bikeNumber, createdDate',
})

// Version 3: Added status index
db.version(3).stores({
  repairs: '++id, customerName, mobileNumber, bikeNumber, createdDate, status',
})

// Version 4: Indexed date & financial fields for optimized queries + legacy data normalization
db.version(4)
  .stores({
    repairs:
      '++id, customerName, mobileNumber, bikeNumber, createdDate, status, deliveryDate, advanceDate, pendingAmount',
  })
  .upgrade((tx) => {
    // Seamless data normalization for any records created under older schema versions
    return tx.repairs.toCollection().modify((repair) => {
      // Normalize mobile number
      if (!repair.mobileNumber && repair.phone) {
        repair.mobileNumber = repair.phone
      }
      // Normalize vehicle registration plate
      if (!repair.bikeNumber && repair.vehicleNumber) {
        repair.bikeNumber = repair.vehicleNumber
      }
      // Normalize vehicle model
      if (!repair.bikeModel && repair.vehicleModel) {
        repair.bikeModel = repair.vehicleModel
      }
      // Normalize pending balance
      if (repair.pendingAmount === undefined && repair.balance !== undefined) {
        repair.pendingAmount = Number(repair.balance) || 0
      }
      // Ensure payment history array is initialized
      if (!Array.isArray(repair.paymentHistory)) {
        repair.paymentHistory = []
        if (Number(repair.advanceAmount) > 0) {
          repair.paymentHistory.push({
            id: 1,
            date: repair.advanceDate || repair.createdDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            amount: Number(repair.advanceAmount),
            mode: repair.advancePaymentMode || 'Cash',
            type: 'ADVANCE',
            notes: repair.advanceNotes || 'Advance deposit',
          })
        }
        if (Number(repair.finalPaid) > 0) {
          repair.paymentHistory.push({
            id: 2,
            date: repair.deliveryDate || new Date().toISOString().split('T')[0],
            amount: Number(repair.finalPaid),
            mode: repair.paymentMode || 'Cash',
            type: 'DELIVERY',
            notes: repair.deliveryNotes || 'Payment at delivery',
          })
        }
      }
    })
  })

/**
 * Convenience database repository helpers.
 * Note: db.repairs can still be used directly anywhere in the app.
 */

export const getAllRepairs = async () => {
  try {
    return await db.repairs.orderBy('id').reverse().toArray()
  } catch (err) {
    console.error('Error fetching all repairs:', err)
    return []
  }
}

export const getRepairById = async (id) => {
  try {
    return await db.repairs.get(Number(id))
  } catch (err) {
    console.error(`Error fetching repair #${id}:`, err)
    return null
  }
}

export const getInProgressRepairs = async () => {
  try {
    return await db.repairs.where('status').equals('IN_PROGRESS').reverse().sortBy('id')
  } catch {
    const all = await getAllRepairs()
    return all.filter((r) => r.status === 'IN_PROGRESS')
  }
}

export const getPendingDuesRepairs = async () => {
  try {
    const all = await getAllRepairs()
    return all.filter((r) => (Number(r.pendingAmount) || 0) > 0)
  } catch (err) {
    console.error('Error fetching pending dues repairs:', err)
    return []
  }
}

export const searchRepairsUniversal = async (query) => {
  const q = (query || '').toLowerCase().trim()
  if (!q) return getAllRepairs()

  const all = await getAllRepairs()
  return all.filter((r) => {
    const plate = (r.bikeNumber || r.vehicleNumber || '').toLowerCase()
    const customer = (r.customerName || '').toLowerCase()
    const mobile = (r.mobileNumber || r.phone || '').toLowerCase()
    const model = (r.bikeModel || r.vehicleModel || '').toLowerCase()
    const idStr = String(r.id)

    return (
      plate.includes(q) ||
      customer.includes(q) ||
      mobile.includes(q) ||
      model.includes(q) ||
      idStr === q
    )
  })
}