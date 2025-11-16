const testCourseCreation = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
};

testCourseCreation();