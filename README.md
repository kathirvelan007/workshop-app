# Workshop Management PWA

A lightweight, local-first Progressive Web App (PWA) for managing a small bike/car repair workshop.

The application is designed for a workshop that wants to manage the complete repair lifecycle without maintaining a backend server:

**Customer/Vehicle Registration → Repair Job → Inspection → Cost Estimate → Advance Payment → Delivery → Final Payment → Pending Payment → Receipt → Analysis**

The application stores workshop data locally in the browser using **IndexedDB through Dexie.js**.

---

## 1. Project Overview

This application is intended for a small/private workshop where the owner or staff can use a phone, tablet, or computer to manage repair jobs.

### Main goals

- Create a new repair/job card.
- Capture customer and vehicle information.
- Record customer complaints.
- Record inspection/checklist information.
- Record required work.
- Track service and additional repair costs.
- Record advance payments.
- Track delivery information.
- Record payment received at delivery.
- Allow delivery even when the customer has not paid the complete amount.
- Record discounts.
- Track pending/outstanding amounts.
- Generate a printable receipt.
- Save/print the receipt as PDF.
- Share the receipt through WhatsApp where supported by the device/browser.
- Analyze workshop activity and collections.
- Work without a backend/database server.
- Deploy cheaply/free using GitHub Pages.

---

# 2. High-Level Architecture

```text
                    Workshop User
                         |
                         v
              +----------------------+
              |     React PWA        |
              |                      |
              |  Pages / Components  |
              +----------+-----------+
                         |
                         v
              +----------------------+
              |     React Router     |
              +----------+-----------+
                         |
                         v
              +----------------------+
              |       Dexie.js       |
              |                      |
              | IndexedDB abstraction|
              +----------+-----------+
                         |
                         v
              +----------------------+
              |      IndexedDB       |
              |    Browser Storage   |
              +----------------------+
```

There is currently **no backend API**.

There is currently **no SQL database**.

There is currently **no authentication system**.

There is currently **no cloud database**.

---

# 3. Technology Stack

## Frontend

| Technology | Purpose |
|---|---|
| React | UI development |
| Vite | Development/build tooling |
| JavaScript | Application logic |
| HTML/CSS | UI and styling |
| React Router | Client-side routing |

## Local Data

| Technology | Purpose |
|---|---|
| IndexedDB | Browser-based persistent storage |
| Dexie.js | Easier IndexedDB access and queries |

## PWA

The application is intended to behave like a Progressive Web App.

Benefits:

- Can be installed on supported devices.
- Can run like an application.
- Does not require a backend for normal local operation.
- Can continue working when the application is available locally/offline.

## Deployment

Current target:

```text
GitHub
   |
   v
GitHub Pages
   |
   v
/workshop-app/
```

The application uses:

```jsx
<BrowserRouter basename="/workshop-app">
```

Therefore the expected production URL is conceptually:

```text
https://<github-user>.github.io/workshop-app/
```

---

# 4. Application Architecture

Recommended project structure:

```text
workshop-app/
│
├── public/
│
├── src/
│   │
│   ├── components/
│   │   └── NavBar.jsx
│   │
│   ├── db/
│   │   └── database.js
│   │
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── NewRepair.jsx
│   │   ├── GetIssue.jsx
│   │   ├── AllIssues.jsx
│   │   ├── DeliveryVehicle.jsx
│   │   ├── DeliveryRepair.jsx
│   │   ├── Receipt.jsx
│   │   └── Analyze.jsx
│   │
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
│
├── package.json
├── vite.config.js
└── README.md
```

---

# 5. Main Application Flow

The complete business flow is:

```text
                    HOME
                      |
          +-----------+-----------+
          |                       |
          v                       v
     New Repair              Analyze
          |
          v
 Customer + Vehicle
          |
          v
 Work Required
          |
          v
 Complaints
          |
          v
 Inspection
          |
          v
 Cost Estimation
          |
          v
 Advance Payment
          |
          v
 Save Repair
          |
          v
      IN_PROGRESS
          |
          v
 Delivery Vehicles
          |
          v
 Select Vehicle
          |
          v
 Delivery & Payment
          |
          +-----------------------------+
          |                             |
          v                             v
      Final Paid                    Pending Amount
      at Delivery                    if any
          |                             |
          +--------------+--------------+
                         |
                         v
                    DELIVERED
                         |
                         v
                  Success Popup
                  /      |       \
                 /       |        \
                v        v         v
               OK    View Receipt  Share PDF
                                  via WhatsApp
```

