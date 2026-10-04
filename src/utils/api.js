/**
 * Lama Bhaila Tourism — Centralized Backend API Client
 * Provides full REST integration with the Express/MongoDB backend at http://localhost:5000/api
 * Enforces session credentials across all requests (credentials: "include").
 */

const API_BASE_URL =
  (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) ||
  'http://localhost:5000/api';

/**
 * Universal fetch wrapper handling JSON parsing, session cookies, and standardized error extraction
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders = {
    Accept: 'application/json',
  };

  // Don't set Content-Type for FormData (multipart/form-data) — browser will auto-set with boundary
  if (!(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    credentials: 'include', // Crucial for Express session cookie transport
    headers: {
      ...defaultHeaders,
      ...(options.headers || {}),
    },
  };

  try {
    const response = await fetch(url, config);

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      const errorMessage =
        (data && (data.message || data.error)) ||
        `Request failed with status ${response.status}`;
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.status) {
      throw error;
    }
    // Network error or server not running
    const netError = new Error(
      `Cannot connect to backend server at ${API_BASE_URL}. Ensure Express backend is running.`
    );
    netError.original = error;
    netError.isNetworkError = true;
    throw netError;
  }
}

export const api = {
  // 1. Authentication APIs
  auth: {
    login: (credentials) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (userData) =>
      apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    logout: () =>
      apiRequest('/auth/logout', {
        method: 'POST',
      }),
    getMe: () =>
      apiRequest('/auth/me', {
        method: 'GET',
      }),
  },

  // 2. Public Property Discovery APIs
  properties: {
    getAll: (params = {}) => {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          query.append(k, v);
        }
      });
      const qs = query.toString();
      return apiRequest(`/properties${qs ? `?${qs}` : ''}`, { method: 'GET' });
    },
    getFeatured: () =>
      apiRequest('/properties/featured', {
        method: 'GET',
      }),
    getBySlug: (slug) =>
      apiRequest(`/properties/${slug}`, {
        method: 'GET',
      }),
    getRooms: (propertyIdOrSlug) =>
      apiRequest(`/properties/${propertyIdOrSlug}/rooms`, {
        method: 'GET',
      }),
    getRoomById: (propertyIdOrSlug, roomId) =>
      apiRequest(`/properties/${propertyIdOrSlug}/rooms/${roomId}`, {
        method: 'GET',
      }),
  },

  // 3. Owner / Partner Portal APIs
  owner: {
    getProperties: () =>
      apiRequest('/owner/properties', {
        method: 'GET',
      }),
    getPropertyById: (id) =>
      apiRequest(`/owner/properties/${id}`, {
        method: 'GET',
      }),
    createProperty: (data) =>
      apiRequest('/owner/properties', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateProperty: (id, data) =>
      apiRequest(`/owner/properties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteProperty: (id) =>
      apiRequest(`/owner/properties/${id}`, {
        method: 'DELETE',
      }),
    addRoom: (propertyId, data) =>
      apiRequest(`/owner/properties/${propertyId}/rooms`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateRoom: (roomId, data) =>
      apiRequest(`/owner/rooms/${roomId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteRoom: (roomId) =>
      apiRequest(`/owner/rooms/${roomId}`, {
        method: 'DELETE',
      }),
    getBookings: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/owner/bookings${query ? `?${query}` : ''}`, {
        method: 'GET',
      });
    },
    updateBookingStatus: (id, statusOrData, maybeNotes) => {
      let payload;
      if (typeof statusOrData === 'object' && statusOrData !== null) {
        payload = statusOrData;
      } else {
        payload = { status: statusOrData };
        if (typeof maybeNotes === 'string') {
          payload.notes = maybeNotes;
          payload.reason = maybeNotes;
        } else if (typeof maybeNotes === 'object' && maybeNotes !== null) {
          Object.assign(payload, maybeNotes);
        }
      }
      return apiRequest(`/owner/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
    },
  },

  // 4. Admin Management APIs
  admin: {
    getProperties: (params = {}) => {
      let qs = '';
      if (typeof params === 'string') {
        qs = params ? `?status=${encodeURIComponent(params)}` : '';
      } else if (typeof params === 'object' && params !== null) {
        const query = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && v !== '') {
            query.append(k, v);
          }
        });
        const qStr = query.toString();
        qs = qStr ? `?${qStr}` : '';
      }
      return apiRequest(`/admin/properties${qs}`, { method: 'GET' });
    },
    updatePropertyStatus: (id, statusOrData, maybeNotes) => {
      let body;
      if (typeof statusOrData === 'object' && statusOrData !== null) {
        body = statusOrData;
      } else {
        body = { status: statusOrData };
        if (typeof maybeNotes === 'string') {
          body.reviewerNotes = maybeNotes;
          body.notes = maybeNotes;
        } else if (typeof maybeNotes === 'object' && maybeNotes !== null) {
          Object.assign(body, maybeNotes);
        }
      }
      return apiRequest(`/admin/properties/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
    },
    getPartners: () =>
      apiRequest('/admin/partners', {
        method: 'GET',
      }),
    updatePartnerStatus: (userId, status, notes) =>
      apiRequest(`/admin/partners/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, notes }),
      }),
    getStats: () =>
      apiRequest('/admin/stats', {
        method: 'GET',
      }),
    getBookings: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return apiRequest(`/admin/bookings${query ? `?${query}` : ''}`, {
        method: 'GET',
      });
    },
    moderateReview: (id, status) =>
      apiRequest(`/admin/reviews/${id}/moderation`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // 5. Booking & Reservation APIs
  bookings: {
    create: (bookingData) =>
      apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      }),
    getById: (idOrTrackingCode) =>
      apiRequest(`/bookings/${idOrTrackingCode}`, {
        method: 'GET',
      }),
    getMy: () =>
      apiRequest('/bookings/my', {
        method: 'GET',
      }),
    cancel: (id, reason) =>
      apiRequest(`/bookings/${id}/cancel`, {
        method: 'PATCH',
        body: JSON.stringify({ reason }),
      }),
  },

  // 6. Property Review APIs
  reviews: {
    getForProperty: (propertyId, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiRequest(
        `/properties/${propertyId}/reviews${qs ? `?${qs}` : ''}`,
        { method: 'GET' }
      );
    },
    submit: (propertyId, reviewData) =>
      apiRequest(`/properties/${propertyId}/reviews`, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      }),
    getById: (id) =>
      apiRequest(`/reviews/${id}`, {
        method: 'GET',
      }),
    update: (id, reviewData) =>
      apiRequest(`/reviews/${id}`, {
        method: 'PUT',
        body: JSON.stringify(reviewData),
      }),
    delete: (id) =>
      apiRequest(`/reviews/${id}`, {
        method: 'DELETE',
      }),
  },

  // 7. Destination Guides & Content APIs
  destinations: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiRequest(`/destinations${qs ? `?${qs}` : ''}`, {
        method: 'GET',
      });
    },
    getBySlug: (slug) =>
      apiRequest(`/destinations/${slug}`, {
        method: 'GET',
      }),
    create: (data) =>
      apiRequest('/destinations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id, data) =>
      apiRequest(`/destinations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id, permanent = false) =>
      apiRequest(`/destinations/${id}${permanent ? '?permanent=true' : ''}`, {
        method: 'DELETE',
      }),
  },

  // 8. Media Upload APIs
  upload: {
    image: (file, folder = 'lama-bhaila/properties', extraFields = {}) => {
      const formData = new FormData();
      formData.append('image', file);
      if (folder) formData.append('folder', folder);
      if (extraFields && typeof extraFields === 'object') {
        if (extraFields.propertyId) formData.append('propertyId', extraFields.propertyId);
        if (extraFields.roomId) formData.append('roomId', extraFields.roomId);
      }
      return apiRequest('/upload/image', {
        method: 'POST',
        body: formData,
      });
    },
    gallery: (files, category = 'Gallery', extraFields = {}) => {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append('images', f));
      if (category) formData.append('category', category);
      if (extraFields && typeof extraFields === 'object') {
        if (extraFields.propertyId) formData.append('propertyId', extraFields.propertyId);
        if (extraFields.roomId) formData.append('roomId', extraFields.roomId);
      }
      return apiRequest('/upload/gallery', {
        method: 'POST',
        body: formData,
      });
    },
    deleteImage: (data) =>
      apiRequest('/upload/image', {
        method: 'DELETE',
        body: JSON.stringify(data),
      }),
  },
};

export default api;
