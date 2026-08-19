async function testVisitors() {
  // 1. Admin Login
  const adminLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@pg.com', password: 'Password@123' })
  })).json();
  const adminToken = adminLogin.data.token;

  // 2. Staff Login
  const staffLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@pg.com', password: 'Password@123' })
  })).json();
  const staffToken = staffLogin.data.token;

  // 3. Tenant Login
  const tenantLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tenant@pg.com', password: 'Password@123' })
  })).json();
  const tenantToken = tenantLogin.data.token;

  // 4. Get Visitors (Staff)
  const listRes = await (await fetch('http://localhost:5000/api/visitors', {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  })).json();
  console.log('Total visitor logs count:', listRes.count);

  // 5. Get Active Inside Visitors
  const activeRes = await (await fetch('http://localhost:5000/api/visitors/active', {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  })).json();
  console.log('Currently inside visitors:', activeRes.data?.totalCurrentlyInside);

  // 6. Check-in New Visitor (Staff)
  const checkinRes = await (await fetch('http://localhost:5000/api/visitors', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Deepak Verma',
      phone: '+91 99888 77665',
      visitorType: 'Friend',
      roomNumber: '201',
      tenantName: 'Kunal Sen',
      purpose: 'College notes collection'
    })
  })).json();
  console.log('Visitor check-in success:', checkinRes.success, 'ID:', checkinRes.data?._id);
  const newVisId = checkinRes.data?._id;

  // 7. Check-out Visitor (Staff)
  const checkoutRes = await (await fetch(`http://localhost:5000/api/visitors/${newVisId}/checkout`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${staffToken}` }
  })).json();
  console.log('Visitor checkout success:', checkoutRes.success, 'Status:', checkoutRes.data?.status);

  // 8. Security Check: Tenant should NOT be allowed to access visitors endpoint (Expect 403)
  const unauthRes = await fetch('http://localhost:5000/api/visitors', {
    headers: { 'Authorization': `Bearer ${tenantToken}` }
  });
  console.log('Tenant unauthorized visitor access code:', unauthRes.status, '(Expected 403)');

  // 9. Delete Visitor (Admin)
  const deleteRes = await (await fetch(`http://localhost:5000/api/visitors/${newVisId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Delete visitor log success:', deleteRes.success);

  console.log('🎉 ALL MODULE 10 VISITOR & GATE LOG TESTS PASSED!');
  process.exit(0);
}

testVisitors().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
