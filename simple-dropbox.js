// Simplified Dropbox Service for Netlify Functions
class SimpleDropbox {
    constructor() {
        this.accessToken = null;
    }

    setAccessToken(token) {
        this.accessToken = token;
    }

    async uploadFile(fileBuffer, filePath, originalName, metadata = {}) {
        if (!this.accessToken) {
            return { success: false, error: 'No access token configured' };
        }

        try {
            const fetch = require('node-fetch');
            
            const response = await fetch('https://content.dropboxapi.com/2/files/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Dropbox-API-Arg': JSON.stringify({
                        path: filePath,
                        mode: 'add',
                        autorename: true
                    }),
                    'Content-Type': 'application/octet-stream'
                },
                body: fileBuffer
            });

            if (response.ok) {
                const result = await response.json();
                return { success: true, file: result };
            } else {
                const error = await response.text();
                return { success: false, error: `Upload failed: ${error}` };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getAccountInfo() {
        if (!this.accessToken) {
            return { success: false, error: 'No access token configured' };
        }

        try {
            const fetch = require('node-fetch');
            
            const response = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`
                }
            });

            if (response.ok) {
                const account = await response.json();
                return { success: true, account };
            } else {
                return { success: false, error: 'Failed to get account info' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = SimpleDropbox;