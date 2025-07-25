# Deployment Instructions

## 1. Deploy to Vercel

### Quick Deploy (Recommended)
1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://stjcauqyofylgoqskuem.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0amNhdXF5b2Z5bGdvcXNrdWVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNDk0ODMsImV4cCI6MjA2ODkyNTQ4M30.XD5db4vAN8Klk_1HdCSB7eZfwN-KVbBSni5GNiC2OHw`
6. Click "Deploy"

### Alternative: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

## 2. Configure Supabase Auth

After deployment, you need to update Supabase settings:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `stjcauqyofylgoqskuem`
3. Go to **Authentication > URL Configuration**
4. Update these URLs:

**Site URL**: `https://your-app-name.vercel.app`
**Redirect URLs**: 
- `https://your-app-name.vercel.app/auth/callback`
- `https://your-app-name.vercel.app`

## 3. Test the Deployment

1. Open your deployed URL
2. Test user registration (email should now work properly)
3. Test VPN-based validation (turn on VPN, validate codes)

## 4. Important Notes

### ✅ What Works Now:
- **VPN Support**: Validation respects user's VPN connection
- **Proper Auth**: Email links point to your deployed domain
- **Toast Notifications**: All user feedback implemented
- **Mobile Responsive**: Works on all devices
- **Progress Tracking**: Real-time validation progress

### 🔄 Client-Side Validation:
The validation now runs in the user's browser, which means:
- ✅ VPN connections are respected
- ✅ Region-specific codes work correctly
- ✅ No server-side CORS issues
- ✅ Works from any location with appropriate VPN

### 📧 Email Configuration:
- Password reset emails will now point to your production domain
- User signup confirmations work properly
- All auth flows redirect correctly

## 5. Testing VPN Functionality

1. **Without VPN**: Test with codes from your region
2. **With UK VPN**: Test with UK-specific codes
3. **With Different Regions**: Test various region-specific codes

The validation will now work correctly based on your VPN location!