---

# 6. Repair Lifecycle / Status

A repair normally moves through these states:

```text
IN_PROGRESS
     |
     | Vehicle delivered
     v
DELIVERED
```

### IN_PROGRESS

The repair has been registered but the vehicle has not yet been delivered.

The vehicle appears in:

```text
Delivery Vehicles
```

### DELIVERED

The delivery process has been completed.

The record stores:

- Delivery date
- Delivered by
- Final amount
- Final paid
- Payment mode
- Discount
- Pending amount
- Delivery notes
- Completion timestamp

---

# 7. Home Page

The Home page acts as the main dashboard/navigation entry point.

Typical actions:

- New Repair
- Get Issue
- All Issues
- Delivery Vehicles
- Analyze

The Home page should provide simple navigation for workshop staff.

---

# 8. New Repair Flow

The `NewRepair.jsx` page creates a new repair/job card.

## Customer details

The application captures:

- Customer Name
- Mobile Number
- Bike/Vehicle Number
- Bike/Vehicle Model
- Odometer
- Fuel Level

## Work required

The user can select multiple work items.

The application also supports:

- Other Work

## Customer complaints

Complaints are stored as multiple entries.

Internally they are currently stored as a single string separated using:

```text
 ||
```

Example:

```text
Brake noise || Engine vibration || Headlight issue
```

## Inspection checklist

The current checklist includes:

- Toolkit / First Aid
- Helmet Left
- Body Condition
- Rear View Mirrors
- Indicator and Horn
- Battery Condition

## Cost estimation

The application supports:

- Service Spares
- Service Labour
- Additional Spares
- Additional Labour

Calculated values:

```text
Service Total
    = Service Spares + Service Labour

Additional Total
    = Additional Spares + Additional Labour

Total Estimated Amount
    = Service Total + Additional Total
```

---

# 9. Advance Payment

An advance can be recorded when creating the repair.

Fields:

- Advance Amount
- Advance Date
- Advance Payment Mode
- Advance Notes

Supported payment modes:

```text
Cash
UPI/GPay
Card
```

If the advance amount is greater than zero:

- Advance date is required.
- Advance payment mode is required.

The advance cannot be greater than the total estimated amount.

Example:

```text
Total Estimate = ₹5,000
Advance        = ₹1,500

Remaining      = ₹3,500
```

---

# 10. Delivery Vehicles

`DeliveryVehicle.jsx` shows repairs with:

```text
status === "IN_PROGRESS"
```

The page provides:

- Customer name
- Bike number
- Bike model
- Job ID
- Status
- Deliver action

It also supports searching by bike number.

---

# 11. Delivery Repair Page

`DeliveryRepair.jsx` is the final step before changing a repair from:

```text
IN_PROGRESS
```

to:

```text
DELIVERED
```

The page displays Sets 1–5 as read-only information.

Set 6 is used for final delivery and payment.

---

# 12. Final Delivery and Payment Logic

The delivery page automatically populates:

```text
Delivery Date = Current Date
```

The user enters:

- Delivered By
- Discount Amount
- Final Paid Now
- Payment Mode
- Delivery Notes

The application calculates:

```text
Total Amount
        -
Advance Amount
        =
Remaining Before Discount
```

Then:

```text
Remaining Before Discount
        -
Discount
        =
Amount Due
```

Finally:

```text
Amount Due
        -
Final Paid Now
        =
Pending Amount
```

Example:

```text
Total Amount              ₹5,000
Advance Paid              ₹1,000
--------------------------------
Remaining Before Discount ₹4,000

Discount                  ₹500
--------------------------------
Amount Due                ₹3,500

Final Paid Now            ₹2,000
--------------------------------
Pending Amount            ₹1,500
```

The vehicle **can still be delivered** even when:

```text
Pending Amount > 0
```

This is intentional.

---

# 13. Final Payment Rules

The user does **not** have to pay the complete remaining amount at delivery.

For example:

```text
Amount Due = ₹3,500
Final Paid = ₹2,000
Pending    = ₹1,500
```

