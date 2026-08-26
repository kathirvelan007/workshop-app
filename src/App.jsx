import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import NewRepair from './pages/NewRepair'
import GetIssue from './pages/GetIssue'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new-repair" element={<NewRepair />} />
        <Route path="/get-issue" element={<GetIssue />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App