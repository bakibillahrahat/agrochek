"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

type User = {
  id: string
  name: string | null
  email: string
  imageUrl: string | null
}

interface AccountFormProps extends React.HTMLAttributes<HTMLDivElement> {
  onSuccess?: () => void
}

export function AccountForm({
  className,
  onSuccess,
  ...props
}: AccountFormProps) {
  const { data: session, update } = useSession()
  const [formData, setFormData] = useState<User>({
    id: '',
    name: '',
    email: '',
    imageUrl: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user')
        if (response.ok) {
          const data = await response.json()
          setFormData(data)
        }
      } catch (error) {
        setError('Failed to fetch user data')
        toast.error('Failed to fetch user data. Please try again.')
        console.error('Error fetching user data:', error)
      }
    }

    fetchUserData()
  }, [mounted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          imageUrl: formData.imageUrl
        }),
      })
      
      if (response.ok) {
        const updatedUser = await response.json()
        await update(updatedUser) // Update the session with new user data
        toast.success('Account information updated successfully')
        onSuccess?.()
      } else {
        throw new Error('Failed to update account data')
      }
    } catch (error) {
      setError('Failed to update account data')
      toast.error('Failed to update account data. Please try again.')
      console.error('Error updating account data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-2 text-sm text-red-500 bg-red-50 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your Name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled={true}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imageUrl">Profile Image URL</Label>
                <Input
                  id="imageUrl"
                  type="url"
                  placeholder="https://example.com/your-image.jpg"
                  value={formData.imageUrl || ''}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 