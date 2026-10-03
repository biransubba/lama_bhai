const { spawn } = require('child_process');
const http = require('http');

const CHROME_PATH = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PORT = 9240;

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

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: 'http://localhost:1234/admin/stays' });
    await sleep(2000);

    // Setup Sakeejar Lee exactly as in user screenshot
    const setupResult = await evaluate(`(() => {
      const stay = {
        id: 'stay_1790487271131',
        name: 'Sakeejar Lee',
        location: 'Mangan',
        type: 'Homestay',
        description: 'Comfortable accommodation room.',
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
      localStorage.removeItem('admin_rooms'); // reset rooms
      return { stayId: stay.id, staysCount: allStays.length };
    })()`);
    console.log("Setup result:", setupResult);

    // Reload page to pick up storage
    await send('Page.navigate', { url: 'http://localhost:1234/admin/stays' });
    await sleep(2000);

    // Open manage rooms for Sakeejar Lee
    const clickManage = await evaluate(`(() => {
      const btns = Array.from(document.querySelectorAll('.admin-rooms-count-btn'));
      for (const b of btns) {
        const row = b.closest('tr');
        if (row && row.textContent.includes('Sakeejar Lee')) {
          b.click();
          return { clicked: true };
        }
      }
      return { clicked: false, btnsFound: btns.length };
    })()`);
    console.log("Click manage rooms:", clickManage);
    await sleep(1000);

    // Click Edit on the room
    const clickEdit = await evaluate(`(() => {
      const editBtn = document.querySelector('.prop-room-btn--edit');
      if (editBtn) {
        editBtn.click();
        return { clicked: true };
      }
      return { clicked: false };
    })()`);
    console.log("Click edit room:", clickEdit);
    await sleep(1000);

    // Fill in Room 101 and lengthy description
    const fillForm = await evaluate(`(() => {
      const nameInput = document.querySelector('#room-name');
      const descInput = document.querySelector('#room-description');
      const form = document.querySelector('form.room-modal__body');
      
      if (!nameInput || !descInput || !form) {
        return { error: 'elements not found', hasName: !!nameInput, hasDesc: !!descInput, hasForm: !!form };
      }

      // React controlled input setter:
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

      const longDesc = 'Wake up to breathtaking views of the majestic Mount Kachenjunga from the comfort of your room. Located conveniently near the helipad, this peaceful and comfortable room is an ideal choice for travelers looking to experience the natural beauty of Sikkim.';
      setNativeValue(descInput, longDesc);
      descInput.dispatchEvent(new Event('input', { bubbles: true }));
      descInput.dispatchEvent(new Event('change', { bubbles: true }));

      return {
        currentNameVal: nameInput.value,
        currentDescVal: descInput.value
      };
    })()`);
    console.log("Fill form result:", fillForm);
    await sleep(800);

    // Click Save Room Changes
    const submitResult = await evaluate(`(() => {
      const submitBtn = document.querySelector('.room-modal__footer button[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
        return { clickedSubmit: true, btnText: submitBtn.textContent };
      }
      return { clickedSubmit: false };
    })()`);
    console.log("Submit button result:", submitResult);
    await sleep(1500);

    // Check localStorage
    const storageCheck = await evaluate(`(() => {
      return {
        admin_rooms: localStorage.getItem('admin_rooms'),
        admin_stays: localStorage.getItem('admin_stays')
      };
    })()`);
    console.log("Storage check admin_rooms:", storageCheck?.admin_rooms);

    // Navigate to stay page
    await send('Page.navigate', { url: 'http://localhost:1234/stays/stay_1790487271131' });
    await sleep(2500);

    const stayPageCheck = await evaluate(`(() => {
      const roomCards = Array.from(document.querySelectorAll('.room-card')).map(card => ({
        title: card.querySelector('.room-card__title')?.textContent?.trim(),
        desc: card.querySelector('.room-card__description')?.textContent?.trim(),
        price: card.querySelector('.room-card__tariff-rate')?.textContent?.trim(),
        chips: Array.from(card.querySelectorAll('.room-card__amenity-chip')).map(c => c.textContent.trim())
      }));
      return { roomCards };
    })()`);
    console.log("Stay page room cards:", JSON.stringify(stayPageCheck, null, 2));

  } catch (err) {
    console.error("Test failed:", err);
  } finally {
    chrome.kill();
  }
}

main();
