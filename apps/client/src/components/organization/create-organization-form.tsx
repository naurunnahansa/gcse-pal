'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface CreateOrganizationFormProps {
  onSuccess?: (organization: any) => void;
  onError?: (error: string) => void;
}

export function CreateOrganizationForm({ onSuccess, onError }: CreateOrganizationFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create organization');
      }

      const data = await response.json();
      onSuccess?.(data.organization);
      
      // Reset form
      setFormData({ name: '', domain: '' });
    } catch (error) {
      console.error('Create organization error:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
        Create Organization
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Organization Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter organization name"
          />
        </div>

        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
            Domain (Optional)
          </label>
          <input
            type="text"
            id="domain"
            name="domain"
            value={formData.domain}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="example.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be used for domain-based organization detection
          </p>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !formData.name.trim()}
          className="w-full"
        >
          {isLoading ? 'Creating...' : 'Create Organization'}
        </Button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your organization will be created in WorkOS</li>
          <li>• You'll become the admin of the organization</li>
          <li>• You can invite team members to join</li>
          <li>• Domain verification will be set up (if provided)</li>
        </ul>
      </div>
    </div>
  );
}
