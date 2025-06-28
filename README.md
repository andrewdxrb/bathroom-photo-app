# Bathroom Photo App

Photo capture application for bathroom renovations with cloud storage and secure authentication.

## Features

- Secure photo capture and upload
- Dropbox cloud storage integration  
- User authentication and admin management
- PostgreSQL database with Neon
- Responsive web interface
- Netlify serverless deployment

## Live Demo

Visit: https://dxrbphoto.netlify.app

## Tech Stack

- Frontend: HTML5, CSS3, JavaScript (Vanilla)
- Backend: Node.js, Express.js (Netlify Functions)
- Database: PostgreSQL (Neon)
- Storage: Dropbox API
- Deployment: Netlify
- Authentication: bcrypt + JWT sessions

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see .env.example)
4. Deploy to Netlify

## Environment Variables

Required environment variables:
- `NEON_DATABASE_URL` - PostgreSQL connection string
- `DROPBOX_APP_KEY` - Dropbox application key
- `DROPBOX_APP_SECRET` - Dropbox application secret
- `ENCRYPTION_KEY` - 32-character encryption key
- `SESSION_SECRET` - Session signing secret