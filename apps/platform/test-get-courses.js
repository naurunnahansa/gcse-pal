const testGetCourses = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/courses');
    const data = await response.json();
    console.log('GET courses response status:', response.status);
    console.log('GET courses response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
};

testGetCourses();