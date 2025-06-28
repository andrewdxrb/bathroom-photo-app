import type { Context, Config } from "@netlify/functions";

// Use require for CommonJS modules compatibility
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const serverlessExpress = require('@vendia/serverless-express');

// Load environment variables
require('dotenv').config();

// Import our simplified modules
const { SimpleAuth } = require('../../simple-auth');
const SimpleDropbox = require('../../simple-dropbox');

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 1024 * 1024 * 1024 // 1GB limit for video files
    }
});

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize auth backend
const authBackend = new SimpleAuth();

// Initialize Dropbox service
const dropboxService = new SimpleDropbox();

// Middleware to verify authentication
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    try {
        const result = await authBackend.validateSessionToken(token);
        if (!result.success) {
            return res.status(401).json({ success: false, error: 'Invalid token' });
        }
        
        req.userId = result.userId;
        req.userRole = result.role;
        next();
    } catch (error) {
        console.error('Auth validation error:', error);
        return res.status(500).json({ success: false, error: 'Authentication failed' });
    }
}

// Middleware to require admin role
function requireAdmin(req, res, next) {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
}

// Handle upload errors
function handleUploadError(error, req, res, next) {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false, 
                error: 'File too large. Maximum size is 1GB.' 
            });
        }
    }
    next(error);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'API is running' });
});

// Authentication endpoints
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ 
            success: false, 
            error: 'Username and password are required' 
        });
    }
    
    try {
        const result = await authBackend.authenticateUser(username, password);
        
        if (result.success) {
            const sessionToken = await authBackend.createSessionToken(result.userId);
            res.json({
                success: true,
                message: 'Login successful',
                token: sessionToken,
                user: {
                    username: result.username,
                    role: result.role
                }
            });
        } else {
            res.status(401).json(result);
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

app.post('/api/logout', requireAuth, async (req, res) => {
    try {
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// User profile endpoint
app.get('/api/user/profile', requireAuth, (req, res) => {
    res.json({
        success: true,
        user: {
            userId: req.userId,
            role: req.userRole
        }
    });
});

// Dropbox API endpoints
app.post('/api/dropbox/upload', requireAuth, upload.single('file'), handleUploadError, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        const { path: filePath, metadata } = req.body;
        
        if (!filePath) {
            return res.status(400).json({ 
                success: false, 
                error: 'File path is required' 
            });
        }

        console.log(`📤 Starting upload: ${req.file.originalname} (${req.file.size} bytes) to ${filePath}`);

        const uploadResult = await dropboxService.uploadFile(
            req.file.buffer,
            filePath,
            req.file.originalname,
            JSON.parse(metadata || '{}')
        );

        if (uploadResult.success) {
            console.log(`✅ Upload successful: ${filePath}`);
            res.json(uploadResult);
        } else {
            console.error(`❌ Upload failed: ${uploadResult.error}`);
            res.status(500).json(uploadResult);
        }

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Upload failed: ' + error.message 
        });
    }
});

app.get('/api/dropbox/account', requireAuth, async (req, res) => {
    try {
        const result = await dropboxService.getAccountInfo();
        res.json(result);
    } catch (error) {
        console.error('Account info error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to get account info' 
        });
    }
});

app.post('/api/dropbox/token', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ 
                success: false, 
                error: 'Token is required' 
            });
        }

        dropboxService.setAccessToken(token);
        
        const result = await dropboxService.getAccountInfo();
        
        if (result.success) {
            res.json({ 
                success: true, 
                message: 'Token set successfully',
                account: result 
            });
        } else {
            res.status(400).json({ 
                success: false, 
                error: 'Invalid token' 
            });
        }
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to verify token' 
        });
    }
});

// Create serverless handler
const handler = serverlessExpress({ app });

export default async (req: Request, context: Context) => {
    return await handler(req, context);
};

export const config: Config = {
    path: ["/api/*", "/auth/*"]
};