The delivery is still allowed.

However:

```text
Final Paid > Amount Due
```

is not allowed.

Example:

```text
Amount Due = ₹3,500
Final Paid = ₹4,000
```

The application rejects this because the customer cannot pay more than the amount due unless a separate overpayment/refund business rule is implemented.

---

# 14. Payment Mode at Delivery

If the customer pays any amount at delivery:

```text
Final Paid Now > 0
```

then payment mode is required.

Supported modes:

```text
Cash
UPI/GPay
Card
```

If:

```text
Final Paid Now = ₹0
```

the vehicle can still be delivered and payment mode can remain empty.

This supports scenarios such as:

- Customer pays nothing at delivery.
- Customer promises to pay later.
- Customer has a pending amount.
- Workshop gives a discount.
- Customer partially pays.

---

# 15. Discount

A discount can be entered at delivery.

Example:

```text
Total        ₹4,000
Advance      ₹1,000
Remaining    ₹3,000
Discount       ₹500
Amount Due   ₹2,500
```

The discount cannot exceed the amount remaining after advance.

---

# 16. Pending Amount

Pending amount is stored directly against the repair record.

Example:

```js
{
  pendingAmount: 1500
}
```

This is important because the workshop can later identify:

```text
Which customer owes money?
How much?
Which vehicle?
Which job ID?
```

Future versions can provide a dedicated:

```text
Pending Payments
```

page.

---

# 17. Delivery Success Popup

After clicking:

```text
Deliver Vehicle
```

the application saves the delivery and shows a success popup.

The popup displays:

- Job ID
- Vehicle number
- Paid Now
- Pending Amount

Buttons:

```text
OK
View Receipt
Share PDF via WhatsApp
```

### OK

Returns to:

```text
Delivery Vehicles
```

### View Receipt

Opens:

```text
/receipt/:id
```

### Share PDF via WhatsApp

Opens the receipt page and attempts to generate/share the PDF.

---

# 18. Receipt Page

`Receipt.jsx` generates a customer-facing workshop receipt.

The receipt contains:

## Header

- Workshop Receipt
- Job Card ID
- Delivery Date

## Customer details

- Customer Name
- Mobile Number
- Vehicle Number
- Vehicle Model

## Work details

- Work Required
- Other Work

## Customer complaints

All recorded complaints.

## Payment details

- Service Total
- Additional Total
- Total Amount
- Advance Paid
- Advance Payment Date
- Advance Payment Mode
- Discount
- Pending Amount
- Advance Notes

## Delivery details

- Delivery Date
- Delivered By
- Status
- Delivery Notes

---

# 19. Receipt Navigation

The Receipt page does not return directly to Home.

Instead:

```text
Receipt
   |
   v
Back to Delivery
   |
   v
DeliveryRepair
   |
   v
Delivery Success Popup
```

The popup can then be closed using:

```text
OK / Close
```

This preserves the delivery workflow.

---

# 20. Print / Save as PDF

The receipt supports:

```text
Print / Save as PDF
```

using the browser's print functionality:

```js
window.print()
```

The user can select:

```text
Save as PDF
```

from the browser print dialog.

---

# 21. WhatsApp PDF Sharing

The application uses:

- `html2canvas`
- `jsPDF`

to generate a PDF from the receipt.

Example dependency installation:

```bash
npm install jspdf html2canvas
```

The application attempts to use the browser's native file sharing capability.

On supported mobile browsers, the user can select WhatsApp and share the PDF.

If file sharing is not supported:

1. The PDF is downloaded.
2. WhatsApp is opened with a prepared message.

Important browser limitation:

A normal `wa.me` URL cannot directly attach an arbitrary locally generated PDF file. Actual file attachment depends on the browser's native Web Share/file-sharing support.

---

# 22. Analyze Dashboard

`Analyze.jsx` provides workshop-level reporting.

The dashboard supports:

- From date
- To date
- Today shortcut
- This Month shortcut

The default date range is the current day.

---

# 23. Analyze Metrics

Current intended metrics include:

### Vehicles Received

Repairs created during the selected period.

Based on:

```text
createdDate
```

### Vehicles Delivered

Vehicles whose delivery/completion date falls in the selected period.

Based on:

```text
completedDate
```

