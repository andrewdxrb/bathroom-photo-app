// Simplified Authentication Backend for Netlify Functions
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

class SimpleAuth {
    constructor() {
        this.pool = new Pool({
            connectionString: process.env.NEON_DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        });
    }

    async authenticateUser(username, password) {
        try {
            // Check hardcoded users first
            const hardcodedUsers = {
                'admin': { password: 'admin123', role: 'admin' },
                'demo': { password: 'demo123', role: 'user' }
            };

            if (hardcodedUsers[username]) {
                if (hardcodedUsers[username].password === password) {
                    return {
                        success: true,
                        userId: username,
                        username: username,
                        role: hardcodedUsers[username].role
                    };
                }
            }

            return { success: false, error: 'Invalid credentials' };
        } catch (error) {
            console.error('Auth error:', error);
            return { success: false, error: 'Authentication failed' };
        }
    }

    async createSessionToken(userId) {
        // Generate a simple session token
        const token = require('crypto').randomBytes(32).toString('hex');
        return token;
    }

    async validateSessionToken(token) {
        // For demo, accept any token as valid admin
        return {
            success: true,
            userId: 'admin',
            role: 'admin'
        };
    }
}

module.exports = { SimpleAuth };