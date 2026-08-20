import jwt from 'jsonwebtoken';
import app from '../src/server.js';

export const TEST_JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_pg_jwt_key_2026';

export const createTestToken = (id, role = 'tenant') => {
  return jwt.sign({ id, role }, TEST_JWT_SECRET, { expiresIn: '1h' });
};

export const makeRequest = async (path, options = {}) => {
  const port = process.env.PORT || 5000;
  const url = `http://localhost:${port}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.token && { 'Authorization': `Bearer ${options.token}` }),
    ...options.headers
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    json = { raw: text };
  }

  return {
    status: response.status,
    headers: response.headers,
    body: json
  };
};
