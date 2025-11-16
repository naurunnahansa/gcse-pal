'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DebugCourseCreation() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const testCourseData = {
    title: "Debug Test Course",
    description: "This is a test course for debugging course creation issues",
    subject: "mathematics",
    level: "igcse",
    thumbnailUrl: "https://unescoalfozanprize.org/wp-content/uploads/2023/01/1_L76A5gL6176UbMgn7q4Ybg.jpeg",
    status: "draft",
    chapters: [
      {
        title: "Test Chapter 1",
        description: "This is a test chapter",
        order: 0,
        duration: 30,
        isPublished: false,
        lessons: [
          {
            title: "Test Lesson 1",
            description: "This is a test lesson",
            duration: 15,
            order: 0,
            isPublished: false,
            content: "This is the lesson content",
            videoUrl: "https://www.youtube.com/watch?v=Eng2TKFEYeE"
          },
          {
            title: "Test Lesson 2",
            description: "This is another test lesson",
            duration: 15,
            order: 1,
            isPublished: false,
            content: "More lesson content here",
            videoUrl: "https://www.youtube.com/watch?v=Eng2TKFEYeE"
          }
        ]
      },
      {
        title: "Test Chapter 2",
        description: "This is another test chapter",
        order: 1,
        duration: 25,
        isPublished: false,
        lessons: [
          {
            title: "Test Lesson 3",
            description: "Lesson in chapter 2",
            duration: 25,
            order: 0,
            isPublished: false,
            content: "Chapter 2 lesson content",
            videoUrl: "https://www.youtube.com/watch?v=Eng2TKFEYeE"
          }
        ]
      }
    ]
  };

  const handleSimpleCourse = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/courses/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
          'Referer': window.location.href,
        },
        body: JSON.stringify({
          title: "Simple Test Course",
          description: "Test without chapters",
          subject: "mathematics",
          level: "igcse",
          status: "draft"
        }),
      });

      const data = await response.json();
      setResult(data);

      if (!response.ok) {
        setError(`Error: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplexCourse = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/courses/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
          'Referer': window.location.href,
        },
        body: JSON.stringify(testCourseData),
      });

      const data = await response.json();
      setResult(data);

      if (!response.ok) {
        setError(`Error: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Network error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomTest = async () => {
    const customData = prompt('Enter custom JSON data:');
    if (!customData) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const parsedData = JSON.parse(customData);

      const response = await fetch('/api/courses/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
          'Referer': window.location.href,
        },
        body: JSON.stringify(parsedData),
      });

      const data = await response.json();
      setResult(data);

      if (!response.ok) {
        setError(`Error: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : 'Invalid JSON'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Course Creation Debug Page</h1>

          <div className="space-y-6">
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Options</h2>

              <div className="flex flex-wrap gap-4 mb-6">
                <button
                  onClick={handleSimpleCourse}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Simple Course'}
                </button>

                <button
                  onClick={handleComplexCourse}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Create Complex Course (with chapters)'}
                </button>

                <button
                  onClick={handleCustomTest}
                  disabled={isLoading}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {isLoading ? 'Creating...' : 'Custom JSON Test'}
                </button>
              </div>

              <p className="text-sm text-gray-600">
                Note: Check the browser console and server console for detailed debugging information
              </p>
            </div>

            {/* Test Data Display */}
            <div className="border-b pb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Data Preview</h2>
              <details className="cursor-pointer">
                <summary className="text-gray-600 hover:text-gray-800 mb-2">
                  Click to expand test course data
                </summary>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                  {JSON.stringify(testCourseData, null, 2)}
                </pre>
              </details>
            </div>

            {/* Results */}
            {(result || error) && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Results</h2>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h3 className="text-red-800 font-semibold mb-2">Error:</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                {result && (
                  <div className={`${result.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'} border rounded-lg p-4`}>
                    <h3 className={`${result.success ? 'text-green-800' : 'text-yellow-800'} font-semibold mb-2`}>
                      Response (Status: {result.success ? 'Success' : 'Failed'}):
                    </h3>
                    <pre className="text-sm overflow-x-auto">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Links */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Navigation</h2>
              <div className="flex flex-wrap gap-4">
                <a href="/dashboard/admin/courses" className="text-blue-600 hover:text-blue-800 underline">
                  Course Management
                </a>
                <a href="/dashboard/admin/courses/new" className="text-blue-600 hover:text-blue-800 underline">
                  Create Course (Production)
                </a>
                <a href="/debug" className="text-blue-600 hover:text-blue-800 underline">
                  Debug Home
                </a>
                <a href="/dashboard/admin/overview" className="text-blue-600 hover:text-blue-800 underline">
                  Admin Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}