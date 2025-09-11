// Test backend connectivity
fetch('https://tourist-safety-five.vercel.app/api/v1/health')
  .then(response => {
    console.log('Backend Status:', response.status);
    console.log('Backend Headers:', response.headers);
    return response.json();
  })
  .then(data => {
    console.log('Backend Response:', data);
  })
  .catch(error => {
    console.error('Backend Error:', error);
  });

// Test the API service
import('./src/services/api.ts').then(module => {
  const apiService = new module.default();
  console.log('API Service initialized with base URL:', apiService.getBaseURL());
});
