/**
 * Production Test Script for F1 AI Chatbot
 * Run this after deploying to Vercel to verify everything works
 */

const https = require('https');

// Configuration
const BASE_URL = process.env.VERCEL_URL || 'https://your-app-name.vercel.app';
const TESTS = [
  {
    name: 'Health Check',
    method: 'GET',
    path: '/api/health',
    expectedStatus: 200
  },
  {
    name: 'Chat API - General',
    method: 'POST',
    path: '/api/chat',
    body: { message: 'Hi there!' },
    expectedStatus: 200
  },
  {
    name: 'Chat API - Product Search',
    method: 'POST',
    path: '/api/chat',
    body: { message: 'Show me F1 helmets' },
    expectedStatus: 200
  },
  {
    name: 'Search API',
    method: 'POST',
    path: '/api/search',
    body: { query: 'F1 merchandise', maxResults: 5 },
    expectedStatus: 200
  }
];

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'F1-Chatbot-Test/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Testing F1 AI Chatbot Production Deployment');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('─'.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const test of TESTS) {
    try {
      console.log(`\n${test.name}...`);
      
      const startTime = Date.now();
      const result = await makeRequest(test.method, test.path, test.body);
      const duration = Date.now() - startTime;

      if (result.status === test.expectedStatus) {
        console.log(`PASS (${duration}ms)`);
        passed++;
        
        // Show sample response for chat/search APIs
        if (test.path.includes('/api/chat') || test.path.includes('/api/search')) {
          if (result.data.success && result.data.data) {
            const data = result.data.data;
            if (data.products && data.products.length > 0) {
              console.log(`   Found ${data.products.length} products`);
              console.log(`   Sources: ${data.sources ? data.sources.join(', ') : 'N/A'}`);
            } else if (data.message) {
              console.log(`   Response: ${data.message.substring(0, 100)}...`);
            }
          }
        }
      } else {
        console.log(`FAIL - Expected ${test.expectedStatus}, got ${result.status}`);
        console.log(`   Response: ${JSON.stringify(result.data).substring(0, 200)}...`);
        failed++;
      }
    } catch (error) {
      console.log(`ERROR - ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('All tests passed! Your F1 AI Chatbot is ready for production!');
  } else {
    console.log('Some tests failed. Check the deployment and try again.');
  }
}

// Run tests
runTests().catch(console.error);
