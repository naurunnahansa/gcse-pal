const testCourseCreationWithAuth = async () => {
  try {
    console.log('🔐 Step 1: Getting auth token via bypass...');

    // Step 1: Call bypass sync to set up authentication
    const syncResponse = await fetch('http://localhost:3000/api/auth/sync-bypass', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'naurunnahansa@gmail.com' // Use the admin email from the logs
      })
    });

    console.log('Sync response status:', syncResponse.status);

    if (!syncResponse.ok) {
      console.error('Failed to sync:', await syncResponse.text());
      return;
    }

    const syncResult = await syncResponse.json();
    console.log('Sync successful:', syncResult);

    // Get cookies from the sync response
    const cookies = syncResponse.headers.get('set-cookie');
    console.log('Cookies received:', cookies);

    console.log('📝 Step 2: Testing course creation...');

    // Step 2: Now test course creation with authentication
    const courseResponse = await fetch('http://localhost:3000/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || '', // Forward cookies if any
      },
      body: JSON.stringify({
        title: 'Test Course with Thumbnail',
        description: 'A comprehensive test course covering all aspects of thumbnails',
        subject: 'mathematics',
        level: 'gcse',
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        status: 'published',
        chapters: [
          {
            title: 'Introduction to Thumbnails',
            description: 'Getting started with thumbnail creation',
            isPublished: true,
            duration: 300,
            lessons: [
              {
                title: 'What is a Thumbnail?',
                description: 'Understanding the basics of thumbnails',
                contentType: 'video',
                isPublished: true,
                duration: 180
              }
            ]
          }
        ]
      })
    });

    const courseData = await courseResponse.json();
    console.log('Course creation response status:', courseResponse.status);
    console.log('Course creation response data:', JSON.stringify(courseData, null, 2));

    if (courseResponse.ok && courseData.success) {
      console.log('🎉 SUCCESS! Course created successfully!');
      console.log('Course ID:', courseData.data.id);
      console.log('Course title:', courseData.data.title);
      console.log('Thumbnail URL:', courseData.data.thumbnail);
    } else {
      console.log('❌ Course creation failed');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};

testCourseCreationWithAuth();