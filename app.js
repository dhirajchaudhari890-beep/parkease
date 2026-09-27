const express = require('express');
const path = require('path');

const app = express();

// Parse JSON request bodies (needed for POST /api/book)
app.use(express.json());

// Serve static frontend files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// ---------------------------------------------
// In-memory parking data
// ---------------------------------------------

function createInitialSlots() {
  const rows = ['A', 'B', 'C'];
  const slots = [];
  for (const row of rows) {
    for (let i = 1; i <= 4; i += 1) {
      slots.push({
        slotId: `${row}${i}`,
        status: 'AVAILABLE',
        vehicleNumber: null,
        userName: null,
        entryTime: null,
        bookingId: null,
      });
    }
  }
  return slots;
}

let slots = createInitialSlots();
let bookingCounter = 1;

// ---------------------------------------------
// Helpers
// ---------------------------------------------

// Basic Indian vehicle number pattern, e.g. MH15AB1234
const VEHICLE_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;

function isValidVehicleNumber(value) {
  if (typeof value !== 'string') return false;
  return VEHICLE_REGEX.test(value.trim().toUpperCase());
}

function findSlot(slotId) {
  return slots.find((s) => s.slotId === slotId);
}

function calculateParkingFee(entryTime) {
  const now = Date.now();
  const elapsedMs = now - new Date(entryTime).getTime();
  const elapsedHours = Math.max(1, Math.ceil(elapsedMs / (1000 * 60 * 60)));

  const FIRST_HOUR_FEE = 20;
  const EXTRA_HOUR_FEE = 10;

  if (elapsedHours <= 1) return FIRST_HOUR_FEE;
  return FIRST_HOUR_FEE + (elapsedHours - 1) * EXTRA_HOUR_FEE;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------
// Routes
// ---------------------------------------------

app.get('/health', (req, res) => {
  const commit = process.env.RENDER_GIT_COMMIT
    ? process.env.RENDER_GIT_COMMIT.substring(0, 7)
    : 'local';
  res.status(200).json({ status: 'ok', commit });
});

app.get('/api/slots', (req, res) => {
  res.status(200).json(slots);
});

app.get('/api/bookings', (req, res) => {
  const active = slots
    .filter((s) => s.status === 'OCCUPIED')
    .map((s) => ({
      slotId: s.slotId,
      bookingId: s.bookingId,
      userName: escapeHtml(s.userName),
      vehicleNumber: s.vehicleNumber,
      entryTime: s.entryTime,
      estimatedFee: calculateParkingFee(s.entryTime),
    }));
  res.status(200).json(active);
});

app.post('/api/book', (req, res) => {
  const { userName, vehicleNumber, slotId } = req.body || {};

  if (!userName || typeof userName !== 'string' || !userName.trim()) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  if (!vehicleNumber || typeof vehicleNumber !== 'string' || !vehicleNumber.trim()) {
    return res.status(400).json({ error: 'Vehicle number is required.' });
  }

  const cleanVehicle = vehicleNumber.trim().toUpperCase();

  if (!isValidVehicleNumber(cleanVehicle)) {
    return res.status(400).json({ error: 'Invalid vehicle number format. Example: MH15AB1234' });
  }

  if (!slotId || typeof slotId !== 'string') {
    return res.status(400).json({ error: 'Parking slot is required.' });
  }

  const slot = findSlot(slotId);

  if (!slot) {
    return res.status(404).json({ error: `Slot ${slotId} does not exist.` });
  }

  if (slot.status !== 'AVAILABLE') {
    return res.status(409).json({ error: `Slot ${slotId} is already occupied.` });
  }

  const alreadyParked = slots.find(
    (s) => s.status === 'OCCUPIED' && s.vehicleNumber === cleanVehicle,
  );
  if (alreadyParked) {
    return res.status(409).json({
      error: `Vehicle ${cleanVehicle} already has an active booking in slot ${alreadyParked.slotId}.`,
    });
  }

  slot.status = 'OCCUPIED';
  slot.vehicleNumber = cleanVehicle;
  slot.userName = userName.trim();
  slot.entryTime = new Date().toISOString();
  slot.bookingId = `BK${String(bookingCounter).padStart(4, '0')}`;
  bookingCounter += 1;

  return res.status(201).json({
    message: 'Slot booked successfully.',
    slot,
  });
});

app.post('/api/release/:slotId', (req, res) => {
  const { slotId } = req.params;
  const slot = findSlot(slotId);

  if (!slot) {
    return res.status(404).json({ error: `Slot ${slotId} does not exist.` });
  }

  if (slot.status !== 'OCCUPIED') {
    return res.status(400).json({ error: `Slot ${slotId} is not currently occupied.` });
  }

  slot.status = 'AVAILABLE';
  slot.vehicleNumber = null;
  slot.userName = null;
  slot.entryTime = null;
  slot.bookingId = null;

  return res.status(200).json({ message: `Slot ${slotId} released successfully.`, slot });
});

// Exported for tests, and used by server.js to actually start listening
module.exports = app;