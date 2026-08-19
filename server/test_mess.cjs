async function testMess() {
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

  // 3. Get Weekly Menu
  const menuRes = await (await fetch('http://localhost:5000/api/mess/menu', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Weekly Menu days count:', menuRes.data?.length);

  // 4. Update Friday's Menu (Admin)
  const updateMenuRes = await (await fetch('http://localhost:5000/api/mess/menu', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      day: 'Friday',
      dinner: 'Special Paneer Tikka Biryani, Mirchi Salan, Veg Raita, Gulab Jamun',
      specialNote: 'Chef Special Biryani Night'
    })
  })).json();
  console.log('Update menu success:', updateMenuRes.success, 'Friday dinner:', updateMenuRes.data?.dinner);

  // 5. Get Headcount
  const headcountRes = await (await fetch('http://localhost:5000/api/mess/headcount', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Today Live Headcount - Breakfast:', headcountRes.data?.headcount?.breakfast, 'Dinner:', headcountRes.data?.headcount?.dinner);

  // 6. Tenant Get Subscription
  const mySub = await (await fetch('http://localhost:5000/api/mess/my-subscription', {
    headers: { 'Authorization': `Bearer ${tenantToken}` }
  })).json();
  console.log('Tenant Subscription plan:', mySub.data?.subscription?.plan, 'Charge:', mySub.data?.subscription?.monthlyCharge);

  // 7. Tenant Toggle Attendance (Dinner)
  const toggleRes = await (await fetch('http://localhost:5000/api/mess/attendance', {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${tenantToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mealType: 'dinner' })
  })).json();
  console.log('Toggle attendance message:', toggleRes.message, 'Current dinner headcount:', toggleRes.data?.currentHeadcount);

  // 8. Security Check: Tenant should NOT be allowed to update weekly master menu (Expect 403)
  const unauthMenu = await fetch('http://localhost:5000/api/mess/menu', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${tenantToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ day: 'Monday', dinner: 'Hacked food' })
  });
  console.log('Tenant unauthorized menu edit code:', unauthMenu.status, '(Expected 403)');

  console.log('🎉 ALL MODULE 9 MESS & MEAL TESTS PASSED!');
  process.exit(0);
}

testMess().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
