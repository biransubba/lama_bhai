const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

// Configure Local Strategy (Email + Password)
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        if (!email || !password) {
          return done(null, false, { message: 'Please provide both email and password' });
        }

        // Query user with password explicitly included (+password)
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

        if (!user) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        if (!user.isActive) {
          return done(null, false, { message: 'This account has been deactivated. Please contact support.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
          return done(null, false, { message: 'Invalid email or password' });
        }

        // Update last login timestamp asynchronously
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Serialize user ID into session cookie
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session cookie by ID
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user || !user.isActive) {
      return done(null, false);
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
