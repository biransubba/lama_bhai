/**
 * Task 3 Test Suite: Partner Room Management (MongoDB-backed)
 * Requires the backend running on http://localhost:5000
 */
const base = 'http://localhost:5000/api';
let passed = 0;
const total = 8;

async function login(email) {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123' }),
  });
  const cookie = res.headers.get('set-cookie')?.split(';')[0];
  return { cookie, json: await res.json(), status: res.status };
}

const call = async (method, path, cookie, body) => {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, json: await res.json() };
};

const check = (name, ok, detail = '') => {
  if (ok) {
    passed++;
    console.log(`✓ PASS: ${name} ${detail}`);
  } else {
    console.error(`✗ FAIL: ${name} ${detail}`);
  }
};

async function run() {
  console.log('=== TASK 3: PARTNER ROOM MANAGEMENT TESTS ===\n');
  const A = await login('norbu_52704@lama.test'); // owns properties
  const B = await login('sonam_47458@lama.test'); // different partner

  // Test 1: load rooms from MongoDB
  const props = await call('GET', '/owner/properties', A.cookie);
  const prop = props.json.data.find((p) => p.name === 'Lachen Mountain Homestay') || props.json.data[0];
  const one = await call('GET', `/owner/properties/${prop._id}`, A.cookie);
  check(
    'Test 1 Load rooms via GET /owner/properties/:id',
    one.status === 200 && Array.isArray(one.json.data.rooms),
    `(property "${prop.name}" has ${one.json.data.rooms.length} room(s))`
  );

  // Test 2: add room
  const add = await call('POST', `/owner/properties/${prop._id}/rooms`, A.cookie, {
    name: 'T3 Test Room',
    type: 'Deluxe Room',
    price: 3100,
    capacity: 3,
    amenities: ['Hot Water'],
    description: 'Task 3 test room',
  });
  const roomId = add.json.data?._id;
  const afterAdd = await call('GET', `/owner/properties/${prop._id}`, A.cookie);
  check(
    'Test 2 Add room via POST',
    add.status === 201 && afterAdd.json.data.rooms.some((r) => r._id === roomId),
    `(roomId ${roomId})`
  );

  // Test 3: edit room
  const edit = await call('PUT', `/owner/rooms/${roomId}`, A.cookie, {
    name: 'T3 Test Room EDITED',
    price: 3300,
    capacity: 4,
    description: 'edited',
    amenities: ['Hot Water', 'Wi-Fi'],
  });
  const afterEdit = await call('GET', `/owner/properties/${prop._id}`, A.cookie);
  const edited = afterEdit.json.data.rooms.find((r) => r._id === roomId);
  check(
    'Test 3 Edit room via PUT persists',
    edit.status === 200 && edited.name === 'T3 Test Room EDITED' && edited.price === 3300 && edited.capacity === 4 && edited.amenities.length === 2
  );

  // Test 4: availability (+ publication status)
  await call('PUT', `/owner/rooms/${roomId}`, A.cookie, { availability: 'unavailable', status: 'draft' });
  const afterAvail = await call('GET', `/owner/properties/${prop._id}`, A.cookie);
  const av = afterAvail.json.data.rooms.find((r) => r._id === roomId);
  check(
    'Test 4 Availability/status persist',
    av.availability === 'unavailable' && av.status === 'draft',
    `(availability=${av.availability}, status=${av.status})`
  );

  // Test 5 (security part 1): Partner B cannot add / edit / delete Partner A's room
  const hackEdit = await call('PUT', `/owner/rooms/${roomId}`, B.cookie, { name: 'HACKED' });
  const hackAdd = await call('POST', `/owner/properties/${prop._id}/rooms`, B.cookie, { name: 'Injected', price: 1 });
  const hackDel = await call('DELETE', `/owner/rooms/${roomId}`, B.cookie);
  const hackGet = await call('GET', `/owner/properties/${prop._id}`, B.cookie);
  check(
    'Test 5 Cross-partner edit/add/delete/get all 403',
    hackEdit.status === 403 && hackAdd.status === 403 && hackDel.status === 403 && hackGet.status === 403,
    `(PUT ${hackEdit.status}, POST ${hackAdd.status}, DELETE ${hackDel.status}, GET ${hackGet.status})`
  );

  // Test 6: delete room
  const del = await call('DELETE', `/owner/rooms/${roomId}`, A.cookie);
  const afterDel = await call('GET', `/owner/properties/${prop._id}`, A.cookie);
  const stillThere = afterDel.json.data.rooms.find((r) => r._id === roomId);
  check(
    'Test 6 Delete room (soft delete, hidden from active list)',
    del.status === 200 && (!stillThere || stillThere.active === false),
    `(active=${stillThere?.active})`
  );

  // Test 7: validation + unauthenticated
  const bad = await call('POST', `/owner/properties/${prop._id}/rooms`, A.cookie, { name: '' });
  const anon = await fetch(`${base}/owner/rooms/${roomId}`, { method: 'PUT' });
  check('Test 7 Validation 400 and unauthenticated 401', bad.status === 400 && anon.status === 401, `(${bad.status}, ${anon.status})`);

  // Test 8: session persists
  const me = await call('GET', '/auth/me', A.cookie);
  check('Test 8 Session still valid via /auth/me', me.status === 200 && me.json.user.email === 'norbu_52704@lama.test');

  console.log(`\nRESULTS: ${passed}/${total} PASSED`);
  process.exit(passed === total ? 0 : 1);
}

run().catch((e) => {
  console.error('Test run crashed:', e);
  process.exit(1);
});
