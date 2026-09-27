const test = require('node:test');
const assert = require('node:assert');
const app = require('../app');

let server;
let baseUrl;

test.before(() => {
  server = app.listen(0); // 0 = let the OS pick a free port
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;
});

test.after(() => {
  server.close();
});

test('GET /health returns status ok', async () => {
  const res = await fetch(`${baseUrl}/health`);
  const data = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.status, 'ok');
});

test('POST /api/book books an available slot successfully', async () => {
  const res = await fetch(`${baseUrl}/api/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: 'Alice',
      vehicleNumber: 'MH12AB1111',
      slotId: 'A1',
    }),
  });
  const data = await res.json();

  assert.strictEqual(res.status, 201);
  assert.strictEqual(data.slot.status, 'OCCUPIED');
  assert.strictEqual(data.slot.vehicleNumber, 'MH12AB1111');
});

test('POST /api/book rejects booking an already-occupied slot', async () => {
  // A1 was booked in the previous test, so it should now be OCCUPIED
  const res = await fetch(`${baseUrl}/api/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: 'Bob',
      vehicleNumber: 'MH12CD2222',
      slotId: 'A1',
    }),
  });
  const data = await res.json();

  assert.strictEqual(res.status, 409);
  assert.ok(data.error);
});

test('POST /api/book rejects an invalid vehicle number', async () => {
  const res = await fetch(`${baseUrl}/api/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userName: 'Charlie',
      vehicleNumber: 'invalid123',
      slotId: 'A2',
    }),
  });
  const data = await res.json();

  assert.strictEqual(res.status, 400);
  assert.ok(data.error);
});

test('POST /api/release/:slotId releases an occupied slot', async () => {
  // A1 is still occupied from the earlier successful booking test
  const res = await fetch(`${baseUrl}/api/release/A1`, {
    method: 'POST',
  });
  const data = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(data.slot.status, 'AVAILABLE');
  assert.strictEqual(data.slot.vehicleNumber, null);
});

test('GET /api/slots returns an array of 12 slots', async () => {
  const res = await fetch(`${baseUrl}/api/slots`);
  const data = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(Array.isArray(data), true);
  assert.strictEqual(data.length, 99);
});