### Pending Vehicles

Repairs currently having:

```text
status === "IN_PROGRESS"
```

### Final Payments

Final payment collected at delivery.

Based on:

```text
finalPaid
```

### Advance Collected

Advance payments whose:

```text
advanceDate
```

falls inside the selected date range.

### Total Collected

Conceptually:

```text
Advance Collected
+
Final Payments
```

### Average Final Bill

Currently based on delivered repairs:

```text
Total Final Payments / Number of Delivered Vehicles
```

This metric should be treated separately from total invoice value when partial payments exist.

---

# 24. Payment Analysis

Payment modes are tracked separately.

Supported:

```text
Cash
UPI/GPay
Card
```

The analysis can distinguish:

```text
Advance Cash
Advance UPI
Advance Card

Final Cash
Final UPI
Final Card
```

and can also show combined:

```text
Cash
UPI
Card
```

---

# 25. Important Financial Concepts

The application intentionally separates these values:

```text
Total Amount
Advance Paid
Discount
Final Paid Now
Pending Amount
```

They are not interchangeable.

For example:

```text
Total Amount = ₹5,000
Advance      = ₹1,000
Discount     = ₹500
Final Paid   = ₹2,000
Pending      = ₹1,500
```

The workshop's actual cash received for this job so far is:

```text
₹1,000 + ₹2,000 = ₹3,000
```

The outstanding amount is:

```text
₹1,500
```

---

# 26. Current Data Model

The main IndexedDB table is:

```text
repairs
```

The application uses Dexie.js.

Current Dexie schema is conceptually:

```js
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
```

Important:

Dexie's schema lists **indexes**, not every property stored in the object.

Therefore fields such as:

```text
advanceAmount
advanceDate
advancePaymentMode
discountAmount
finalPaid
paymentMode
pendingAmount
```

can still be stored without being indexed.

---

# 27. Repair Record Fields

A repair record can contain the following logical groups.

## Identity

```text
id
```

## Customer

```text
customerName
mobileNumber
```

## Vehicle

```text
bikeNumber
bikeModel
odoMeter
fuelLevel
```

## Work

```text
workRequired
otherWork
complaints
```

## Inspection

```text
toolkitFirstAid
helmetLeft
bodyCondition
rearViewMirrors
indicatorHorn
batteryCondition
```

## Cost

```text
serviceSpares
serviceLabour
serviceTotal

additionalSpares
additionalLabour
additionalTotal

totalEstimatedAmount
```

## Advance payment

```text
advanceAmount
advanceDate
advancePaymentMode
advanceNotes
```

## Delivery

```text
deliveryDate
deliveredBy
completedDate
```

## Final payment

```text
finalAmount
finalAmountAfterAdvance
finalPaid
paymentMode
```

## Discount / outstanding amount

```text
discountAmount
pendingAmount
deliveryNotes
```

## Status

```text
status
```

Possible current values:

```text
IN_PROGRESS
DELIVERED
```

---

# 28. Example Repair Object

A delivered repair may look conceptually like:

```js
{
  id: 15,

  customerName: "Example Customer",
  mobileNumber: "9876543210",

  bikeNumber: "TN01AB1234",
  bikeModel: "Pulsar",

  odoMeter: "25000",
  fuelLevel: "Half",

  workRequired: [
    "General Service",
    "Brake Service"
  ],

  otherWork: "",

  complaints:
    "Brake noise || Engine vibration",

  toolkitFirstAid: "Yes",
  helmetLeft: "Yes",
  bodyCondition: "Good",
  rearViewMirrors: "Good",
  indicatorHorn: "Good",
  batteryCondition: "Good",

  serviceSpares: 800,
  serviceLabour: 700,
  serviceTotal: 1500,

  additionalSpares: 1000,
  additionalLabour: 500,
  additionalTotal: 1500,

  totalEstimatedAmount: 3000,

  advanceAmount: 1000,
  advanceDate: "2026-10-09",
  advancePaymentMode: "UPI/GPay",
  advanceNotes: "Advance received",

  deliveryDate: "2026-10-09",
  deliveredBy: "Workshop Staff",

  finalAmount: 3000,
  finalAmountAfterAdvance: 2000,

  discountAmount: 200,

  finalPaid: 1000,
  paymentMode: "Cash",

  pendingAmount: 800,

  deliveryNotes:
    "Customer will pay remaining amount later",

  status: "DELIVERED",

  completedDate:
    "2026-10-09T12:30:00.000Z"
}
```

