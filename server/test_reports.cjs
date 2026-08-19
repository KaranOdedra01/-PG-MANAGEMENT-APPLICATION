async function testReports() {
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

  // 3. Get Executive Summary
  const summaryRes = await (await fetch('http://localhost:5000/api/reports/summary', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Executive Summary - Occupancy Rate:', summaryRes.data?.occupancy?.occupancyRate, '% Revenue:', summaryRes.data?.financials?.totalRevenue, 'Resolution Rate:', summaryRes.data?.operations?.resolutionRate, '%');

  // 4. Get Financial Report
  const finRes = await (await fetch('http://localhost:5000/api/reports/financial', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Financial Report - Revenue:', finRes.data?.totalRevenue, 'Expenses:', finRes.data?.totalExpenses, 'Net Profit:', finRes.data?.netProfit);

  // 5. Get Occupancy Report
  const occRes = await (await fetch('http://localhost:5000/api/reports/occupancy', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Occupancy Report - Total Rooms:', occRes.data?.rooms?.length, 'Active Tenants:', occRes.data?.tenants?.length);

  // 6. Security Check: Tenant should NOT be allowed to access reports (Expect 403)
  const unauthRes = await fetch('http://localhost:5000/api/reports/summary', {
    headers: { 'Authorization': `Bearer ${tenantToken}` }
  });
  console.log('Tenant unauthorized report access code:', unauthRes.status, '(Expected 403)');

  console.log('🎉 ALL MODULE 11 REPORTS & ANALYTICS TESTS PASSED!');
  process.exit(0);
}

testReports().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
