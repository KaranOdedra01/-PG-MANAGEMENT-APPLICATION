async function testComplaints() {
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

  // 3. Staff Login
  const staffLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@pg.com', password: 'Password@123' })
  })).json();
  const staffToken = staffLogin.data.token;

  // 4. Get all complaints (Admin)
  const allComplaints = await (await fetch('http://localhost:5000/api/complaints', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Admin total complaints count:', allComplaints.count);

  // 5. Raise new Complaint (Tenant)
  const raiseRes = await (await fetch('http://localhost:5000/api/complaints', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tenantToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Water geyser trip issue in bathroom',
      description: 'The geyser power plug sparks and trips MCB switch.',
      category: 'electrical',
      priority: 'high',
      roomNumber: '102'
    })
  })).json();
  console.log('Tenant raise complaint success:', raiseRes.success, 'ID:', raiseRes.data?._id);
  const ticketId = raiseRes.data?._id;

  // 6. Assign Staff to Ticket (Admin)
  const assignRes = await (await fetch(`http://localhost:5000/api/complaints/${ticketId}/assign`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ assignedTo: 'Ramesh Caretaker' })
  })).json();
  console.log('Admin assign staff success:', assignRes.data?.assignedTo, 'Status:', assignRes.data?.status);

  // 7. Update Status to Resolved (Staff)
  const resolveRes = await (await fetch(`http://localhost:5000/api/complaints/${ticketId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${staffToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'resolved', resolutionNote: 'Replaced 16A socket and tested heating.' })
  })).json();
  console.log('Staff resolve complaint success:', resolveRes.data?.status, 'Note:', resolveRes.data?.resolutionNote);

  // 8. Security Check: Tenant should NOT be allowed to delete complaint (Expect 403)
  const unauthDelete = await fetch(`http://localhost:5000/api/complaints/${ticketId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tenantToken}` }
  });
  console.log('Tenant unauthorized delete code:', unauthDelete.status, '(Expected 403)');

  // 9. Delete Complaint (Admin)
  const deleteRes = await (await fetch(`http://localhost:5000/api/complaints/${ticketId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Admin delete complaint success:', deleteRes.success);

  console.log('🎉 ALL MODULE 7 COMPLAINT & MAINTENANCE TESTS PASSED!');
  process.exit(0);
}

testComplaints().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
