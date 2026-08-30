import Dexie from 'dexie'

export const db = new Dexie('WorkshopDB')

db.version(1).stores({
  repairs:
    '++id, customerName, phone, vehicleNumber, vehicleModel, issue'
})

db.version(2).stores({
  repairs:
    '++id, customerName, mobileNumber, bikeNumber, createdDate'
})

db.version(3).stores({
  repairs:
    '++id, customerName, mobileNumber, bikeNumber, createdDate, status'
})