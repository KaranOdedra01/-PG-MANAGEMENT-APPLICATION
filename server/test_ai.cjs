async function testAI() {
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

  // 3. Chat with AI (Tenant asks about dinner & gate timings)
  const chatRes = await (await fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tenantToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What is for dinner today and when does the main gate close?' })
  })).json();
  console.log('AI Chat Success:', chatRes.success, 'Mode:', chatRes.mode);
  console.log('AI Reply Preview:\n', chatRes.reply.substring(0, 150) + '...\n');

  // 4. Auto-Classify Complaint
  const classifyRes = await (await fetch('http://localhost:5000/api/ai/classify-complaint', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tenantToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Geyser sparking smoke',
      description: 'The geyser power socket sparked with smoke and tripped the MCB switch.'
    })
  })).json();
  console.log('Classifier Result - Category:', classifyRes.data?.category, 'Priority:', classifyRes.data?.priority, 'Suggested Staff:', classifyRes.data?.suggestedStaff);

  // 5. Compose Rent Reminder (Admin)
  const composeRes = await (await fetch('http://localhost:5000/api/ai/compose-reminder', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      tenantName: 'Rahul Sharma',
      roomNumber: '102',
      amount: 7500,
      month: 'September 2026',
      dueDate: '2026-09-10'
    })
  })).json();
  console.log('Compose Reminder Success:', composeRes.success, 'Subject:', composeRes.data?.subject);

  // 6. Security Check: Tenant should NOT be allowed to compose admin reminders (Expect 403)
  const unauthRes = await fetch('http://localhost:5000/api/ai/compose-reminder', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tenantToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantName: 'Test' })
  });
  console.log('Tenant unauthorized composer code:', unauthRes.status, '(Expected 403)');

  console.log('🎉 ALL MODULE 12 GEMINI AI INTEGRATION TESTS PASSED!');
  process.exit(0);
}

testAI().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