---

# 29. Application Routes

The current route design is:

| Route | Page | Purpose |
|---|---|---|
| `/` | Home | Main application page |
| `/new-repair` | NewRepair | Create repair |
| `/get-issue` | GetIssue | Retrieve/search issue |
| `/all-issues` | AllIssues | View repair records |
| `/delivery-vehicles` | DeliveryVehicle | Vehicles waiting for delivery |
| `/delivery/:id` | DeliveryRepair | Complete delivery |
| `/receipt/:id` | Receipt | View/print/share receipt |
| `/analyze` | Analyze | Workshop analytics |

Because the application is hosted under GitHub Pages:

```jsx
<BrowserRouter basename="/workshop-app">
```

is used.

---

# 30. Navigation Flow

```text
                         HOME
                          |
       +------------------+------------------+
       |                  |                  |
       v                  v                  v
 New Repair           All Issues          Analyze
       |
       v
 IN_PROGRESS
       |
       v
Delivery Vehicles
       |
       v
Delivery Repair
       |
       v
DELIVERED
       |
       v
Success Popup
       |
       +------------+-------------+
       |            |             |
       v            v             v
      OK      View Receipt    Share PDF
       |            |             |
       |            v             v
       |         Receipt        Receipt
       |            |
       |            v
       |       Back to Delivery
       |            |
       +------------+
                    |
                    v
              Success Popup
```

---

# 31. Offline / Local-First Design

The application is designed as a local-first application.

Data is stored in:

```text
Browser
  ↓
IndexedDB
  ↓
Dexie.js
```

This means data belongs to the browser/device where it was created.

### Important consequence

If the same application is opened on:

```text
Phone A
```

and:

```text
Laptop B
```

the IndexedDB databases are separate.

There is currently no automatic synchronization between devices.

---

# 32. Data Backup Consideration

Because data is stored locally, backup is extremely important.

A future backup system should support:

```text
Export
  ↓
JSON file
  ↓
Store safely
```

and:

```text
JSON file
  ↓
Import
  ↓
IndexedDB
```

The existing workshop concept already includes JSON backup/restore as an important future capability.

Recommended backup options:

- Manual JSON export.
- Manual JSON import.
- Automatic reminder to create backup.
- Optional encrypted backup in future.

---

# 33. Security Considerations

The current application does not have authentication.

Therefore:

- Anyone who can access the browser profile may potentially access the data.
- IndexedDB data is not a replacement for server-side security.
- The application should ideally be used on a trusted workshop device.
- Browser/device access should be protected with a device PIN/password.
- Customer personal information should not be exposed publicly.

If the application eventually becomes multi-user or cloud-based, authentication and authorization should be introduced.

---

# 34. Privacy

The application contains customer information such as:

```text
Customer name
Mobile number
Vehicle number
Repair history
Payment information
```

Because the data is stored locally, it is not automatically sent to a server.

However, users should still protect the device and backup files.

---

# 35. Advantages of Current Architecture

### Very low cost

No:

- Backend server
- Cloud database
- API hosting
- Database hosting

is required for normal operation.

### Simple architecture

```text
React
+
Dexie
+
IndexedDB
```

is much easier to maintain than a full:

```text
React
+
REST API
+
Spring Boot
+
SQL
```

system.

### Fast

Local IndexedDB operations are normally very fast.

### Works with poor/no network connectivity

Once the PWA assets are available locally, the application can continue to operate without depending on an API.

---

# 36. Current Limitations

The current architecture has important limitations.

## 1. No multi-device synchronization

Phone and laptop have different data.

## 2. No centralized backup

If browser storage is cleared, local data may be lost.

## 3. No authentication

Anyone using the device/browser can potentially access the application.

## 4. No multi-user support

There is no concept of:

```text
Admin
Mechanic
Cashier
Staff
```

yet.

## 5. Single advance payment

The current model assumes one advance payment per repair:

```text
advanceAmount
advanceDate
advancePaymentMode
```

If multiple advance payments are required later, the model should change.

---

# 37. Future Multi-Payment Design

