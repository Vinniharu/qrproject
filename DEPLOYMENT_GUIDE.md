# 🚀 Vercel Deployment Guide

## Environment Variables Setup

Your QR Attendance System requires specific environment variables to work properly in production. The 500 error you're experiencing is likely due to missing environment variables.

### Required Environment Variables

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Format: `https://your-project-id.supabase.co`
   - Found in: Supabase Dashboard → Settings → API

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Found in: Supabase Dashboard → Settings → API

3. **SUPABASE_SERVICE_ROLE_KEY** ⚠️ **CRITICAL**
   - Your Supabase service role key (secret)
   - Found in: Supabase Dashboard → Settings → API
   - **This is the key that's likely missing and causing the 500 error**

4. **NEXT_PUBLIC_APP_URL**
   - Your deployed app URL
   - Format: `https://your-app-name.vercel.app`

## Step-by-Step Vercel Setup

### 1. Access Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Sign in to your account
3. Find your QR Attendance project

### 2. Add Environment Variables
1. Click on your project
2. Go to **Settings** tab
3. Click **Environment Variables** in the sidebar
4. Add each variable:

#### Add NEXT_PUBLIC_SUPABASE_URL:
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://your-project-id.supabase.co`
- **Environment**: All (Production, Preview, Development)

#### Add NEXT_PUBLIC_SUPABASE_ANON_KEY:
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Your anon key from Supabase
- **Environment**: All (Production, Preview, Development)

#### Add SUPABASE_SERVICE_ROLE_KEY (MOST IMPORTANT):
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: Your service role key from Supabase
- **Environment**: All (Production, Preview, Development)
- ⚠️ **This is likely the missing variable causing your 500 error**

#### Add NEXT_PUBLIC_APP_URL:
- **Name**: `NEXT_PUBLIC_APP_URL`
- **Value**: `https://your-app-name.vercel.app`
- **Environment**: All (Production, Preview, Development)

### 3. Get Your Supabase Keys

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → Use for `SUPABASE_SERVICE_ROLE_KEY`

### 4. Redeploy Your Application

After adding all environment variables:
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## Troubleshooting

### Still Getting 500 Errors?

1. **Check Environment Variables**:
   ```bash
   # In your Vercel function logs, you should see:
   # SUPABASE_SERVICE_ROLE_KEY is set: true
   ```

2. **Verify Supabase Configuration**:
   - Ensure your Supabase project is active
   - Check that RLS policies are properly configured
   - Verify the service role key is correct

3. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Functions tab
   - Look for error logs from `/api/attendance/mark`

### Common Issues:

#### Issue: "Database permission error"
**Solution**: Add the `SUPABASE_SERVICE_ROLE_KEY` environment variable

#### Issue: "Session not found"
**Solution**: Ensure you have active attendance sessions created

#### Issue: "Missing required fields"
**Solution**: Check that the frontend is sending all required data

## Database Setup Verification

Ensure your Supabase database has the correct schema:

1. Go to Supabase Dashboard → SQL Editor
2. Run the database schema from `database-schema.sql`
3. Run the late threshold update from `update-late-threshold.sql`

## Testing the Deployment

1. Create a test attendance session as a lecturer
2. Generate a QR code
3. Try to mark attendance as a student
4. Check if the attendance appears in the lecturer dashboard

## Security Notes

- Never commit the `SUPABASE_SERVICE_ROLE_KEY` to your repository
- The service role key has admin privileges - keep it secure
- Use environment variables for all sensitive configuration

## Need Help?

If you're still experiencing issues:
1. Check the Vercel function logs
2. Verify all environment variables are set correctly
3. Ensure your Supabase project is properly configured
4. Test the API endpoints directly using tools like Postman

---

**Remember**: The `SUPABASE_SERVICE_ROLE_KEY` is the most critical environment variable for the attendance marking functionality to work properly! 