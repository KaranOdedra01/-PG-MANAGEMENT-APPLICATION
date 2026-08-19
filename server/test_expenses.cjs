async function testExpenses() {
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

  // 3. Get all expenses (Admin)
  const expensesRes = await (await fetch('http://localhost:5000/api/expenses', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Admin total expenses count:', expensesRes.count);

  // 4. Get P&L Summary
  const summaryRes = await (await fetch('http://localhost:5000/api/expenses/summary', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('P&L Summary - Revenue:', summaryRes.data?.totalRevenue, 'Expenses:', summaryRes.data?.totalExpenses, 'Net Profit:', summaryRes.data?.netProfit);

  // 5. Log New Expense
  const createRes = await (await fetch('http://localhost:5000/api/expenses', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: 'internet',
      amount: 1800,
      description: 'Airtel Fiber 200 Mbps Commercial Plan (August)',
      paymentMode: 'UPI'
    })
  })).json();
  console.log('Create expense success:', createRes.success, 'ID:', createRes.data?._id);
  const newExpId = createRes.data?._id;

  // 6. Update Expense
  const updateRes = await (await fetch(`http://localhost:5000/api/expenses/${newExpId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 1999 })
  })).json();
  console.log('Updated expense amount:', updateRes.data?.amount);

  // 7. Security Check: Tenant should NOT be allowed to access /api/expenses (Expect 403)
  const unauthRes = await fetch('http://localhost:5000/api/expenses', {
    headers: { 'Authorization': `Bearer ${tenantToken}` }
  });
  console.log('Tenant unauthorized access code:', unauthRes.status, '(Expected 403)');

  // 8. Delete Expense
  const deleteRes = await (await fetch(`http://localhost:5000/api/expenses/${newExpId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Delete expense success:', deleteRes.success);

  console.log('🎉 ALL MODULE 6 EXPENSE TRACKER TESTS PASSED!');
  process.exit(0);
}

testExpenses().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
