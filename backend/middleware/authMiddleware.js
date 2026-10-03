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

    if (!roles.includes(req.user.role)) {
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

  if (req.user.role !== 'owner') {
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

module.exports = {
  protect,
  authorize,
  ensureApprovedOwner,
  optionalAuth,
};
