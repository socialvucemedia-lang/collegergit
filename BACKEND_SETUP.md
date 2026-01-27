# Backend Setup Guide for Attendance System

This guide will help you set up the backend for the attendance system using Supabase.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Node.js installed on your system
3. npm or yarn package manager

## Step 1: Install Dependencies

First, install the Supabase client library:

```bash
npm install @supabase/supabase-js
```

## Step 2: Set Up Supabase Project

1. Go to https://supabase.com and create a new project
2. Wait for your project to be fully provisioned
3. Navigate to **Settings** > **API** to get your credentials:
   - Project URL (use as `NEXT_PUBLIC_SUPABASE_URL`)
   - `anon` `public` key (use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` `secret` key (use as `SUPABASE_SERVICE_ROLE_KEY`) - **Keep this secret!**

## Step 3: Run Database Migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Open the file `supabase/migrations/001_initial_schema.sql`
3. Copy the entire SQL content
4. Paste it into the SQL Editor and run it

This will create all the necessary tables, indexes, and Row Level Security (RLS) policies.

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

## Step 5: Verify Setup

You can test the backend by making API calls to the endpoints. For example:

```bash
# Get all students
curl http://localhost:3000/api/students

# Get all departments
curl http://localhost:3000/api/departments
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Students
- `GET /api/students` - Get all students (with optional filters)
- `GET /api/students/[id]` - Get student by ID
- `POST /api/students` - Create a new student
- `PATCH /api/students/[id]` - Update student
- `DELETE /api/students/[id]` - Delete student
- `GET /api/students/[id]/attendance` - Get student attendance records and statistics

### Attendance Sessions
- `GET /api/attendance/sessions` - Get all sessions (with optional filters)
- `GET /api/attendance/sessions/[id]` - Get session by ID
- `POST /api/attendance/sessions` - Create a new session
- `PATCH /api/attendance/sessions/[id]` - Update session

### Attendance Records
- `GET /api/attendance/records` - Get attendance records
- `POST /api/attendance/records` - Create/update a single record
- `PUT /api/attendance/records` - Bulk create/update records

### Subjects
- `GET /api/subjects` - Get all subjects
- `POST /api/subjects` - Create a new subject

### Departments
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create a new department

## Database Schema

The database includes the following main tables:

- **users** - User accounts with roles (student, teacher, advisor, admin)
- **students** - Student profiles linked to users
- **teachers** - Teacher profiles linked to users
- **departments** - Academic departments
- **subjects** - Course subjects
- **attendance_sessions** - Attendance sessions/classes
- **attendance_records** - Individual attendance records
- **timetable_slots** - Class timetable slots
- **teacher_subject_allocations** - Teacher-subject assignments

## Row Level Security (RLS)

The database uses Row Level Security policies to ensure:
- Users can only access their own data
- Teachers can view and manage their own sessions
- Students can view their own attendance records
- Admins have full access

## Next Steps

1. Seed initial data (departments, subjects, users, etc.)
2. Integrate the frontend with these API endpoints
3. Add authentication middleware if needed
4. Customize RLS policies based on your requirements

## Notes

- The service role key should **never** be exposed to the client side
- Always use the anon key for client-side operations
- Use the service role key only in server-side API routes
- RLS policies ensure data security at the database level
