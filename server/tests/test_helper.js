import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../src/server.js';

export const TEST_JWT_SECRET = 'unit_testing_secure_jwt_secret_key_32_characters_long_2026';
process.env.JWT_SECRET = TEST_JWT_SECRET;
process.env.NODE_ENV = 'test';

export const createTestToken = (id, role = 'tenant') => {
  return jwt.sign({ id, role }, TEST_JWT_SECRET, { expiresIn: '1h' });
};

let testServer = null;
let serverPort = null;

export const startTestServer = () => {
  return new Promise((resolve) => {
    if (testServer) return resolve(serverPort);
    testServer = http.createServer(app);
    testServer.listen(0, '127.0.0.1', () => {
      serverPort = testServer.address().port;
      resolve(serverPort);
    });
  });
};

export const closeTestServer = () => {
  return new Promise((resolve) => {
    if (!testServer) return resolve();
    testServer.close(() => {
      testServer = null;
      serverPort = null;
      resolve();
    });
  });
};

export const requestTestApi = async (path, options = {}) => {
  const port = await startTestServer();
  const url = `http://127.0.0.1:${port}${path}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.token && { 'Authorization': `Bearer ${options.token}` }),
    ...options.headers
  };

  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  return {
    status: res.status,
    headers: Object.fromEntries(res.headers.entries()),
    body
  };
};
