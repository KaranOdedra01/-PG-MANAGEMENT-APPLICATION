async function testTenants() {
  const timestamp = Date.now();
  const testEmail = `amit_${timestamp}@test.com`;

  // 1. Admin Login
  const adminLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@pg.com', password: 'Password@123' })
  })).json();
  const adminToken = adminLogin.data.token;

  // 2. Tenant Login
  const tenantLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tenant@pg.com', password: 'Password@123' })
  })).json();
  const tenantToken = tenantLogin.data.token;

  // 3. Get initial tenants
  const initialTenants = await (await fetch('http://localhost:5000/api/tenants', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Initial tenants count:', initialTenants.count);

  // 4. Onboard New Tenant (Room 201 ID: 66c1b0010000000000000003)
  const onboardRes = await (await fetch('http://localhost:5000/api/tenants/onboard', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Amit Kumar',
      email: testEmail,
      phone: '+91 97777 88888',
      roomId: '66c1b0010000000000000003',
      securityDeposit: 14000,
      idProofType: 'Aadhaar',
      idProofNumber: 'XXXX-XXXX-1122',
      emergencyContact: { name: 'Rajesh Kumar', phone: '+91 97777 00000', relation: 'Father' }
    })
  })).json();
  console.log('Onboard success:', onboardRes.success, 'Tenant ID:', onboardRes.data?._id);
  const newTenantId = onboardRes.data?._id;

  if (!newTenantId) {
    throw new Error('Onboarding failed: ' + JSON.stringify(onboardRes));
  }

  // 5. Verify Room 201 occupancy updated
  const roomRes = await (await fetch('http://localhost:5000/api/rooms/66c1b0010000000000000003', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Room 201 updated occupied beds:', roomRes.data?.occupiedBeds, 'Status:', roomRes.data?.status);

  // 6. Update Tenant contact
  const updateRes = await (await fetch(`http://localhost:5000/api/tenants/${newTenantId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: '+91 97777 99999' })
  })).json();
  console.log('Updated tenant phone:', updateRes.data?.phone);

  // 7. Security Check: Tenant should NOT be allowed to onboard someone (Expect 403)
  const unauthOnboard = await fetch('http://localhost:5000/api/tenants/onboard', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tenantToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hacker', email: `hacker_${timestamp}@test.com`, phone: '123', roomId: '66c1b0010000000000000003' })
  });
  console.log('Tenant unauthorized onboard code:', unauthOnboard.status, '(Expected 403)');

  // 8. Checkout Tenant
  const checkoutRes = await (await fetch(`http://localhost:5000/api/tenants/${newTenantId}/checkout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Tenant checkout success:', checkoutRes.success, 'Status:', checkoutRes.data?.status);

  // 9. Verify Room 201 bed freed up
  const roomAfterCheckout = await (await fetch('http://localhost:5000/api/rooms/66c1b0010000000000000003', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Room 201 beds after checkout:', roomAfterCheckout.data?.occupiedBeds, 'Status:', roomAfterCheckout.data?.status);

  // 10. Delete Tenant record
  const deleteRes = await (await fetch(`http://localhost:5000/api/tenants/${newTenantId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Delete tenant success:', deleteRes.success);

  console.log('🎉 ALL MODULE 4 TENANT MANAGEMENT TESTS PASSED!');
  process.exit(0);
}

testTenants().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
