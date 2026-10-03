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
- [x] **Phase 7:** Owner property submission pipeline
- [x] **Phase 8:** Admin approval/rejection moderation
- [x] **Phase 9:** Multer + Cloudinary image upload
- [x] **Phase 10:** Customer booking system
- [x] **Phase 11:** Property review system
- [x] **Phase 12:** Destination & content APIs
- [x] **Phase 13:** Frontend integration
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

---

## 10. Owner Property Submission Pipeline (Phase 7)
Endpoints powering the Partner Portal in `backend/routes/ownerRoutes.js`:

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/owner/properties` | Owner / Admin | Submits a new property listing with unique slug generation (defaults to `pending` status) |
| `GET` | `/api/owner/properties` | Owner / Admin | Retrieves all properties owned by the authenticated host with moderation status |
| `GET` | `/api/owner/properties/:id` | Owner / Admin | Fetches single property owned by the user with populated rooms and moderation feedback |
| `PUT` | `/api/owner/properties/:id` | Owner / Admin | Updates property details with strict cross-owner isolation checks |
| `DELETE` | `/api/owner/properties/:id` | Owner / Admin | Deactivates property and cascades `active: false` across all attached rooms |
| `POST` | `/api/owner/properties/:id/rooms` | Owner / Admin | Adds a new room type to the owner's property |
| `PUT` | `/api/owner/rooms/:roomId` | Owner / Admin | Updates room capacity, pricing, amenities, and availability status |
| `DELETE` | `/api/owner/rooms/:roomId` | Owner / Admin | Deactivates room from property inventory |

---

## 11. Admin Moderation & Operations APIs (Phase 8)
Endpoints powering the Admin Console in `backend/routes/adminRoutes.js`:

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/properties` | Admin only | Lists all properties across Sikkim with status filters (`pending`, `approved`, `rejected`, `all`) |
| `PATCH` | `/api/admin/properties/:id/status` | Admin only | Approves or rejects property submissions; immediately controls public discovery visibility |
| `GET` | `/api/admin/partners` | Admin only | Retrieves all registered hosts with property counts and verification status |
| `PATCH` | `/api/admin/partners/:userId/status` | Admin only | Approves, rejects, or suspends partner verification accounts |
| `GET` | `/api/admin/stats` | Admin only | Provides dashboard overview analytics (properties, moderation queue, verified hosts, bookings) |

---

## 12. Media Upload Pipeline (Phase 9)
Multipart form upload endpoints in `backend/routes/uploadRoutes.js` supporting Cloudinary CDN with automatic local disk fallback:

| Method | Endpoint | Access | Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/upload/image` | Authenticated | `image` (file, max 5MB), `folder` (optional) | Uploads single image (avatars, property covers, destination photos) |
| `POST` | `/api/upload/gallery` | Authenticated | `images` (array of up to 10 files), `category` | Uploads multiple photos formatted for property/room galleries |

---

## 13. Customer Booking System (Phase 10)
End-to-end reservation lifecycle across Stays, Vehicles, Bikes, and Permits:

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Public (Guest / User) | Submits booking request, auto-computes nights/pricing, assigns partner, generates `LB-ST-XXXX` |
| `GET` | `/api/bookings/my` | Authenticated | Retrieves current logged-in tourist's personal reservation history |
| `GET` | `/api/bookings/:id` | Public / Private | Looks up booking reservation by tracking code (`LB-ST-...`) or ObjectId |
| `PATCH` | `/api/bookings/:id/cancel` | Customer / Admin | Cancels booking with reason and metadata tracking |
| `GET` | `/api/owner/bookings` | Host / Admin | Retrieves reservation requests assigned to the logged-in partner |
| `PATCH` | `/api/owner/bookings/:id/status` | Host / Admin | Updates reservation status (`Contacted`, `In Progress`, `Confirmed`, `Completed`, `Cancelled`) |
| `GET` | `/api/admin/bookings` | Admin only | Platform-wide master bookings view with status, service filters, and pagination |

---

## 14. Property Review & Rating System (Phase 11)
Tourist reviews with 1–5 star ratings, automated property average rating aggregation, user update/delete, and admin moderation:

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/properties/:propertyId/reviews` | Public | Retrieves approved reviews for a property (supports pagination: `?page=1&limit=10`) |
| `POST` | `/api/properties/:propertyId/reviews` | Authenticated (Tourist/User) | Creates a review for a property (enforces unique 1-review-per-tourist, re-aggregates rating) |
| `GET` | `/api/reviews/:id` | Public | Fetches a single review by its ID with populated user and property details |
| `PUT` | `/api/reviews/:id` | Owner / Admin | Updates a review's rating and comment; triggers live property rating recalculation |
| `DELETE` | `/api/reviews/:id` | Owner / Admin | Deletes a review; triggers live property rating recalculation |
| `PATCH` | `/api/admin/reviews/:id/moderation` | Admin only | Hides or restores a review (`status: 'approved' \| 'hidden'`) and updates property metrics |

---

## 15. Destination & Content APIs (Phase 12)
Curated Sikkim travel destinations (Lachen, Lachung, Yumthang Valley, Zero Point, Gurudongmar Lake, Dzongu, etc.) with related guides cross-linking, district filtering, and admin content management:

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/destinations` | Public | Lists all active destinations with filters (`district`, `tag`, `search`, `sort`, `page`, `limit`) |
| `GET` | `/api/destinations/:slug` | Public | Retrieves destination detail with populated `relatedDestinations` and `nearbyStays` in that region |
| `POST` | `/api/destinations` | Admin only | Creates a new destination guide with auto-generated slug |
| `PUT` | `/api/destinations/:id` | Admin only | Updates destination information, highlights, permits, and images |
| `DELETE` | `/api/destinations/:id` | Admin only | Soft-deactivates destination (`isActive: false`) or permanently deletes with `?permanent=true` |

* **Seed Curated Sikkim Destinations:**
  ```powershell
  cd backend
  node scripts/seedDestinations.js
  ```

---

## 16. Frontend REST Integration & Client SDK (Phase 13)
The React 19 frontend is connected to the Express/MongoDB backend through a centralized, resilient client module in `src/utils/api.js`:

- **Universal API Client (`src/utils/api.js`):**
  - Targets `http://localhost:5000/api` with `credentials: 'include'` for automatic HTTP-only session cookie transport.
  - Organized by domain: `api.auth`, `api.properties`, `api.owner`, `api.admin`, `api.bookings`, `api.reviews`, `api.destinations`, `api.upload`.
- **Real-Time Data Synchronization:**
  - `src/pages/Destinations.jsx`: Hydrates instantly from local storage, then asynchronously checks and enriches active destinations from `GET /api/destinations`.
  - `src/pages/HotelHomestay.jsx`: Enriches the public homestay catalog with active approved properties from `GET /api/properties?status=approved`.
  - `src/utils/bookingStorage.js`: Submits booking requests directly to `POST /api/bookings` in MongoDB, receiving official tracking codes (`LB-ST-XXXX`) while keeping local storage updated.
  - `src/pages/ManageBooking.jsx`: Looks up customer reservations both in local cache and across remote MongoDB via `GET /api/bookings/:id`.
- **Zero-Failure Offline & Fallback Resiliency:**
  - If the backend is temporarily offline or in transition, the React application seamlessly falls back to local repositories without throwing uncaught errors or interrupting user navigation.
