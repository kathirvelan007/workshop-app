import Dexie from 'dexie'

export const db = new Dexie('WorkshopDB')

db.version(1).stores({
  repairs: '++id, customerName, phone, vehicleNumber, vehicleModel, issue'
})