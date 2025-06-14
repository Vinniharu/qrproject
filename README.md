# QR Code Attendance Platform

A modern, cost-free student attendance management system built with Next.js, Supabase, and deployed on Vercel. Lecturers can create attendance sessions with QR codes, and students can mark their attendance by scanning the codes. Generate and download attendance reports as PDF files.

## 🌟 Features

- **Lecturer Dashboard**: Create and manage attendance sessions
- **QR Code Generation**: Automatic QR code generation for each session
- **Student Check-in**: No login required - scan QR and enter name
- **Automatic Late Tracking**: Students marked late if they arrive >10 minutes after class start
- **Real-time Updates**: Live attendance tracking with timestamps
- **PDF Reports**: Download attendance reports as PDF with late indicators
- **Responsive Design**: Works on desktop and mobile devices
- **Authentication**: Secure login for lecturers only
- **Cost-Free**: Hosted entirely on free tiers

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **QR Code**: qrcode.js
- **PDF Generation**: jsPDF
- **Deployment**: Vercel
- **QR Scanner**: html5-qrcode

## 📁 Project Structure

```
qr-attendance-platform/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── dashboard/
│   │   └── lecturer/
│   │       ├── page.tsx
│   │       ├── create-session/
│   │       │   └── page.tsx
│   │       └── sessions/
│   │           └── [id]/
│   │               └── page.tsx
│   ├── attend/
│   │   └── [sessionId]/
│   │       └── page.tsx
│   ├── api/
│   │   ├── attendance/
│   │   │   ├── mark/
│   │   │   │   └── route.ts
│   │   │   └── report/
│   │   │       └── [sessionId]/
│   │   │           └── route.ts
│   │   └── sessions/
│   │       ├── create/
│   │       │   └── route.ts
│   │       ├── list/
│   │       │   └── route.ts
│   │       └── [id]/
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── toast.tsx
│   │   ├── QRCodeGenerator.tsx
│   │   ├── AttendanceForm.tsx
│   │   ├── AttendanceTable.tsx
│   │   ├── SessionCard.tsx
│   │   └── PDFGenerator.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── utils.ts
│   │   └── validations.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
│   ├── icons/
│   └── images/
├── types/
│   ├── database.ts
│   └── index.ts
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── .env.local.example
├── .env.local
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier)
- A Vercel account (free tier)
- Git installed

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/qr-attendance-platform.git
cd qr-attendance-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Go to [Supabase](https://supabase.com) and create a new project
2. Wait for the database to be set up
3. Go to Settings > API to get your keys
4. Go to SQL Editor and run the database schema (see Database Schema section)

### 4. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# App URL (for QR codes)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Database Schema

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (lecturers only)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'lecturer' CHECK (role = 'lecturer'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- Create attendance_sessions table
CREATE TABLE attendance_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lecturer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  course_code TEXT NOT NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  qr_code_data TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create attendance_records table (no student authentication required)
CREATE TABLE attendance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  student_email TEXT, -- Optional field
  student_id TEXT, -- Optional student ID
  marked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_late BOOLEAN DEFAULT false,
  late_by_minutes INTEGER DEFAULT 0,
  ip_address INET, -- To prevent duplicate submissions from same device
  user_agent TEXT, -- Additional tracking
  UNIQUE(session_id, student_name) -- Prevent duplicate names in same session
);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for attendance_sessions
CREATE POLICY "Lecturers can manage their sessions" ON attendance_sessions FOR ALL USING (auth.uid() = lecturer_id);
CREATE POLICY "Anyone can view active sessions" ON attendance_sessions FOR SELECT USING (is_active = true);

-- Policies for attendance_records
CREATE POLICY "Anyone can mark attendance" ON attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Lecturers can view attendance for their sessions" ON attendance_records FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM attendance_sessions 
    WHERE attendance_sessions.id = attendance_records.session_id 
    AND attendance_sessions.lecturer_id = auth.uid()
  )
);

-- Function to automatically calculate late status
CREATE OR REPLACE FUNCTION calculate_late_status()
RETURNS TRIGGER AS $
DECLARE
  session_start_time TIME;
  session_date DATE;
  class_start_datetime TIMESTAMP WITH TIME ZONE;
  late_threshold_datetime TIMESTAMP WITH TIME ZONE;
  minutes_late INTEGER;
BEGIN
  -- Get session start time and date
  SELECT start_time, session_date INTO session_start_time, session_date
  FROM attendance_sessions 
  WHERE id = NEW.session_id;
  
  -- Create full datetime for class start
  class_start_datetime := (session_date::TEXT || ' ' || session_start_time::TEXT)::TIMESTAMP WITH TIME ZONE;
  
  -- Calculate late threshold (10 minutes after start)
  late_threshold_datetime := class_start_datetime + INTERVAL '10 minutes';
  
  -- Calculate how many minutes late (if any)
  IF NEW.marked_at > late_threshold_datetime THEN
    minutes_late := EXTRACT(EPOCH FROM (NEW.marked_at - class_start_datetime)) / 60;
    NEW.is_late := true;
    NEW.late_by_minutes := minutes_late;
  ELSE
    NEW.is_late := false;
    NEW.late_by_minutes := 0;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Trigger to automatically calculate late status
CREATE TRIGGER calculate_late_status_trigger
  BEFORE INSERT ON attendance_records
  FOR EACH ROW
  EXECUTE FUNCTION calculate_late_status();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'role');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/ssr": "^0.0.10",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "qrcode": "^1.5.3",
    "html5-qrcode": "^2.3.8",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.6.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "@types/qrcode": "^1.5.5",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
```

## 🔧 Configuration Files

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['your-supabase-url.supabase.co'],
  },
}

module.exports = nextConfig
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
}
```

## 🚀 Deployment on Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [Vercel](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables in the Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel domain)
5. Deploy

### 3. Update Supabase Settings

1. Go to your Supabase project settings
2. Add your Vercel domain to the allowed origins
3. Update the `NEXT_PUBLIC_APP_URL` environment variable with your Vercel URL

## 📱 Usage

### For Lecturers:
1. Register/Login as a lecturer
2. Create attendance sessions with course details
3. Generate QR codes for sessions
4. Monitor real-time attendance
5. Download PDF reports

### For Students:
1. Register/Login as a student
2. Scan QR codes to mark attendance
3. View attendance history

## 🔐 Security Features

- Row Level Security (RLS) enabled on all tables
- JWT-based authentication via Supabase
- Protected API routes
- Input validation and sanitization
- CORS protection

## 📊 Features Breakdown

### QR Code Generation
- Unique QR codes for each session
- Contains session ID and validation data
- Expires automatically after session end time

### PDF Reports
- Student attendance lists
- Session summaries
- Downloadable format
- Professional styling

### Real-time Updates
- Live attendance tracking
- Instant QR code generation
- Real-time session status

## 🆓 Cost Breakdown (Free Tier Limits)

- **Vercel**: 100GB bandwidth, 100 serverless functions
- **Supabase**: 500MB database, 50,000 monthly active users
- **Total Cost**: $0/month for moderate usage

## 🐛 Troubleshooting

### Common Issues:

1. **QR Code not scanning**: Ensure camera permissions are granted
2. **Database connection issues**: Check environment variables
3. **PDF generation fails**: Verify jsPDF installation
4. **Authentication errors**: Check Supabase configuration

### Development Tips:

1. Use Supabase's built-in auth helpers
2. Test QR codes with multiple devices
3. Optimize images for faster loading
4. Use TypeScript for better development experience

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase for the backend infrastructure
- Vercel for free hosting
- The open-source community

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

---

**Happy Coding! 🎉**