import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import pool from '../db'; // Corrected: db.ts exports 'pool' as default
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL } from '../config';
import { RowDataPacket } from 'mysql2';

interface User {
    id: number;
    username: string;
    email: string;
    google_id?: string;
    oauth_provider?: string;
}

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const [existingUsers] = await pool.query<RowDataPacket[]>(
            'SELECT * FROM users WHERE google_id = ?',
            [profile.id]
        );
        const existingUser = existingUsers[0] as User | undefined;

        if (existingUser) {
            return done(null, existingUser);
        }

        // User not found, create a new one
        const email = profile.emails && profile.emails[0].value;
        // Fallback for username if display name is not available
        const username = profile.displayName || (email ? email.split('@')[0] : `user${profile.id}`);

        // Check if email is already in use by a non-Google account
        if (email) {
            const [usersWithEmail] = await pool.query<RowDataPacket[]>(
                'SELECT * FROM users WHERE email = ? AND (oauth_provider IS NULL OR oauth_provider != ?)',
                [email, 'google']
            );
            if (usersWithEmail.length > 0) {
                // Email is already registered without Google OAuth
                return done(new Error('This email is already registered. Please log in with your password or use a different email.'));
            }
        }

        // Ensure username is unique if it's derived or generic
        let finalUsername = username;
        let isUsernameTaken = true;
        let counter = 1;
        while (isUsernameTaken) {
            const [usersWithUsername] = await pool.query<RowDataPacket[]>(
                'SELECT id FROM users WHERE username = ?',
                [finalUsername]
            );
            if (usersWithUsername.length === 0) {
                isUsernameTaken = false;
            } else {
                finalUsername = `${username}${counter++}`;
            }
        }


        const newUserParams: (string | null)[] = [
            finalUsername,
            email || null, // email can be null
            profile.id,
            'google'
        ];

        const [result] = await pool.query<any>( // Using 'any' for result type from INSERT
            'INSERT INTO users (username, email, google_id, oauth_provider, password_hash) VALUES (?, ?, ?, ?, NULL)',
            newUserParams
        );

        const newUser: User = {
            id: result.insertId,
            username: finalUsername,
            email: email || '', // Ensure email is a string, even if null from profile
            google_id: profile.id,
            oauth_provider: 'google'
        };
        return done(null, newUser);
    } catch (error) {
        if (error instanceof Error) {
            return done(error);
        }
        return done(new Error('An unknown error occurred during Google authentication.'));
    }
}
));

passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
    try {
        const [users] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [id]);
        const user = users[0] as User | undefined;
        if (user) {
            done(null, user);
        } else {
            done(new Error('User not found'));
        }
    } catch (error) {
        done(error);
    }
});

export default passport;
