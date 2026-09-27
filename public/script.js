const notificationEl = document.getElementById('notification');
const slotsGrid = document.getElementById('slots-grid');
const bookingForm = document.getElementById('booking-form');
const slotSelect = document.getElementById('slotId');
const bookingsBody = document.getElementById('bookings-body');

const totalSlotsEl = document.getElementById('total-slots');
const availableSlotsEl = document.getElementById('available-slots');
const occupiedSlotsEl = document.getElementById('occupied-slots');
const activeVehiclesEl = document.getElementById('active-vehicles');
const commitIdEl = document.getElementById('commit-id');

function showNotification(message, type) {
  notificationEl.textContent = message;
  notificationEl.className = `notification ${type}`;
  setTimeout(() => {
    notificationEl.className = 'notification hidden';
  }, 4000);
}

async function fetchSlots() {
  const res = await fetch('/api/slots');
  const slots = await res.json();
  renderSlots(slots);
  renderDashboard(slots);
  renderSlotOptions(slots);
}

async function fetchBookings() {
  const res = await fetch('/api/bookings');
  const bookings = await res.json();
  renderBookings(bookings);
}

function renderDashboard(slots) {
  const total = slots.length;
  const available = slots.filter((s) => s.status === 'AVAILABLE').length;
  const occupied = total - available;

  totalSlotsEl.textContent = total;
  availableSlotsEl.textContent = available;
  occupiedSlotsEl.textContent = occupied;
  activeVehiclesEl.textContent = occupied;
}

function renderSlots(slots) {
  slotsGrid.innerHTML = '';

  slots.forEach((slot) => {
    const card = document.createElement('div');
    card.className = `slot-card ${slot.status === 'AVAILABLE' ? 'slot-available' : 'slot-occupied'}`;

    const idEl = document.createElement('div');
    idEl.className = 'slot-id';
    idEl.textContent = slot.slotId;

    const statusEl = document.createElement('div');
    statusEl.className = 'slot-status';
    statusEl.textContent = slot.status;

    card.appendChild(idEl);
    card.appendChild(statusEl);

    if (slot.status === 'OCCUPIED') {
      const vehicleEl = document.createElement('div');
      vehicleEl.className = 'slot-vehicle';
      vehicleEl.textContent = slot.vehicleNumber;
      card.appendChild(vehicleEl);

      const releaseBtn = document.createElement('button');
      releaseBtn.className = 'slot-card-btn';
      releaseBtn.textContent = 'Release';
      releaseBtn.addEventListener('click', () => releaseSlot(slot.slotId));
      card.appendChild(releaseBtn);
    } else {
      const bookBtn = document.createElement('button');
      bookBtn.className = 'slot-card-btn';
      bookBtn.textContent = 'Book';
      bookBtn.addEventListener('click', () => {
        slotSelect.value = slot.slotId;
        document.getElementById('userName').focus();
      });
      card.appendChild(bookBtn);
    }

    slotsGrid.appendChild(card);
  });
}

function renderSlotOptions(slots) {
  const currentValue = slotSelect.value;
  slotSelect.innerHTML = '<option value="">Select an available slot</option>';

  slots
    .filter((s) => s.status === 'AVAILABLE')
    .forEach((s) => {
      const option = document.createElement('option');
      option.value = s.slotId;
      option.textContent = s.slotId;
      slotSelect.appendChild(option);
    });

  slotSelect.value = currentValue;
}

function renderBookings(bookings) {
  bookingsBody.innerHTML = '';

  bookings.forEach((b) => {
    const row = document.createElement('tr');

    const cells = [
      b.slotId,
      b.bookingId,
      b.userName,
      b.vehicleNumber,
      new Date(b.entryTime).toLocaleString(),
      b.estimatedFee,
    ];

    cells.forEach((value) => {
      const td = document.createElement('td');
      td.textContent = value;
      row.appendChild(td);
    });

    bookingsBody.appendChild(row);
  });
}

async function refreshAll() {
  await fetchSlots();
  await fetchBookings();
}

bookingForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userName = document.getElementById('userName').value;
  const vehicleNumber = document.getElementById('vehicleNumber').value;
  const slotId = slotSelect.value;

  try {
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userName, vehicleNumber, slotId }),
    });

    const data = await res.json();

    if (!res.ok) {
      showNotification(data.error || 'Booking failed.', 'error');
      return;
    }

    showNotification(data.message, 'success');
    bookingForm.reset();
    await refreshAll();
  } catch {
    showNotification('Something went wrong. Please try again.', 'error');
  }
});

async function releaseSlot(slotId) {
  try {
    const res = await fetch(`/api/release/${slotId}`, { method: 'POST' });
    const data = await res.json();

    if (!res.ok) {
      showNotification(data.error || 'Release failed.', 'error');
      return;
    }

    showNotification(data.message, 'success');
    await refreshAll();
  } catch {
    showNotification('Something went wrong. Please try again.', 'error');
  }
}

async function loadCommitId() {
  try {
    const res = await fetch('/health');
    const data = await res.json();
    commitIdEl.textContent = data.commit;
  } catch {
    commitIdEl.textContent = 'unknown';
  }
}

// Initial load
loadCommitId();
refreshAll();

// Auto-refresh every 10 seconds so fee estimates stay current
setInterval(refreshAll, 10000);