'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { UnifiedLayout } from '@/components/layouts/UnifiedLayout';

const MathematicsPage = () => {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Find the first mathematics course dynamically
    const findMathematicsCourse = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/courses?subject=mathematics&limit=1');
        const result = await response.json();

        if (result.success && result.data.length > 0) {
          const courseId = result.data[0].id;
          router.replace(`/learning/${courseId}`);
        } else {
          setError('No mathematics courses found. Redirecting to course catalog...');
          setTimeout(() => {
            router.push('/learning/courses/browse');
          }, 2000);
        }
      } catch (err) {
        setError('Failed to load mathematics course. Redirecting to course catalog...');
        setTimeout(() => {
          router.push('/learning/courses/browse');
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    findMathematicsCourse();
  }, [router]);

  if (!isAuthenticated) {
    return (
      <UnifiedLayout userRole="student" title="Authentication Required">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Authentication Required</h1>
            <p className="text-muted-foreground mb-4">Please sign in to access course content.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <UnifiedLayout userRole="student" title="Loading">
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading Mathematics course...</p>
            </>
          ) : error ? (
            <>
              <div className="text-red-500 mb-4">
                <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">{error}</p>
              <p className="text-sm text-gray-500">Redirecting to course catalog...</p>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-muted-foreground">Redirecting to course...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MathematicsPage;