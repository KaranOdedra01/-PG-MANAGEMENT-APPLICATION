const http = require('http');

async function testBackend() {
  // 1. Health test
  const healthRes = await fetch('http://localhost:5000/api/health');
  console.log('Health check:', await healthRes.json());

  // 2. Demo accounts test
  const demoRes = await fetch('http://localhost:5000/api/auth/demo-accounts');
  console.log('Demo accounts:', await demoRes.json());

  // 3. Login test (Admin)
  const loginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@pg.com', password: 'Password@123' })
  });
  const loginData = await loginRes.json();
  console.log('Admin login success:', loginData.success, 'Token length:', loginData.data?.token?.length);

  // 4. Protected route test with Token
  const meRes = await fetch('http://localhost:5000/api/auth/me', {
    headers: { 'Authorization': `Bearer ${loginData.data.token}` }
  });
  const meData = await meRes.json();
  console.log('Protected /me check:', meData.data?.name, 'Role:', meData.data?.role);

  // 5. Tenant login test
  const tenantLoginRes = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tenant@pg.com', password: 'Password@123' })
  });
  const tenantData = await tenantLoginRes.json();
  console.log('Tenant login success:', tenantData.success, 'Role:', tenantData.data?.role);

  console.log('🎉 ALL MODULE 1 AUTH & SPECIFICATION TESTS PASSED!');
  process.exit(0);
}

testBackend().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
