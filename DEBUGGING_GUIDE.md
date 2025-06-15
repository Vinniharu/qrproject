# 🔧 QR Attendance System - Debugging Guide

## Current Issues & Solutions

### Issue 1: Student Info Upload Problems

#### Symptoms:
- Students can't submit attendance
- API returns 500 errors
- Form submission fails

#### Debugging Steps:

1. **Check Environment Variables**
   ```bash
   # In Vercel Dashboard → Settings → Environment Variables
   # Ensure these are set:
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ⚠️ REQUIRED
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

2. **Test API Directly**
   - Visit: `https://your-app.vercel.app/test-simple`
   - Enter a valid session ID and student details
   - Click "Test Attendance Submission"
   - Check the result for detailed response

3. **Check Vercel Function Logs**
   - Go to Vercel Dashboard → Functions
   - Look for `/api/attendance/[sessionId]/mark` logs
   - Check for error messages

4. **Verify Database Connection**
   - Ensure Supabase project is active
   - Verify service role key has proper permissions
   - Check that attendance_sessions table exists

#### Common Error Messages & Solutions:

**"Session not found"**
- **Cause**: Invalid session ID or session doesn't exist
- **Solution**: Verify session exists in database and session ID is correct

**"This attendance session is no longer active"**
- **Cause**: Session exists but `is_active = false`
- **Solution**: Activate the session in the database or create a new one

**"You have already marked attendance for this session"**
- **Cause**: Student already submitted attendance (duplicate prevention)
- **Solution**: This is expected behavior - attendance already recorded

**"Student name and email are required"**
- **Cause**: Missing required form fields
- **Solution**: Ensure all required fields are filled

**"Failed to mark attendance"**
- **Cause**: Database insertion error
- **Solution**: Check Supabase service role key and database permissions

### Issue 2: Mobile Link Access Problems

#### Symptoms:
- QR codes don't work on mobile devices
- Links don't open properly on phones
- UI is not mobile-friendly

#### Solutions Applied:

1. **Viewport Configuration**
   - Added proper viewport meta tags
   - Configured for mobile devices
   - Prevents unwanted zooming

2. **Mobile-Responsive Design**
   - Touch-friendly button sizes (min 44px)
   - Larger form inputs (prevents iOS zoom)
   - Better spacing and layout on small screens

3. **PWA Features**
   - Added web app manifest
   - Improved mobile app-like experience
   - Better icon and theme support

4. **Network Status Monitoring**
   - Detects online/offline status
   - Shows connection indicators
   - Prevents submission when offline

#### Mobile Testing Checklist:

- [ ] QR code scans properly on mobile camera
- [ ] Attendance page loads on mobile browsers
- [ ] Form inputs are easily tappable
- [ ] No horizontal scrolling required
- [ ] Network status indicator works
- [ ] Success/error messages are visible

## Testing Procedures

### 1. End-to-End Test

1. **As Lecturer:**
   - Create a new attendance session
   - Generate QR code
   - Note the session ID

2. **As Student (Desktop):**
   - Scan QR code or visit link directly
   - Fill out attendance form
   - Submit and verify success

3. **As Student (Mobile):**
   - Scan QR code with phone camera
   - Complete attendance on mobile browser
   - Verify responsive design works

### 2. API Testing

1. **Using Simple Test Page:**
   - Visit `/test-simple`
   - Enter session ID and student details
   - Click "Test Attendance Submission"
   - Check response for success/error details

2. **Direct API Test:**
   ```bash
   curl -X POST https://your-app.vercel.app/api/attendance/YOUR_SESSION_ID/mark \
     -H "Content-Type: application/json" \
     -d '{
       "student_name": "Test Student",
       "student_email": "test@example.com",
       "student_id": "TEST123"
     }'
   ```

### 3. Database Verification

1. **Check Session Exists:**
   ```sql
   SELECT * FROM attendance_sessions WHERE id = 'your-session-id';
   ```

2. **Verify Attendance Records:**
   ```sql
   SELECT * FROM attendance_records WHERE session_id = 'your-session-id';
   ```

3. **Check Session is Active:**
   ```sql
   SELECT id, title, is_active FROM attendance_sessions WHERE is_active = true;
   ```

## Environment Setup Verification

### Local Development
```bash
# Check .env.local file contains:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel)
1. Go to Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Verify all 4 variables are set for Production, Preview, and Development

## Common Issues & Quick Fixes

### Issue: "Failed to mark attendance"
**Quick Fix:**
1. Check if `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel
2. Redeploy the application after adding the key
3. Test with `/test-simple` page

### Issue: Mobile QR codes don't work
**Quick Fix:**
1. Ensure `NEXT_PUBLIC_APP_URL` points to your live domain
2. Test QR code generation with correct URL
3. Verify mobile viewport is configured

### Issue: Students see "Session not found"
**Quick Fix:**
1. Verify session exists in database
2. Check session ID in QR code URL is correct
3. Ensure session `is_active = true`

### Issue: "This attendance session is no longer active"
**Quick Fix:**
1. Update session in database: `UPDATE attendance_sessions SET is_active = true WHERE id = 'session-id'`
2. Or create a new active session

## API Endpoint Structure

The new simplified API structure:
- **Endpoint**: `/api/attendance/[sessionId]/mark`
- **Method**: POST
- **Parameters**: Session ID from URL path
- **Body**: `{ student_name, student_email, student_id }`
- **Authorization**: None (uses service role key internally)

## Monitoring & Logs

### Vercel Function Logs
- Go to Vercel Dashboard → Functions
- Filter by `/api/attendance/[sessionId]/mark`
- Look for error patterns

### Browser Console Logs
- Open Developer Tools (F12)
- Check Console tab for errors
- Look for network request failures

### Supabase Logs
- Go to Supabase Dashboard → Logs
- Check API logs for database errors
- Monitor for connection issues

## Support Checklist

When reporting issues, include:
- [ ] Error message (exact text)
- [ ] Browser and device type
- [ ] Steps to reproduce
- [ ] Session ID being tested
- [ ] Screenshot of error
- [ ] Browser console logs
- [ ] Test result from `/test-simple` page

## Quick Recovery Steps

If the system is completely broken:

1. **Verify Environment Variables**
   - All 4 variables set in Vercel
   - Redeploy after changes

2. **Test Basic Functionality**
   - Create new session as lecturer
   - Test with `/test-simple` page
   - Check database records

3. **Mobile-Specific Issues**
   - Test on different mobile browsers
   - Verify QR code URLs are correct
   - Check responsive design

4. **Database Issues**
   - Verify Supabase project is active
   - Test service role key permissions
   - Check session exists and is active

---

**Key Changes in New Version**:
- Simplified API endpoint: `/api/attendance/[sessionId]/mark`
- No complex authorization - uses service role internally
- Session ID taken from URL parameters
- Cleaner error handling and responses
- Use `/test-simple` page for quick testing 