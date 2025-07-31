"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Input } from '@/components/ui/input'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import React, { useEffect, useState } from 'react'
import { Institute, InstituteFormProps } from '@/types/institute'
import { Input } from '../ui/input'

export function InstituteForm({
  className,
  onSuccess,
  ...props
}: InstituteFormProps) {
  const [formData, setFormData] = useState<Institute>({
    name: '',
    address: '',
    issuedby: '',
    prapok: '',
    phone: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const fetchInstituteData = async () => {
      try {
        const response = await fetch('/api/institute');
        if (response.ok) {
          const data = await response.json();
          setFormData({
            name: data.name || '',
            address: data.address || '',
            issuedby: data.issuedby || '',
            prapok: data.prapok || '',
            phone: data.phone || ''
          });
        }
      } catch (error) {
        setError('Failed to fetch institute data');
        toast.error('Failed to fetch institute data. Please try again.');
        console.error('Error fetching institute data:', error);
      }
    };

    fetchInstituteData();
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/institute', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        toast.success('Institute information updated successfully');
        onSuccess?.();
      } else {
        throw new Error('Failed to update institute data');
      }
    } catch (error) {
      setError('Failed to update institute data');
      toast.error('Failed to update institute data. Please try again.');
      console.error('Error updating institute data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className='text-center'>
          <CardTitle className='text-xl'>Institute Information</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-2 text-sm text-red-500 bg-red-50 rounded">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="name">নাম</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Institute Name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prapok">প্রাপক</Label>
                  <Input
                    id="prapok"
                    type="text"
                    placeholder="Prapok Name"
                    required
                    value={formData.prapok}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="issuedby">প্রধান বৈজ্ঞানিক কর্মকর্তা</Label>
                  <Input
                    id="issuedby"
                    type="text"
                    placeholder="Issued BY"
                    required
                    value={formData.issuedby}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">ঠিকানা</Label>
                  <Input
                    id="address"
                    type="text"
                    placeholder="Address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">ফোন</Label>
                  <Input
                    id="phone"
                    type="text"
                    placeholder="Phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  type='submit' 
                  className='w-full'
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Submit'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

