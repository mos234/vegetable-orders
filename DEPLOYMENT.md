# Deployment Guide - GitHub Pages

This guide explains how to deploy the Vegetable Orders app to GitHub Pages for free hosting.

---

## Prerequisites

1. A GitHub account (free at [github.com](https://github.com))
2. Git installed on your computer
3. The vegetable-orders project folder

---

## Step-by-Step Deployment

### Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click the **+** icon in the top right corner
3. Select **"New repository"**
4. Enter repository name: `vegetable-orders`
5. Set visibility to **Public** (required for free GitHub Pages)
6. Click **"Create repository"**

### Step 2: Initialize Git in Your Project

Open a terminal/command prompt in your project folder and run:

```bash
# Navigate to your project folder
cd "d:\סדנת היחידה\שיעור 1\vegetable-orders"

# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit - Vegetable Orders PWA"
```

### Step 3: Connect to GitHub

```bash
# Add your GitHub repository as remote
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/vegetable-orders.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **"Settings"** (tab at the top)
3. Scroll down to **"Pages"** in the left sidebar
4. Under **"Source"**, select:
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **"Save"**

### Step 5: Access Your App

After a few minutes, your app will be available at:

```
https://YOUR_USERNAME.github.io/vegetable-orders/
```

---

## Important Notes for PWA

### Update Service Worker Paths

If your app is not at the root domain, update `service-worker.js`:

```javascript
// Change from:
const CACHE_URLS = [
    '/',
    '/index.html',
    // ...
];

// To:
const CACHE_URLS = [
    '/vegetable-orders/',
    '/vegetable-orders/index.html',
    // ...
];
```

### Update Manifest Start URL

In `manifest.json`, update:

```json
{
    "start_url": "/vegetable-orders/index.html",
    "scope": "/vegetable-orders/"
}
```

---

## Installing as PWA on Mobile

### Android (Chrome)

1. Open the app URL in Chrome
2. Tap the **three dots** menu
3. Select **"Add to Home screen"** or **"Install app"**
4. Tap **"Add"**
5. The app icon will appear on your home screen

### iOS (Safari)

1. Open the app URL in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Enter a name and tap **"Add"**
5. The app icon will appear on your home screen

---

## Updating the App

After making changes:

```bash
# Stage changes
git add .

# Commit with message
git commit -m "Description of changes"

# Push to GitHub
git push
```

GitHub Pages will automatically update within a few minutes.

---

## Troubleshooting

### App Not Updating

1. Clear browser cache
2. In Chrome DevTools (F12), go to Application > Service Workers
3. Click "Unregister" on the service worker
4. Refresh the page

### PWA Not Installing

1. Make sure you're using HTTPS (GitHub Pages provides this)
2. Check that `manifest.json` is properly linked
3. Verify the service worker is registered (check console for errors)

### Offline Mode Not Working

1. Visit all pages at least once while online
2. Check service worker is active in DevTools
3. Try incrementing `CACHE_NAME` version in `service-worker.js`

---

## Alternative Hosting Options

If GitHub Pages doesn't work for you, try these free alternatives:

1. **Netlify** - [netlify.com](https://netlify.com)
   - Drag and drop your folder to deploy

2. **Vercel** - [vercel.com](https://vercel.com)
   - Connect your GitHub repo for automatic deploys

3. **Firebase Hosting** - [firebase.google.com](https://firebase.google.com)
   - Google's free hosting with CLI tools

---

## Custom Domain (Optional)

To use a custom domain with GitHub Pages:

1. Buy a domain from a registrar (Namecheap, Google Domains, etc.)
2. In your repo's Settings > Pages, enter your custom domain
3. Create a `CNAME` file in your repo with your domain name
4. Configure DNS at your domain registrar:
   - Add CNAME record pointing to `YOUR_USERNAME.github.io`

---

## Need Help?

- GitHub Pages Documentation: [docs.github.com/pages](https://docs.github.com/pages)
- PWA Documentation: [web.dev/progressive-web-apps](https://web.dev/progressive-web-apps)
