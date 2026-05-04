#!/bin/bash
# Stuck task detection (every 30 min) - Abelo Creative
node -e "
const http = require('http');
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/tasks/check-stuck',
  method: 'POST',
  headers: { 'Authorization': 'Bearer ${CEO_JWT}' }
};
http.request(options).end();
"
