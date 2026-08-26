import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import NewRepair from './pages/NewRepair'
import GetIssue from './pages/GetIssue'
import Navbar from './components/NavBar'
import './App.css'

function App() {
  return (
    <BrowserRouter basename="/workshop-app">
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new-repair" element={<NewRepair />} />
        <Route path="/get-issue" element={<GetIssue />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App