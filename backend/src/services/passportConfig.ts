import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import config from '../config'; // For GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
import * as userQueries from '../db/userQueries';
import { UserRecord } from '../db/userQueries'; // Import UserRecord type

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL, // This must be the full backend URL registered with Google
      scope: ['profile', 'email'], // Ensure 'email' scope is requested
    },
    async (accessToken: string, refreshToken: string | undefined, profile: Profile, done: (error: any, user?: any, info?: any) => void) => {
      try {
        console.log('Google Profile:', { // For debugging, remove in production
          id: profile.id,
          displayName: profile.displayName,
          emails: profile.emails,
          provider: profile.provider
        });

        // Check if user already exists with this Google ID
        const existingUserByGoogleId = await userQueries.findUserByGoogleId(profile.id);
        if (existingUserByGoogleId) {
          return done(null, existingUserByGoogleId);
        }

        // User not found by google_id, try to find by email or create new user
        const email = profile.emails && profile.emails[0]?.value;
        if (!email) {
          return done(new Error('Email not available from Google profile. Please ensure your Google account has a verified email.'), false);
        }

        // Check if email is already registered for a local account
        const existingUserByEmail = await userQueries.findUserByEmail(email);
        if (existingUserByEmail && !existingUserByEmail.oauth_provider && existingUserByEmail.password_hash) {
          // User with this email exists as a local account (has password, no oauth_provider)
          return done(null, false, { message: 'This email is already registered with a password. Please log in using your email and password.' });
        }
        // If email exists but is already linked to another google account (different google_id), this would be a conflict.
        // The findUserByGoogleId check handles if it's the *same* google_id.
        // If email exists for another OAuth provider, current logic will create a new user or could be enhanced.
        // For simplicity, if no existing Google ID match, we proceed to create a new user.
        // The createUser query has a UNIQUE constraint on email, so if the email is already in use by *any* account,
        // (and not caught above as a local account) it might fail there. This is acceptable.

        const username = profile.displayName || email.split('@')[0] || `user${profile.id}`;
        // Basic username uniqueness check or rely on DB constraint.
        // For a more robust solution, you might want to append random chars if username is taken.
        // userQueries.createUser will throw an error if username/email is already taken due to DB constraints.

        const newUserParams = {
          username,
          email,
          passwordHash: null, // No password for OAuth-only users
          googleId: profile.id,
          oauthProvider: 'google',
        };

        try {
          const newUserId = await userQueries.createUser(newUserParams);
          const newUser = await userQueries.findUserById(newUserId);
          if (!newUser) {
            return done(new Error('Failed to retrieve newly created OAuth user.'), false);
          }
          return done(null, newUser);
        } catch (createUserError: unknown) { // Catch as unknown
            if (createUserError instanceof Error) {
                // Now it's safe to access createUserError.message
                // The userQueries.createUser throws 'User with this email or username already exists.' for ER_DUP_ENTRY
                if (createUserError.message.includes('User with this email or username already exists')) {
                    console.warn(`OAuth user creation conflict for email ${email} or username ${username}: ${createUserError.message}`);
                    return done(null, false, { message: 'This email or username is already associated with another account. Please try logging in or use a different Google account.' });
                }
                // For other Error instances from createUser or other unexpected errors
                console.error('Error during createUser in GoogleStrategy:', createUserError);
                return done(createUserError, false);
            }
            // Handle cases where createUserError is not an Error object
            console.error('Unknown error during createUser in GoogleStrategy:', createUserError);
            return done(new Error('An unexpected error occurred during user creation.'), false);
        }

      } catch (error: unknown) { // Catch as unknown for the outer try-catch
        console.error('Error in GoogleStrategy verify callback:', error);
        if (error instanceof Error) {
            return done(error, false);
        }
        return done(new Error('An unknown error occurred during Google authentication.'), false);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  // Assuming user object has an 'id' property
  done(null, (user as UserRecord).id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await userQueries.findUserById(id);
    if (user) {
      done(null, user); // User is attached to req.user
    } else {
      done(new Error('User not found during deserialization.'), null);
    }
  } catch (err) {
    done(err, null);
  }
});

export default passport; // Export configured passport instance
