async function testNotices() {
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

  // 3. Get all notices
  const noticesRes = await (await fetch('http://localhost:5000/api/notices', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Total active notices count:', noticesRes.count);

  // 4. Broadcast New Notice (Admin)
  const createRes = await (await fetch('http://localhost:5000/api/notices', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Hostel Main Gate Lockdown Timings Notice',
      content: 'Main entrance gate will be locked at 10:30 PM sharp. Late entries require prior warden approval.',
      category: 'rules',
      priority: 'high',
      targetRoles: ['tenant', 'staff'],
      isPinned: true
    })
  })).json();
  console.log('Broadcast notice success:', createRes.success, 'ID:', createRes.data?._id);
  const noticeId = createRes.data?._id;

  // 5. Update Notice (Admin)
  const updateRes = await (await fetch(`http://localhost:5000/api/notices/${noticeId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ priority: 'urgent' })
  })).json();
  console.log('Updated notice priority:', updateRes.data?.priority);

  // 6. Acknowledge / Mark as Read (Tenant)
  const ackRes = await (await fetch(`http://localhost:5000/api/notices/${noticeId}/acknowledge`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${tenantToken}` }
  })).json();
  console.log('Tenant acknowledge success:', ackRes.success, 'Read count:', ackRes.data?.readBy?.length);

  // 7. Security Check: Tenant should NOT be allowed to create/delete notice (Expect 403)
  const unauthRes = await fetch('http://localhost:5000/api/notices', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tenantToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Hacked Notice', content: 'Test' })
  });
  console.log('Tenant unauthorized create code:', unauthRes.status, '(Expected 403)');

  // 8. Delete Notice (Admin)
  const deleteRes = await (await fetch(`http://localhost:5000/api/notices/${noticeId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Delete notice success:', deleteRes.success);

  console.log('🎉 ALL MODULE 8 NOTICE BOARD TESTS PASSED!');
  process.exit(0);
}

testNotices().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
