import { Institute } from '../../types/institute'
import { useState, useEffect } from 'react'

export const useInstitute = () => {
  const [institute, setInstitute] = useState<Institute | null>(null)

  useEffect(() => {
    const fetchInstitute = async () => {
      try {
        const response = await fetch('/api/institute')
        if (response.ok) {
          const data = await response.json()
          setInstitute(data)
        }
      } catch (error) {
        console.error('Error fetching institute data:', error)
      }
    }

    fetchInstitute()
  }, [])

  return { institute }
}