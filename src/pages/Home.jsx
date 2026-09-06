import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/database'

function Home() {
  const navigate = useNavigate()

  const [repairs, setRepairs] =
    useState([])

  useEffect(() => {
    loadRepairs()
  }, [])

  const loadRepairs = async () => {
    const allRepairs =
      await db.repairs.toArray()

    const pendingRepairs =
      allRepairs.filter(
        (repair) =>
          repair.status ===
          'IN_PROGRESS'
      )

    setRepairs(pendingRepairs)
  }

  return (
    <div className="page">

      <div className="home-container">

        <h1>
          Workshop Management
        </h1>


        <div className="home-buttons">

          <button
            onClick={() =>
              navigate('/new-repair')
            }
          >
            New Repair
          </button>


          <button
            onClick={() =>
              navigate('/get-issue')
            }
          >
            Get Issue
          </button>


          <button
            onClick={() =>
              navigate('/all-issues')
            }
          >
            All Issues
          </button>

            
          <button
            onClick={() =>
              navigate('/delivery-vehicles')
            }
          >
            Delivery Vehicles
          </button>

          
          <button
            onClick={() => navigate('/analyze')}
          >
            Analyze
          </button>

        </div>


        <h2>
          Pending Deliveries
        </h2>


        {repairs.length === 0 ? (

          <p>
            No pending repairs.
          </p>

        ) : (

          <div className="pending-repairs">

            {repairs.map((repair) => (

              <div
                className="repair-card"
                key={repair.id}
              >

                <h3>
                  {repair.bikeNumber}
                </h3>

                <p>
                  {repair.customerName}
                </p>

                <p>
                  Job ID: {repair.id}
                </p>


                <button
                  className="delivery-button"
                  onClick={() =>
                    navigate(
                      `/delivery/${repair.id}`
                    )
                  }
                >
                  Delivery
                </button>

              </div>

            ))}

          </div>

        )
        }

      </div>

    </div>
  )
}

export default Home