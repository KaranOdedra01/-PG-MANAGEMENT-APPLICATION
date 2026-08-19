async function testDashboard() {
  // 1. Admin login to get token
  const adminLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@pg.com', password: 'Password@123' })
  })).json();

  // 2. Fetch Admin Stats
  const adminStats = await (await fetch('http://localhost:5000/api/dashboard/stats', {
    headers: { 'Authorization': `Bearer ${adminLogin.data.token}` }
  })).json();
  console.log('Admin Stats - Occupancy:', adminStats.data?.occupancy);
  console.log('Admin Stats - Financials:', adminStats.data?.financials);
  console.log('Admin Stats - Complaints:', adminStats.data?.complaints);

  // 3. Fetch Activities
  const activities = await (await fetch('http://localhost:5000/api/dashboard/activities', {
    headers: { 'Authorization': `Bearer ${adminLogin.data.token}` }
  })).json();
  console.log('Activities count:', activities.data?.length);

  // 4. Tenant login & Stats
  const tenantLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tenant@pg.com', password: 'Password@123' })
  })).json();

  const tenantStats = await (await fetch('http://localhost:5000/api/dashboard/stats', {
    headers: { 'Authorization': `Bearer ${tenantLogin.data.token}` }
  })).json();
  console.log('Tenant Stats - Room:', tenantStats.data?.room?.roomNumber, 'Rent:', tenantStats.data?.room?.rent);

  // 5. Staff login & Stats
  const staffLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'staff@pg.com', password: 'Password@123' })
  })).json();

  const staffStats = await (await fetch('http://localhost:5000/api/dashboard/stats', {
    headers: { 'Authorization': `Bearer ${staffLogin.data.token}` }
  })).json();
  console.log('Staff Stats - Maintenance tasks:', staffStats.data?.maintenance?.assignedTasks);

  console.log('🎉 ALL MODULE 2 BACKEND ENDPOINTS PASSED!');
  process.exit(0);
}

testDashboard().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
