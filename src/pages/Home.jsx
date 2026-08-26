import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="home-container">
        <h1>Prem Workshop</h1>

        <p className="subtitle">
          Manage your vehicle repairs easily
        </p>

        <button
          className="primary-button"
          onClick={() => navigate('/new-repair')}
        >
          + New Repair
        </button>

        <button
          className="secondary-button"
          onClick={() => navigate('/get-issue')}
        >
          Get Issue
        </button>

        <button
          className="secondary-button"
          onClick={() => navigate('/all-issues')}
        >
          All Issues
        </button>

      </div>
    </div>
  )
}

export default Home