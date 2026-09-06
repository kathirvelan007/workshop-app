import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Home from './pages/Home'
import NewRepair from './pages/NewRepair'
import GetIssue from './pages/GetIssue'
import AllIssues from './pages/AllIssues'
import DeliveryRepair from './pages/DeliveryRepair'
import Receipt from './pages/Receipt'
import DeliveryVehicle from './pages/DeliveryVehicle'
import Analyze from './pages/Analyze'

import Navbar from './components/NavBar'

import './App.css'

function App() {
  return (
    <BrowserRouter basename="/workshop-app">

      <Navbar />

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/new-repair"
          element={<NewRepair />}
        />

        <Route
          path="/get-issue"
          element={<GetIssue />}
        />

        <Route
          path="/all-issues"
          element={<AllIssues />}
        />

        {/* New Delivery Page */}
        <Route
          path="/delivery/:id"
          element={<DeliveryRepair />}
        />

        {/* New Receipt Page */}
        <Route
          path="/receipt/:id"
          element={<Receipt />}
        />

        <Route
          path="/delivery-vehicles"
          element={<DeliveryVehicle />}
        />

        <Route
          path="/analyze"
          element={<Analyze />}
        />

      </Routes>

    </BrowserRouter>
  )
}

export default App