# Lama Bhaila Tourism — Backend Documentation

## 1. Project Overview & Architecture
Lama Bhaila Tourism is a full-stack MERN-style web application for regional tourism and hospitality across Sikkim.
The application operates on an MVC (Model-View-Controller) architecture:
- **Frontend:** React 19 bundled with Parcel, consuming JSON REST APIs.
- **Backend:** Node.js + Express.js handling authentication, authorization, business logic, and database operations.
- **Database:** MongoDB Atlas via Mongoose ODM.
- **Authentication:** Express-Session with HTTP-only cookies and Passport.js.
- **Media Storage:** Multer handling multipart/form-data uploads to Cloudinary CDN.

---

## 2. Directory Structure
```text
Lama-bhai-Tourism/
├── backend/
│   ├── config/          # Database & third-party service configurations
│   ├── controllers/     # Request handlers & business logic
│   ├── middleware/      # Auth guards, file uploads, error handlers
│   ├── models/          # Mongoose data schemas
│   ├── routes/          # Express route definitions
│   ├── utils/           # Helper functions & formatters
│   ├── .env             # Private environment secrets (ignored by git)
│   ├── .env.example     # Environment template
│   ├── package.json     # Backend dependencies & npm scripts
│   └── server.js        # Express app entry point
└── src/                 # Existing React frontend
```

---

## 3. Environment Variables
Stored in `backend/.env`:
| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | HTTP port the Express server listens on | `5000` |
| `NODE_ENV` | Application environment (`development` / `production`) | `development` |
| `CLIENT_URL` | Frontend origin for CORS and cookie credentials | `http://localhost:1234` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/lama-bhaila` |
| `SESSION_SECRET` | Secret key used to sign session cookies | `your_secret_key` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier | `your_cloud_name` |
| `CLOUDINARY_KEY` | Cloudinary API Key | `your_cloudinary_key` |
| `CLOUDINARY_SECRET` | Cloudinary API Secret | `your_cloudinary_secret` |

---

## 4. Key Commands
* **Start backend in development mode:**
  ```powershell
  cd backend
  npm run dev
  ```
* **Start backend in production mode:**
  ```powershell
  cd backend
  npm start
  ```
* **Test health check:**
  ```powershell
  Invoke-RestMethod -Uri "http://localhost:5000/api/health" -Method Get
  ```

---

## 5. Development Phases Log
- [x] **Phase 0:** Repository inspection & architectural blueprint
- [x] **Phase 1:** System architecture setup & backend skeleton (Express, CORS, Morgan, Error handlers, Health check)
- [x] **Phase 2:** Database design & Mongoose schemas (User, Property, Room, Booking, Review, Destination)
- [x] **Phase 3:** MongoDB connection setup
- [x] **Phase 4:** Authentication engine (Passport.js & Sessions)
- [x] **Phase 5:** Role-based authorization middleware
- [x] **Phase 6:** Public property listing APIs
- [ ] **Phase 7:** Owner property submission pipeline
- [ ] **Phase 8:** Admin approval/rejection moderation
- [ ] **Phase 9:** Multer + Cloudinary image upload
- [ ] **Phase 10:** Customer booking system
- [ ] **Phase 11:** Property review system
- [ ] **Phase 12:** Destination & content APIs
- [ ] **Phase 13:** Frontend integration
- [ ] **Phase 14:** End-to-end testing

---

## 6. Database Models (Mongoose)
The schemas in `backend/models/` map 1:1 with the Sikkim tourism workflow and existing frontend contracts:

| Model | File | Primary Responsibilities | Key Relationships & Indexes |
| :--- | :--- | :--- | :--- |
| **`User`** | `backend/models/User.js` | Tourist/Customer, Owner/Partner, Admin authentication & profiles | Role-based (`tourist`, `owner`, `admin`), Partner profile verification |
| **`Property`** | `backend/models/Property.js` | Homestays, resorts, hotels across Sikkim districts | References `owner` (User), virtual `rooms` and `reviews`, compound search index |
| **`Room`** | `backend/models/Room.js` | Individual room units with capacity, bed types, pricing | References `property` (Property), indexed by availability & active state |
| **`Booking`** | `backend/models/Booking.js` | Reservations for stays, cars, bikes, permits, and trip planning | References `property`, `room`, `user`, `partner`; auto-generates `bookingRequestId` |
| **`Review`** | `backend/models/Review.js` | Tourist feedback & 1–5 star ratings | Unique compound index `(property, user)`, auto-calculates property rating |
| **`Destination`** | `backend/models/Destination.js` | Curated Sikkim travel guides (Lachen, Lachung, Yumthang, etc.) | SEO `slug` index, district filters, text search on highlights & attractions |

---

## 7. Authentication Engine (Phase 4)
The authentication layer uses Passport.js local strategy with MongoDB-backed sessions via `connect-mongo`:

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a new tourist or partner/owner with bcrypt hashed password and initializes session |
| `POST` | `/api/auth/login` | Public | Authenticates credentials, creates signed session cookie, and updates `lastLogin` |
| `POST` | `/api/auth/logout` | Authenticated | Destroys server-side session in MongoDB and clears `connect.sid` cookie |
| `GET` | `/api/auth/me` | Authenticated | Returns currently authenticated user details, partner profile, and role |

---

## 8. Role-Based Authorization Middleware (Phase 5)
Reusable route guards implemented in `backend/middleware/authMiddleware.js`:

| Middleware | Target Scenarios | Behavior |
| :--- | :--- | :--- |
| **`protect`** | Protected customer/owner/admin endpoints | Blocks unauthenticated requests with `401 Unauthorized`; blocks deactivated accounts with `403 Forbidden` |
| **`authorize(...roles)`** | Role-restricted endpoints (e.g. `authorize('owner', 'admin')`) | Allows only listed roles; returns `403 Forbidden` if user role is not authorized |
| **`ensureApprovedOwner`** | Partner listing creation & inventory management | Blocks non-owners and suspended/rejected partners with `403 Forbidden`; automatically grants bypass to `admin` |
| **`optionalAuth`** | Public listings with personalized tourist data | Passes through without blocking unauthenticated guests, but attaches `req.user` if logged in |

---

## 9. Public Property Discovery APIs (Phase 6)
Public endpoints powering the Sikkim stays directory, homestay cards, filters, and detail pages:

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/properties` | `district`, `type`, `minPrice`, `maxPrice`, `search`, `amenities`, `sort`, `page`, `limit` | Paginated search across active, approved Sikkim homestays, hotels, and resorts |
| `GET` | `/api/properties/featured` | None | Retrieves top-rated and featured properties (curated for homepage showcase) |
| `GET` | `/api/properties/:slug` | None (slug or ObjectId) | Full detail view with populated owner profile, active rooms, and approved reviews |
| `GET` | `/api/properties/:id/rooms` | None (:id or :slug) | Room inventory for a specific property including bed types, pricing, and availability |




