'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface Organization {
  id: string;
  name: string;
  domain?: string;
  role: 'admin' | 'member' | 'viewer';
  organization: {
    id: string;
    name: string;
    domain?: string;
  };
}

interface OrganizationSwitcherProps {
  currentOrganizationId?: string;
  onOrganizationChange?: (organizationId: string) => void;
}

export function OrganizationSwitcher({ 
  currentOrganizationId, 
  onOrganizationChange 
}: OrganizationSwitcherProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          // User is not authenticated, this is expected behavior
          console.log('User not authenticated, organizations will be empty');
          setOrganizations([]);
          return;
        }
        
        const errorText = await response.text();
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch organizations: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      // Set empty organizations on error to prevent UI issues
      setOrganizations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrganizationSelect = (organizationId: string) => {
    onOrganizationChange?.(organizationId);
    setIsOpen(false);
  };

  const currentOrg = organizations.find(org => org.organization.id === currentOrganizationId);

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Loading organizations...</span>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No organizations found
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2"
      >
        <span className="font-medium">
          {currentOrg ? currentOrg.organization.name : 'Select Organization'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <div className="py-1">
            {organizations.map((org) => (
              <button
                key={org.organization.id}
                onClick={() => handleOrganizationSelect(org.organization.id)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                  org.organization.id === currentOrganizationId ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                }`}
              >
                <div>
                  <div className="font-medium">{org.organization.name}</div>
                  {org.organization.domain && (
                    <div className="text-xs text-gray-500">{org.organization.domain}</div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    org.role === 'admin' 
                      ? 'bg-red-100 text-red-700' 
                      : org.role === 'member'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {org.role}
                  </span>
                  {org.organization.id === currentOrganizationId && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
          
          <div className="border-t border-gray-200 py-1">
            <button
              onClick={() => {
                window.location.href = '/create-organization';
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
            >
              + Create New Organization
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
