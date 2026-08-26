import { useNavigate } from 'react-router-dom'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="home-container">
        <h1>Workshop Manager</h1>

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

      </div>
    </div>
  )
}

export default Home