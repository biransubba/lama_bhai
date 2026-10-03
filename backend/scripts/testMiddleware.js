const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const passport = require('../config/passport');
const { protect, authorize, ensureApprovedOwner } = require('../middleware/authMiddleware');
const User = require('../models/User');

dotenv.config();

async function runMiddlewareTests() {
  console.log('--- Starting Role-Based Authorization Middleware Test Suite ---');
  await connectDB();

  const app = express();
  app.use(express.json());

  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lama-bhaila';
  app.use(
    session({
      secret: 'test_session_secret_middleware',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: mongoURI }),
      cookie: { httpOnly: true },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Helper route to log in as specific user for testing
  app.post('/test/login-as', async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    req.login(user, (err) => {
      if (err) return next(err);
      res.json({ success: true, loggedInAs: user.role });
    });
  });

  // Protected route requiring authentication
  app.get('/test/protected', protect, (req, res) => {
    res.json({ success: true, message: 'You have accessed a protected route!' });
  });

  // Owner or Admin only route
  app.get('/test/owner-or-admin', protect, authorize('owner', 'admin'), (req, res) => {
    res.json({ success: true, message: 'Welcome Owner/Admin!' });
  });

  // Admin strictly route
  app.get('/test/admin-only', protect, authorize('admin'), (req, res) => {
    res.json({ success: true, message: 'Welcome Admin!' });
  });

  // Owner verification route
  app.get('/test/owner-verified', protect, ensureApprovedOwner, (req, res) => {
    res.json({ success: true, message: 'Owner action permitted!' });
  });

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5001, resolve));
  const baseUrl = 'http://localhost:5001/test';

  const unique = Date.now().toString().slice(-5);

  try {
    // Setup test users in MongoDB
    const touristUser = await User.create({
      name: 'Test Tourist',
      email: `mw_tourist_${unique}@lama.test`,
      password: 'password123',
      role: 'tourist',
    });

    const activeOwnerUser = await User.create({
      name: 'Active Owner',
      email: `mw_owner_${unique}@lama.test`,
      password: 'password123',
      role: 'owner',
      partnerProfile: {
        verificationStatus: 'Approved',
        agencyName: 'Himalayan Stays',
      },
    });

    const suspendedOwnerUser = await User.create({
      name: 'Suspended Owner',
      email: `mw_suspended_${unique}@lama.test`,
      password: 'password123',
      role: 'owner',
      partnerProfile: {
        verificationStatus: 'Suspended',
      },
    });

    const adminUser = await User.create({
      name: 'Test Admin',
      email: `mw_admin_${unique}@lama.test`,
      password: 'password123',
      role: 'admin',
    });

    // Helper function to login and get cookie
    async function loginAs(email) {
      const res = await fetch(`${baseUrl}/login-as`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return res.headers.get('set-cookie')?.split(';')[0] || '';
    }

    const touristCookie = await loginAs(touristUser.email);
    const activeOwnerCookie = await loginAs(activeOwnerUser.email);
    const suspendedOwnerCookie = await loginAs(suspendedOwnerUser.email);
    const adminCookie = await loginAs(adminUser.email);

    // 1. Test unauthenticated request to /protected
    console.log('\n[1] Testing Unauthenticated access to /protected (Expect 401)...');
    const unauthRes = await fetch(`${baseUrl}/protected`);
    console.log('Status:', unauthRes.status);
    const unauthJson = await unauthRes.json();
    console.log('Response:', unauthJson);
    if (unauthRes.status !== 401) throw new Error('Expected 401 for unauthenticated request');

    // 2. Test authenticated tourist access to /protected
    console.log('\n[2] Testing Tourist access to /protected (Expect 200)...');
    const authRes = await fetch(`${baseUrl}/protected`, { headers: { Cookie: touristCookie } });
    console.log('Status:', authRes.status);
    if (authRes.status !== 200) throw new Error('Expected 200 for authenticated tourist');

    // 3. Test Tourist accessing /owner-or-admin
    console.log('\n[3] Testing Tourist accessing /owner-or-admin (Expect 403)...');
    const forbidRes = await fetch(`${baseUrl}/owner-or-admin`, { headers: { Cookie: touristCookie } });
    console.log('Status:', forbidRes.status);
    const forbidJson = await forbidRes.json();
    console.log('Response:', forbidJson);
    if (forbidRes.status !== 403) throw new Error('Expected 403 for tourist on owner route');

    // 4. Test Owner accessing /owner-or-admin
    console.log('\n[4] Testing Owner accessing /owner-or-admin (Expect 200)...');
    const ownerRes = await fetch(`${baseUrl}/owner-or-admin`, { headers: { Cookie: activeOwnerCookie } });
    console.log('Status:', ownerRes.status);
    if (ownerRes.status !== 200) throw new Error('Expected 200 for owner');

    // 5. Test Owner accessing /admin-only
    console.log('\n[5] Testing Owner accessing /admin-only (Expect 403)...');
    const adminForbidRes = await fetch(`${baseUrl}/admin-only`, { headers: { Cookie: activeOwnerCookie } });
    console.log('Status:', adminForbidRes.status);
    if (adminForbidRes.status !== 403) throw new Error('Expected 403 for owner on admin route');

    // 6. Test Admin accessing /admin-only
    console.log('\n[6] Testing Admin accessing /admin-only (Expect 200)...');
    const adminRes = await fetch(`${baseUrl}/admin-only`, { headers: { Cookie: adminCookie } });
    console.log('Status:', adminRes.status);
    if (adminRes.status !== 200) throw new Error('Expected 200 for admin');

    // 7. Test Suspended Owner accessing /owner-verified
    console.log('\n[7] Testing Suspended Owner accessing /owner-verified (Expect 403)...');
    const suspRes = await fetch(`${baseUrl}/owner-verified`, { headers: { Cookie: suspendedOwnerCookie } });
    console.log('Status:', suspRes.status);
    const suspJson = await suspRes.json();
    console.log('Response:', suspJson);
    if (suspRes.status !== 403) throw new Error('Expected 403 for suspended owner');

    // 8. Test Active Owner accessing /owner-verified
    console.log('\n[8] Testing Active Owner accessing /owner-verified (Expect 200)...');
    const activeOwnerRes = await fetch(`${baseUrl}/owner-verified`, { headers: { Cookie: activeOwnerCookie } });
    console.log('Status:', activeOwnerRes.status);
    if (activeOwnerRes.status !== 200) throw new Error('Expected 200 for active owner');

    console.log('\n======================================================');
    console.log(' ALL ROLE-BASED AUTHORIZATION TESTS PASSED (8/8)! ');
    console.log('======================================================');
  } catch (err) {
    console.error('\nTest Failed:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    await mongoose.connection.close();
    process.exit(process.exitCode || 0);
  }
}

runMiddlewareTests();
