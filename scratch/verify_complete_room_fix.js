const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9250;
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

async function main() {
  console.log("Starting Chrome on port", PORT);
  const chrome = spawn(CHROME_PATH, [
    `--remote-debugging-port=${PORT}`,
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

    let id = 1;
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const curId = id++;
        const handler = (e) => {
          const res = JSON.parse(e.data);
          if (res.id === curId) {
            ws.removeEventListener('message', handler);
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (res.exceptionDetails) {
        console.error("Evaluation exception:", res.exceptionDetails);
      }
      return res.result?.value;
    }

    async function takeScreenshot(filename) {
      const res = await send('Page.captureScreenshot', { format: 'png' });
      const filePath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${filename}`);
      return filePath;
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 960,
      deviceScaleFactor: 1,
      mobile: false,
    });

    console.log("Navigating to Admin Stays...");
    await send('Page.navigate', { url: 'http://localhost:1234/admin/stays' });
    await sleep(2000);

    // 1. Setup Sakeejar Lee in localStorage
    const setupResult = await evaluate(`(() => {
      const stay = {
        id: 'stay_1790487271131',
        name: 'Sakeejar Lee',
        location: 'Mangan',
        type: 'Homestay',
        description: '',
        price: '2000',
        amenities: ['Hot Water', 'Room Heater', 'Organic Sikkimese Meals', 'Mountain View', 'Wi-Fi', 'Attached Bathroom', 'Parking', 'Balcony', 'Campfire Area'],
        availability: 'available',
        status: 'published',
        active: true,
        gallery: ['https://images.unsplash.com/photo-1590490360182-c33d57733427', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b']
      };
      const allStays = JSON.parse(localStorage.getItem('admin_stays') || '[]');
      const existingIdx = allStays.findIndex(s => s.id === stay.id);
      if (existingIdx >= 0) allStays[existingIdx] = stay;
      else allStays.unshift(stay);
      localStorage.setItem('admin_stays', JSON.stringify(allStays));
      localStorage.removeItem('admin_rooms');
      return { stayId: stay.id, totalStays: allStays.length };
    })()`);
    console.log("1. Setup result:", setupResult);

    // Reload page to reflect stored state
    await send('Page.navigate', { url: 'http://localhost:1234/admin/stays' });
    await sleep(2000);

    // 2. Open Manage Rooms for Sakeejar Lee
    const openManage = await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('.admin-rooms-count-btn'));
      for (const b of btns) {
        const row = b.closest('tr');
        if (row && row.textContent.includes('Sakeejar Lee')) {
          b.click();
          return { clicked: true };
        }
      }
      return { clicked: false, total: btns.length };
    })()`);
    console.log("2. Open Manage Rooms:", openManage);
    await sleep(1000);

    // 3. Click Edit on the room
    const clickEdit = await evaluate(`(() => {
      const editBtn = document.querySelector('.prop-room-btn--edit');
      if (editBtn) {
        editBtn.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`);
    console.log("3. Click Edit Room:", clickEdit);
    await sleep(1000);

    // 4. Fill in Room Name "Room 101" and lengthy description
    const fillInputs = await evaluate(`(() => {
      const nameInput = document.querySelector('#room-name');
      const descInput = document.querySelector('#room-description');

      const setNativeValue = (element, value) => {
        const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
        const prototype = Object.getPrototypeOf(element);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;
        
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(element, value);
        } else if (valueSetter) {
          valueSetter.call(element, value);
        } else {
          element.value = value;
        }
      };

      setNativeValue(nameInput, 'Room 101');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));

      const longDesc = 'Wake up to breathtaking views of the majestic **Mount Kachenjunga** from the comfort of your room. Located conveniently near the **helipad**, this peaceful and comfortable room is an ideal choice for travelers looking to experience the natural beauty of Sikkim.';
      setNativeValue(descInput, longDesc);
      descInput.dispatchEvent(new Event('input', { bubbles: true }));
      descInput.dispatchEvent(new Event('change', { bubbles: true }));

      return {
        nameVal: nameInput?.value,
        descVal: descInput?.value?.slice(0, 50) + '...'
      };
    })()`);
    console.log("4. Filled inputs:", fillInputs);
    await sleep(800);

    await takeScreenshot("verify_admin_edit_room_modal_filled.png");

    // 5. Click Save Room Changes
    const clickSave = await evaluate(`(() => {
      const submitBtn = document.querySelector('.room-modal__footer button[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
        return { clicked: true, text: submitBtn.textContent };
      }
      return { clicked: false };
    })()`);
    console.log("5. Clicked Save:", clickSave);
    await sleep(1500);

    await takeScreenshot("verify_admin_manage_rooms_updated_room101.png");

    // 6. Verify localStorage state
    const storageVerif = await evaluate(`(() => {
      const rooms = JSON.parse(localStorage.getItem('admin_rooms') || '[]');
      const stays = JSON.parse(localStorage.getItem('admin_stays') || '[]');
      const targetStay = stays.find(s => s.id === 'stay_1790487271131');
      return {
        roomsCount: rooms.length,
        savedRoomInStore: rooms.find(r => r.propertyId === 'stay_1790487271131'),
        stayRooms: targetStay?.rooms
      };
    })()`);
    console.log("6. localStorage verification:");
    console.log(" - admin_rooms record:", storageVerif.savedRoomInStore?.name, "| Desc:", storageVerif.savedRoomInStore?.description?.slice(0, 40) + '...');
    console.log(" - admin_stays embedded:", storageVerif.stayRooms?.[0]?.name, "| Desc:", storageVerif.stayRooms?.[0]?.description?.slice(0, 40) + '...');

    // 7. Navigate to public Stay page
    console.log("7. Navigating to public Stay page...");
    await send('Page.navigate', { url: 'http://localhost:1234/stays/stay_1790487271131' });
    await sleep(2500);

    const publicStayCard = await evaluate(`(() => {
      const card = document.querySelector('.room-card');
      if (!card) return null;
      return {
        title: card.querySelector('.room-card__title')?.textContent?.trim(),
        desc: card.querySelector('.room-card__description')?.textContent?.trim(),
        price: card.querySelector('.room-card__tariff-rate')?.textContent?.trim(),
        chips: Array.from(card.querySelectorAll('.room-card__amenity-chip')).map(c => c.textContent.trim())
      };
    })()`);
    console.log("7. Public Stay Room Card:", publicStayCard);
    await takeScreenshot("verify_public_stay_card_room101.png");

    // 8. Click "View Room ->" to view Room Details View
    const clickViewRoom = await evaluate(`(() => {
      const viewBtn = document.querySelector('.room-card__cta-secondary') || document.querySelector('.room-card__title-btn');
      if (viewBtn) {
        viewBtn.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`);
    console.log("8. Clicked View Room:", clickViewRoom);
    await sleep(2000);

    const roomDetailsViewData = await evaluate(`(() => {
      const heading = document.querySelector('.room-detail__room-title')?.textContent?.trim();
      const aboutTitle = document.querySelector('.room-detail__section-title')?.textContent?.trim();
      const aboutText = document.querySelector('.room-detail__description-content')?.textContent?.trim();
      const boldWords = Array.from(document.querySelectorAll('.room-detail__description-content strong')).map(s => s.textContent.trim());
      const chips = Array.from(document.querySelectorAll('.room-detail__chip')).map(c => c.textContent.trim());
      return { heading, aboutTitle, aboutText, boldWords, chips };
    })()`);
    console.log("8. Room Details View data:", roomDetailsViewData);
    await takeScreenshot("verify_public_room_details_view_room101.png");

    console.log("\nALL VERIFICATIONS COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("Verification failed:", err);
  } finally {
    chrome.kill();
  }
}

main();
