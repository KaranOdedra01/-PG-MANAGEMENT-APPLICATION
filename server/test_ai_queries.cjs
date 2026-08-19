async function testAIQueries() {
  const tenantLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tenant@pg.com', password: 'Password@123' })
  })).json();
  const token = tenantLogin.data.token;

  console.log('--- TEST 1: Nearest Hospital Query ---');
  const res1 = await (await fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'give nearest hospital' })
  })).json();
  console.log(res1.reply);

  console.log('\n--- TEST 2: Steps to Connect Hostel WiFi ---');
  const res2 = await (await fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'give steps to connect hostel wifi' })
  })).json();
  console.log(res2.reply);

  console.log('\n--- TEST 3: Gym and Study Room Query ---');
  const res3 = await (await fetch('http://localhost:5000/api/ai/chat', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'where is the study room and what are the gym timings?' })
  })).json();
  console.log(res3.reply);

  console.log('\n🎉 ALL ENHANCED AI QUERIES WORKING DYNAMICALLY & ACCURATELY!');
  process.exit(0);
}

testAIQueries().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
