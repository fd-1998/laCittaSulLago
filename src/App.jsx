import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function App() {
  const [places, setPlaces] = useState([])

  useEffect(() => {
    fetchPlaces()
  }, [])

  async function fetchPlaces() {
    const { data, error } = await supabase
      .from('places')
      .select('*')

    if (error) {
      console.error(error)
    } else {
      setPlaces(data)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Luoghi storici del lecchese</h1>

      {places.map(place => (
        <div
          key={place.id}
          style={{
            border: '1px solid gray',
            padding: '1rem',
            marginBottom: '1rem'
          }}
        >
          <h2>{place.title}</h2>

          <p>{place.description}</p>

          <p>
            {place.start_year} → {place.end_year}
          </p>

          <p>{place.period_label}</p>
        </div>
      ))}
    </div>
  )
}

export default App