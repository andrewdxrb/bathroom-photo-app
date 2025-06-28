import type { Context, Config } from "@netlify/functions";

export default async (req: Request, context: Context) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };

    try {
        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
            return new Response(null, { status: 200, headers: corsHeaders });
        }

        const url = new URL(req.url);
        const path = url.pathname;
        
        console.log('API Request:', req.method, path);

        // Login endpoint
        if (path.includes('login') && req.method === 'POST') {
            const body = await req.json();
            const { username, password } = body;

            const validUsers = {
                'admin': { password: 'admin123', role: 'admin' },
                'demo': { password: 'demo123', role: 'user' }
            };

            if (validUsers[username] && validUsers[username].password === password) {
                const token = btoa(`${username}:${Date.now()}`);
                
                return new Response(JSON.stringify({
                    success: true,
                    message: 'Login successful',
                    token: token,
                    user: { username, role: validUsers[username].role }
                }), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            } else {
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Invalid credentials'
                }), {
                    status: 401,
                    headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
            }
        }

        // Health check
        if (path.includes('health') || req.method === 'GET') {
            return new Response(JSON.stringify({
                success: true,
                message: 'Bathroom Photo App API is running',
                timestamp: new Date().toISOString(),
                path: path
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
        }

        // Default 404
        return new Response(JSON.stringify({
            success: false,
            error: 'Endpoint not found',
            path: path
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

    } catch (error) {
        console.error('Function error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Internal server error',
            details: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
    }
};

export const config: Config = {
    path: ["/api/*"]
};