If the workshop needs multiple payments, a better model would be:

```text
Repair
  |
  +---- Payment 1
  |
  +---- Payment 2
  |
  +---- Payment 3
  |
  +---- Payment 4
```

For example:

```js
payments: [
  {
    date: "2026-10-01",
    amount: 1000,
    mode: "UPI/GPay",
    type: "ADVANCE"
  },
  {
    date: "2026-10-09",
    amount: 1500,
    mode: "Cash",
    type: "DELIVERY"
  },
  {
    date: "2026-10-15",
    amount: 500,
    mode: "UPI/GPay",
    type: "PENDING_PAYMENT"
  }
]
```

This would make financial reporting much more accurate.

---

# 38. Future Pending Payment Workflow

A recommended future workflow:

```text
Delivery
   |
   v
Pending Amount > 0
   |
   v
Pending Payments
   |
   v
Customer pays later
   |
   v
Record Payment
   |
   v
Pending Amount decreases
```

Example:

```text
Initial Pending = ₹1,500

Customer later pays ₹500

New Pending = ₹1,000
```

Eventually:

```text
Pending = ₹0
```

and the payment can be marked fully settled.

---

# 39. Future Analytics

The Analyze page can eventually provide:

### Revenue

```text
Total invoice value
Total amount collected
Total outstanding
```

### Payments

```text
Cash
UPI
Card
```

### Payment stages

```text
Advance
Delivery
Pending collection
```

### Operations

```text
Vehicles received
Vehicles delivered
Vehicles pending
Average repair value
Average turnaround time
```

### Customer analytics

```text
Repeat customers
Most serviced vehicles
Most common complaints
Most common repair types
```

### Outstanding payments

```text
Total pending amount
Customers with pending amounts
Oldest pending payment
Pending amount by customer
```

---

# 40. Future Database Migration

If the workshop grows, the local-first architecture can eventually be changed to:

```text
React PWA
    |
    v
REST API
    |
    v
Backend
    |
    v
SQL Database
```

Possible backend choices:

```text
Spring Boot
FastAPI
Node.js
```

For a Java/Spring-oriented implementation:

```text
React
   |
   v
Spring Boot REST API
   |
   v
Spring Data JPA
   |
   v
MySQL / PostgreSQL
```

This would enable:

- Multi-device access
- Centralized data
- Authentication
- User roles
- Cloud backup
- Advanced reporting
- Concurrent users

---

# 41. Development Setup

Recommended development environment:

```text
Node.js
npm
VS Code / IntelliJ / Eclipse
Git
GitHub
```

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build production application:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

# 42. PDF Dependencies

For receipt PDF generation/sharing:

```bash
npm install jspdf html2canvas
```

Purpose:

```text
html2canvas
    ↓
Converts receipt HTML into an image

jsPDF
    ↓
Creates PDF from the generated image
```

---

# 43. Git Workflow

Recommended workflow:

```text
main
 |
 +---- feature/new-repair
 |
 +---- feature/delivery
 |
 +---- feature/analytics
```

For a feature:

```bash
git checkout -b feature/delivery-payment
```

Make changes:

```bash
git add .
git commit -m "Add delivery payment and pending amount"
```

Push:

```bash
git push origin feature/delivery-payment
```

Then create a Pull Request.

---

# 44. Recommended Development Principles

### Keep business calculations centralized

For example:

```text
Total Amount
Advance
Discount
Amount Due
Final Paid
Pending
```

should follow one consistent calculation.

### Do not mix display calculations with database updates unnecessarily.

### Keep IndexedDB field names consistent.

For example, always use:

```text
mobileNumber
bikeNumber
bikeModel
```

instead of mixing:

```text
phone
mobile
mobileNumber
```

### Avoid unnecessary Dexie schema changes

Only add a new Dexie version when a new field needs to be indexed/queryable efficiently.

A normal object property does not need to be added to the Dexie schema.

---

# 45. Important Data Integrity Rules

The application should maintain:

```text
Advance >= 0
Discount >= 0
Final Paid >= 0
Pending >= 0
```

And:

```text
Advance <= Total Amount
```

```text
Discount <= Remaining After Advance
```

```text
Final Paid <= Amount Due
```

Pending calculation:

```text
Pending =
Total
- Advance
- Discount
- Final Paid
```

