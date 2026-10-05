/**
 * Authentication & Role-Based Authorization Middleware
 * Lama Bhaila Tourism Platform
 */

/**
 * Ensures user is authenticated via Passport.js session
 */
const protect = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || !req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in to access this resource.',
    });
  }

  if (!req.user.isActive) {
    return res.status(403).json({
      success: false,
      error: 'Your account has been deactivated. Please contact support.',
    });
  }

  next();
};

/**
 * Restricts route access to specified user roles (e.g. 'owner', 'admin')
 * @param  {...string} roles - Permitted roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to continue.',
      });
    }

    // Treat 'partner' and 'owner' interchangeably for partner portal routes
    const effectiveRoles = [...roles];
    if (roles.includes('owner') && !effectiveRoles.includes('partner')) {
      effectiveRoles.push('partner');
    }
    if (roles.includes('partner') && !effectiveRoles.includes('owner')) {
      effectiveRoles.push('owner');
    }

    if (!effectiveRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied: Role '${req.user.role}' is not authorized to perform this action.`,
      });
    }

    next();
  };
};

/**
 * Ensures owner/partner has not been suspended, rejected, or marked inactive
 * Admins are automatically granted bypass access
 */
const ensureApprovedOwner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please log in to continue.',
    });
  }

  // Admin bypass
  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.role !== 'owner' && req.user.role !== 'partner') {
    return res.status(403).json({
      success: false,
      error: 'Access denied: Partner/Owner account required.',
    });
  }

  const status = req.user.partnerProfile?.verificationStatus;

  if (status === 'Suspended' || status === 'Rejected' || status === 'Inactive') {
    return res.status(403).json({
      success: false,
      error: `Access denied: Your partner account is currently ${status.toLowerCase()}. Please contact support.`,
    });
  }

  next();
};

/**
 * Optional authentication middleware
 * Does not reject requests, but permits downstream handlers to recognize logged-in users
 */
const optionalAuth = (req, res, next) => {
  // If session is present, req.user is automatically populated by Passport
  next();
};

/**
 * Admin route guard.
 *
 * TEMPORARY DEV MODE: when ADMIN_AUTH_BYPASS=true (and NODE_ENV is NOT production),
 * the /api/admin/* routes are open without an admin login, so the /admin panel
 * can be used without logging in. Partner (/partner) authentication is NOT affected.
 *
 * Otherwise this is exactly protect + authorize('admin').
 */
const isAdminBypassEnabled = () =>
  process.env.ADMIN_AUTH_BYPASS === 'true' && process.env.NODE_ENV !== 'production';

let bypassWarned = false;
const adminAccess = (req, res, next) => {
  if (isAdminBypassEnabled()) {
    if (!bypassWarned) {
      console.warn('[SECURITY WARNING] ADMIN_AUTH_BYPASS is enabled: /api/admin/* is open without login. Disable before deploying.');
      bypassWarned = true;
    }
    return next();
  }

  return protect(req, res, (err) => {
    if (err) return next(err);
    return authorize('admin')(req, res, next);
  });
};

module.exports = {
  protect,
  authorize,
  ensureApprovedOwner,
  optionalAuth,
  adminAccess,
  isAdminBypassEnabled,
};
