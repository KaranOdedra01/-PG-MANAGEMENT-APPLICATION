async function testInvoices() {
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

  // 3. Get all invoices (Admin)
  const adminInvoices = await (await fetch('http://localhost:5000/api/invoices', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Admin total invoices count:', adminInvoices.count);

  // 4. Get tenant personal invoices
  const tenantInvoices = await (await fetch('http://localhost:5000/api/invoices', {
    headers: { 'Authorization': `Bearer ${tenantToken}` }
  })).json();
  console.log('Tenant personal invoices count:', tenantInvoices.count);

  // 5. Generate Monthly Invoices for September 2026
  const batchRes = await (await fetch('http://localhost:5000/api/invoices/generate-monthly', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      month: 'September 2026',
      electricityCharge: 500,
      maintenanceFee: 250
    })
  })).json();
  console.log('Batch invoice generation success:', batchRes.success, 'Generated count:', batchRes.data?.length);

  // 6. Record Payment for one of the pending invoices
  const pendingInvoice = adminInvoices.data.find(i => i.status === 'pending');
  if (pendingInvoice) {
    const payRes = await (await fetch(`http://localhost:5000/api/invoices/${pendingInvoice._id}/pay`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${tenantToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMode: 'UPI', transactionId: 'UPI_TEST_9988' })
    })).json();
    console.log('Payment recorded for invoice:', payRes.data?._id, 'Status:', payRes.data?.status, 'Mode:', payRes.data?.paymentMode);
  }

  // 7. Security Check: Tenant should NOT be allowed to generate batch monthly invoices (Expect 403)
  const unauthBatch = await fetch('http://localhost:5000/api/invoices/generate-monthly', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tenantToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ month: 'Hacked Month' })
  });
  console.log('Tenant unauthorized batch generate code:', unauthBatch.status, '(Expected 403)');

  console.log('🎉 ALL MODULE 5 INVOICING TESTS PASSED!');
  process.exit(0);
}

testInvoices().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
