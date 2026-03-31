# Google Drive Integration Setup

## 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "New Project" and give it a name
3. Select the project

## 2. Enable the Drive API
1. Go to **APIs & Services > Library**
2. Search for "Google Drive API"
3. Click **Enable**

## 3. Create OAuth 2.0 Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth client ID**
3. If prompted, configure the consent screen first (External, add your email as test user)
4. Application type: **Web application**
5. Name: `Doc-to-Dashboard`
6. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (local dev)
   - `http://localhost:5174` (alternate port)
   - Your production URL (e.g., `https://yourusername.github.io`)
7. Click **Create**
8. Copy the **Client ID**

## 4. Configure the App
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set your Client ID:
   ```
   VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
   ```
3. Restart the dev server

## 5. Usage
- The "Sign in with Google" button appears on the home page
- After signing in, uploaded files are stored in your Google Drive under `Doc-to-Dashboard/`
- Comments are saved as `.comments.json` alongside your markdown files
- The app only has access to files it creates (`drive.file` scope)

## Notes
- Without `VITE_GOOGLE_CLIENT_ID`, the sign-in button is hidden and the app works in guest mode
- Tokens are stored in memory only (never persisted to localStorage)
- The `drive.file` scope means the app cannot see or modify any of your other Drive files
