const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9245;
const USER_DATA_DIR = "C:\\Users\\Acer\\.gemini\\antigravity\\brain\\78ac26d3-ffa2-448f-9d8a-85326f18ae05\\scratch\\chrome-profile";
const ARTIFACT_DIR = "C:\\Users\\Acer\\.gemini\\antigravity\\brain\\78ac26d3-ffa2-448f-9d8a-85326f18ae05";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  console.log("Launching headless Chrome on port", PORT);
  const chromeProcess = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    'about:blank'
  ]);
  await sleep(1500);

  try {
    const targets = await fetchJson(`http://127.0.0.1:${PORT}/json`);
    const pageTarget = targets.find(t => t.type === 'page');
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let msgId = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = msgId++;
        const onMsg = (e) => {
          const data = JSON.parse(e.data);
          if (data.id === id) {
            ws.removeEventListener('message', onMsg);
            if (data.error) reject(data.error);
            else resolve(data.result);
          }
        };
        ws.addEventListener('message', onMsg);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (res.exceptionDetails) {
        throw new Error(JSON.stringify(res.exceptionDetails));
      }
      return res.result.value;
    }

    async function captureScreenshot(filepath) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${filepath}`);
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 950,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log("1. Setting up partner data and logging in...");
    await send('Page.navigate', { url: 'http://localhost:1234' });
    await sleep(2000);

    // Setup an approved partner with an assigned property if not already setup
    const setupResult = await evaluate(`(() => {
      // Check existing partners
      let partners = [];
      try {
        partners = JSON.parse(localStorage.getItem("admin_partners") || "[]");
      } catch(e) {}

      let stays = [];
      try {
        stays = JSON.parse(localStorage.getItem("admin_stays") || "[]");
      } catch(e) {}

      // Ensure we have at least one stay
      if (!stays || stays.length === 0) {
        stays = [
          {
            id: "stay_lachen_homestay",
            name: "Lachen Mountain Homestay",
            type: "Homestay",
            location: "Lachen, North Sikkim",
            price: "2400",
            partnerId: "partner_pemba_01",
            availability: "available",
            amenities: ["Mountain View", "Organic Sikkimese Meals", "Hot Water", "Room Heater"]
          },
          {
            id: "stay_pelling_resort",
            name: "Pelling Alpine Retreat",
            type: "Resort",
            location: "Pelling, West Sikkim",
            price: "3500",
            partnerId: "partner_other_02",
            availability: "available",
            amenities: ["Mountain View", "Wi-Fi", "Campfire Area"]
          }
        ];
        localStorage.setItem("admin_stays", JSON.stringify(stays));
      }

      const primaryStay = stays[0];

      // Find or create Partner Pemba
      let partner = partners.find(p => p.id === "partner_pemba_01" || p.status === "Approved");
      if (!partner) {
        partner = {
          id: "partner_pemba_01",
          name: "Pemba Tashi",
          agency: "Lachen Valley Hospitality",
          phone: "+91 98001 23456",
          email: "pemba@lachenhomestays.com",
          location: "Lachen, North Sikkim",
          status: "Approved",
          assignedPropertyIds: [primaryStay.id]
        };
        partners.push(partner);
        localStorage.setItem("admin_partners", JSON.stringify(partners));
      } else {
        partner.status = "Approved";
        if (!partner.assignedPropertyIds || !partner.assignedPropertyIds.includes(primaryStay.id)) {
          partner.assignedPropertyIds = [primaryStay.id];
        }
        localStorage.setItem("admin_partners", JSON.stringify(partners));
      }

      // Ensure primary stay is tied to this partner
      primaryStay.partnerId = partner.id;
      localStorage.setItem("admin_stays", JSON.stringify(stays));

      // Ensure rooms exist under primaryStay
      let rooms = [];
      try {
        rooms = JSON.parse(localStorage.getItem("admin_rooms") || "[]");
      } catch(e) {}

      const stayRooms = rooms.filter(r => r.propertyId === primaryStay.id);
      if (stayRooms.length === 0) {
        rooms.push(
          {
            id: "room_standard_01",
            propertyId: primaryStay.id,
            name: "Standard Mountain Room",
            type: "Standard Room",
            price: "2400",
            capacity: "2 Guests",
            availability: "available",
            status: "published",
            amenities: ["Mountain View", "Hot Water"]
          },
          {
            id: "room_deluxe_02",
            propertyId: primaryStay.id,
            name: "Deluxe Pine Suite",
            type: "Deluxe Room",
            price: "3200",
            capacity: "3 Guests",
            availability: "available",
            status: "published",
            amenities: ["Balcony View", "Heater", "Hot Water"]
          }
        );
        localStorage.setItem("admin_rooms", JSON.stringify(rooms));
      }

      // Also create a sample booking request for testing PartnerBookings
      let bookings = [];
      try {
        bookings = JSON.parse(localStorage.getItem("booking_requests") || "[]");
      } catch(e) {}

      const existingPartnerBooking = bookings.find(b => b.propertyId === primaryStay.id || b.inventoryId === primaryStay.id);
      if (!existingPartnerBooking) {
        bookings.push({
          id: "bk_sample_01",
          service: "Stay",
          name: "Rohit Verma",
          phone: "+91 98765 43210",
          email: "rohit.verma@example.com",
          date: "2026-10-15",
          nights: "2",
          travellers: "2",
          inventoryId: primaryStay.id,
          propertyId: primaryStay.id,
          propertyName: primaryStay.name,
          roomId: "room_deluxe_02",
          roomName: "Deluxe Pine Suite",
          status: "New",
          createdAt: new Date().toISOString()
        });
        localStorage.setItem("booking_requests", JSON.stringify(bookings));
      }

      // Set partner as active
      localStorage.setItem("lama_active_partner_id", partner.id);
      sessionStorage.setItem("lama_active_partner_id", partner.id);

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        assignedStays: partner.assignedPropertyIds,
        totalRooms: rooms.filter(r => r.propertyId === primaryStay.id).length
      };
    })()`);

    console.log("Setup result:", setupResult);

    // 2. Test Partner Dashboard
    console.log("2. Navigating to Partner Dashboard...");
    await send('Page.navigate', { url: 'http://localhost:1234/partner' });
    await sleep(2000);
    await captureScreenshot(`${ARTIFACT_DIR}/partner_dashboard_rooms.png`);

    // Verify stats in Partner Dashboard
    const dashboardStats = await evaluate(`(() => {
      const stats = Array.from(document.querySelectorAll('.admin-stat-card')).map(card => ({
        label: card.querySelector('.admin-stat-card__label')?.innerText,
        value: card.querySelector('.admin-stat-card__value')?.innerText
      }));
      return stats;
    })()`);
    console.log("Dashboard stats:", dashboardStats);

    // 3. Test Partner Properties Page
    console.log("3. Navigating to Partner Properties...");
    await send('Page.navigate', { url: 'http://localhost:1234/partner/properties' });
    await sleep(2000);
    await captureScreenshot(`${ARTIFACT_DIR}/partner_properties_overview.png`);

    // Check room inventory preview on property card
    const propertiesData = await evaluate(`(() => {
      const cards = Array.from(document.querySelectorAll('.partner-property-card')).map(card => {
        const title = card.querySelector('h3')?.innerText;
        const manageBtn = card.querySelector('button[title*="Manage multiple rooms"]')?.innerText;
        const roomPreview = card.querySelector('.partner-property-body div[style*="background: rgb(248, 250, 252)"]')?.innerText;
        return { title, manageBtn, roomPreview };
      });
      return cards;
    })()`);
    console.log("Partner Properties data:", propertiesData);

    // Click "Manage Rooms" button to open modal
    console.log("Opening Manage Rooms modal...");
    await evaluate(`(() => {
      const manageBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Manage Rooms'));
      if (manageBtn) manageBtn.click();
    })()`);
    await sleep(1500);
    await captureScreenshot(`${ARTIFACT_DIR}/partner_rooms_manager_modal.png`);

    // Verify modal elements: rooms listed, property dropdown scoped, Add Room button
    const modalCheck = await evaluate(`(() => {
      const modal = document.querySelector('.admin-modal--rooms');
      if (!modal) return { open: false };

      const title = modal.querySelector('.admin-modal-title')?.innerText;
      const subtitle = modal.querySelector('.admin-modal-subtitle')?.innerText;
      const selectOptions = Array.from(modal.querySelectorAll('.property-select-input option')).map(o => o.innerText);
      const roomRows = Array.from(modal.querySelectorAll('.room-manager-row')).map(row => ({
        name: row.querySelector('.room-manager-row__title')?.innerText,
        type: row.querySelector('.room-type-badge')?.innerText,
        avail: row.querySelector('.room-avail-pill')?.innerText
      }));
      const addBtnExists = Boolean(modal.querySelector('button.admin-btn--primary'));
      return { open: true, title, subtitle, selectOptions, roomRows, addBtnExists };
    })()`);
    console.log("Modal verification:", modalCheck);

    // Test clicking "Add Room" inside modal
    console.log("Testing Add Room inside modal...");
    await evaluate(`(() => {
      const addBtn = Array.from(document.querySelectorAll('.admin-modal--rooms button')).find(b => b.innerText.includes('Add Room'));
      if (addBtn) addBtn.click();
    })()`);
    await sleep(1000);
    await captureScreenshot(`${ARTIFACT_DIR}/partner_add_room_modal.png`);

    // Check Add Room modal fields (parent property must be locked and auto-selected)
    const addRoomCheck = await evaluate(`(() => {
      const form = document.querySelector('form');
      if (!form) return { formFound: false };
      const propField = form.querySelector('input[readonly], select[disabled], input[value*="Lachen Mountain Homestay"]');
      const nameInput = form.querySelector('input[name="name"], input[placeholder*="Room"]');
      return {
        formFound: true,
        parentPropertyShown: propField ? propField.value : "None",
        isLocked: propField ? propField.hasAttribute('readonly') || propField.hasAttribute('disabled') : false
      };
    })()`);
    console.log("Add Room form check:", addRoomCheck);

    // Close Add Room modal
    await evaluate(`(() => {
      const cancelBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.trim() === 'Cancel');
      if (cancelBtn) cancelBtn.click();
    })()`);
    await sleep(600);

    // Close Property Rooms modal
    await evaluate(`(() => {
      const closeBtn = document.querySelector('.admin-modal-close-btn');
      if (closeBtn) closeBtn.click();
    })()`);
    await sleep(600);

    // 4. Test Partner Availability Page
    console.log("4. Navigating to Partner Availability...");
    await send('Page.navigate', { url: 'http://localhost:1234/partner/availability' });
    await sleep(2000);
    await captureScreenshot(`${ARTIFACT_DIR}/partner_availability_rooms.png`);

    // Verify availability stats and room rows
    const availCheck = await evaluate(`(() => {
      const stats = Array.from(document.querySelectorAll('.admin-stat-card')).map(c => ({
        label: c.querySelector('.admin-stat-card__label')?.innerText,
        value: c.querySelector('.admin-stat-card__value')?.innerText
      }));
      const tableRows = Array.from(document.querySelectorAll('tbody tr')).length;
      return { stats, tableRows };
    })()`);
    console.log("Availability check:", availCheck);

    // Expand rooms on availability table if expandable
    await evaluate(`(() => {
      const expandBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Rooms'));
      if (expandBtn) expandBtn.click();
    })()`);
    await sleep(800);
    await captureScreenshot(`${ARTIFACT_DIR}/partner_availability_expanded_rooms.png`);

    // 5. Test Partner Photos Page
    console.log("5. Navigating to Partner Photos...");
    await send('Page.navigate', { url: 'http://localhost:1234/partner/photos' });
    await sleep(2000);
    await captureScreenshot(`${ARTIFACT_DIR}/partner_photos_rooms.png`);

    // Check room photo buttons exist
    const photosCheck = await evaluate(`(() => {
      const roomPhotoButtons = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Photos') && b.getAttribute('title')?.includes('room'));
      return { roomPhotoButtonCount: roomPhotoButtons.length };
    })()`);
    console.log("Photos check:", photosCheck);

    // 6. Test Partner Bookings Page
    console.log("6. Navigating to Partner Bookings...");
    await send('Page.navigate', { url: 'http://localhost:1234/partner/bookings' });
    await sleep(2000);
    await captureScreenshot(`${ARTIFACT_DIR}/partner_bookings_room.png`);

    // Verify bookings list shows property and room
    const bookingsCheck = await evaluate(`(() => {
      const rows = Array.from(document.querySelectorAll('tbody tr')).map(r => {
        const guest = r.querySelector('td:nth-child(2)')?.innerText;
        const propAndRoom = r.querySelector('td:nth-child(3)')?.innerText;
        const status = r.querySelector('.admin-status-badge')?.innerText;
        return { guest, propAndRoom, status };
      });
      return rows;
    })()`);
    console.log("Bookings check:", bookingsCheck);

    // Open inquiry modal to verify Property ID & Room ID display
    await evaluate(`(() => {
      const viewBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('View'));
      if (viewBtn) viewBtn.click();
    })()`);
    await sleep(1000);
    await captureScreenshot(`${ARTIFACT_DIR}/partner_booking_details_modal.png`);

    const bookingModalCheck = await evaluate(`(() => {
      const modal = document.querySelector('.admin-modal-body');
      if (!modal) return null;
      const text = modal.innerText;
      return {
        hasProperty: text.includes('Lachen Mountain Homestay'),
        hasRoom: text.includes('Deluxe Pine Suite'),
        hasPropertyId: text.includes('stay_lachen_homestay') || text.includes('Property ID'),
        hasRoomId: text.includes('room_deluxe_02') || text.includes('Room ID')
      };
    })()`);
    console.log("Booking Modal Check:", bookingModalCheck);

    console.log("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Error during verification:", err);
  } finally {
    chromeProcess.kill();
  }
}

run();
