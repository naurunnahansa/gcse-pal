#!/usr/bin/env node

// Simple webhook test script
const https = require('https');
const http = require('http');

const WEBHOOK_URL = process.argv[2];

if (!WEBHOOK_URL) {
  console.log('❌ Usage: node test-webhook.js <webhook-url>');
  console.log('   Example: node test-webhook.js https://your-ngrok-url.ngrok.io/api/webhooks/workos');
  process.exit(1);
}

console.log('🧪 Testing webhook endpoint...');
console.log(`📍 URL: ${WEBHOOK_URL}`);

// Test GET request (health check)
const protocol = WEBHOOK_URL.startsWith('https') ? https : http;

const options = {
  method: 'GET',
  timeout: 5000
};

const req = protocol.request(WEBHOOK_URL, options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📄 Response:`, data);
    console.log('✅ Webhook endpoint is accessible!');
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.on('timeout', () => {
  console.error('❌ Request timeout');
  req.destroy();
});

req.end();