with a minimum of zero.

---

# 46. Example Complete Financial Calculation

Suppose:

```text
Service Spares      ₹1,000
Service Labour      ₹  500
Additional Spares   ₹1,500
Additional Labour   ₹  500
--------------------------------
Total Amount        ₹3,500
```

Advance:

```text
Advance = ₹1,000
```

At delivery:

```text
Remaining = ₹2,500
```

Discount:

```text
Discount = ₹200
```

Amount due:

```text
₹2,500 - ₹200 = ₹2,300
```

Customer pays:

```text
Final Paid = ₹1,500
```

Therefore:

```text
Pending = ₹2,300 - ₹1,500
        = ₹800
```

Total amount collected so far:

```text
Advance + Final Paid
= ₹1,000 + ₹1,500
= ₹2,500
```

Outstanding:

```text
₹800
```

---

# 47. Current End-to-End Example

```text
Customer arrives
       |
       v
Create New Repair
       |
       v
Enter customer/vehicle details
       |
       v
Enter complaints
       |
       v
Select required work
       |
       v
Complete inspection
       |
       v
Calculate estimate
       |
       v
Customer gives ₹1,000 advance
       |
       v
Save repair
       |
       v
Status = IN_PROGRESS
       |
       v
Workshop completes repair
       |
       v
Delivery Vehicles
       |
       v
Select vehicle
       |
       v
Delivery Date = Today
       |
       v
Enter Delivered By
       |
       v
Enter Discount
       |
       v
Enter Final Paid Now
       |
       v
Select Payment Mode
       |
       v
System calculates Pending Amount
       |
       v
Deliver Vehicle
       |
       v
Status = DELIVERED
       |
       v
Success Popup
       |
       +-------> OK
       |
       +-------> View Receipt
       |
       +-------> Share PDF via WhatsApp
```

---

# 48. Recommended Next Features

Priority order:

### Priority 1

**Pending Payments page**

```text
Customer
Vehicle
Job ID
Total
Advance
Paid
Pending
```

with:

```text
Collect Payment
```

### Priority 2

**JSON Backup / Restore**

```text
Export Data
Import Data
```

### Priority 3

**Customer Search**

Search by:

```text
Mobile number
Vehicle number
Customer name
```

### Priority 4

**Repeat Customer**

Entering mobile number should show previous repair history.

### Priority 5

**Multiple Payments**

Replace the single:

```text
advanceAmount
finalPaid
```

model with a payment history.

### Priority 6

**Dashboard charts**

Examples:

```text
Daily collection
Monthly collection
Repair count
Pending amount
Payment mode distribution
```

### Priority 7

**Cloud synchronization**

Only when the workshop needs multiple devices/users.

---

# 49. Recommended Long-Term Architecture

For the current small workshop:

```text
React
+
Dexie
+
IndexedDB
+
GitHub Pages
```

is a good simple solution.

If the workshop grows:

```text
React PWA
      |
      v
Spring Boot REST API
      |
      v
PostgreSQL / MySQL
      |
      v
Cloud Hosting
```

can be introduced without changing the overall business workflow.

---

# 50. Summary

This project is a **local-first workshop management PWA** designed to replace manual repair/job tracking for a small workshop.

Core capabilities:

```text
✓ Customer management
✓ Vehicle management
✓ Repair/job cards
✓ Complaints
✓ Inspection checklist
✓ Cost estimation
✓ Advance payments
✓ Delivery tracking
✓ Delivery-time payments
✓ Discounts
✓ Partial payments
✓ Pending amounts
✓ Receipts
✓ Print / Save PDF
✓ WhatsApp sharing support
✓ Workshop analytics
✓ Local/offline-first storage
✓ GitHub Pages deployment
```

Current architecture:

```text
React
  +
React Router
  +
Dexie.js
  +
IndexedDB
  +
PWA
  +
GitHub Pages
```

The most important business rule is:

```text
A vehicle can be delivered even when the customer has
not paid the complete amount.

The unpaid amount is stored as Pending Amount against
the repair/job ID.
```

This gives the application a simple foundation now while leaving a clear path toward:

```text
Multi-payment
Pending collection
Cloud backup
Multi-device synchronization
Authentication
User roles
Advanced analytics
```
