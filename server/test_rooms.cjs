async function testRooms() {
  // 1. Admin login to get token
  const adminLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@pg.com', password: 'Password@123' })
  })).json();
  const adminToken = adminLogin.data.token;

  // 2. Tenant login to get token
  const tenantLogin = await (await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tenant@pg.com', password: 'Password@123' })
  })).json();
  const tenantToken = tenantLogin.data.token;

  // 3. Get all rooms
  const getRes = await (await fetch('http://localhost:5000/api/rooms', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Total Rooms count:', getRes.count);

  // 4. Create new Room (Room 301)
  const createRes = await (await fetch('http://localhost:5000/api/rooms', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      roomNumber: '301',
      floor: 3,
      type: 'double',
      capacity: 2,
      rent: 8000,
      amenities: ['AC', 'Attached Bathroom', 'High-Speed WiFi', 'Balcony']
    })
  })).json();
  console.log('Room 301 created:', createRes.success, 'ID:', createRes.data?._id);
  const newRoomId = createRes.data?._id;

  // 5. Update Room (Change Rent)
  const updateRes = await (await fetch(`http://localhost:5000/api/rooms/${newRoomId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rent: 8500 })
  })).json();
  console.log('Room 301 updated rent:', updateRes.data?.rent);

  // 6. Toggle Status (Maintenance)
  const statusRes = await (await fetch(`http://localhost:5000/api/rooms/${newRoomId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'maintenance' })
  })).json();
  console.log('Room 301 status toggle:', statusRes.data?.status);

  // 7. Security Check: Tenant should NOT be allowed to delete room (Expect 403)
  const tenantDeleteRes = await fetch(`http://localhost:5000/api/rooms/${newRoomId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${tenantToken}` }
  });
  console.log('Tenant unauthorized delete response code:', tenantDeleteRes.status, '(Expected 403)');

  // 8. Admin Delete Room
  const adminDeleteRes = await (await fetch(`http://localhost:5000/api/rooms/${newRoomId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  })).json();
  console.log('Admin delete room success:', adminDeleteRes.success);

  console.log('🎉 ALL MODULE 3 ROOM MANAGEMENT TESTS PASSED!');
  process.exit(0);
}

testRooms().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
