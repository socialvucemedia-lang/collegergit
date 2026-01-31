# 📚 Attendance Management System

A modern, mobile-first attendance management system built for educational institutions. Enables teachers to mark attendance with intuitive swipe gestures, provides real-time analytics for advisors, and gives students visibility into their attendance records.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)

## ✨ Features

### 👨‍🏫 Teachers
- **Swipe Mode** – Mark attendance with Instagram-style swipe gestures
- **List Mode** – Traditional checkbox view with search
- **Session Management** – Create, edit, and export attendance sessions
- **Reports** – Download attendance reports by subject, division, and batch

### 👨‍🎓 Students
- **Dashboard** – View attendance percentage across all subjects
- **Subject Details** – Drill down into individual subject attendance
- **Timetable** – View weekly class schedule

### 🎓 Class Advisors
- **At-Risk Students** – Identify students below 75% attendance
- **Health Dashboard** – Semester-wise attendance analytics with charts
- **Student Notes** – Add medical/general notes for students

### 👤 Admin
- **Bulk Import** – CSV import for students and subjects
- **Semester Promotion** – Mass promote students with retention options
- **Department Assignment** – Assign students to departments
- **User Management** – Create teachers, advisors, and admins

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase project (with database)

### Installation

```bash
# Clone the repository
git clone https://github.com/socialvucemedia-lang/collegergit.git
cd attendance-frontend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📁 Project Structure

```
├── app/
│   ├── (auth)/           # Login, forgot password
│   ├── (dashboard)/      # Protected routes
│   │   ├── admin/        # Admin panel
│   │   ├── advisor/      # Class advisor views
│   │   ├── student/      # Student dashboard
│   │   └── teacher/      # Teacher attendance
│   └── api/              # API routes
├── components/           # Reusable UI components
├── lib/                  # Supabase clients, utilities
├── supabase/
│   └── migrations/       # Database migrations (001-019)
└── types/                # TypeScript types
```

## 🗄️ Database Setup

Apply migrations to your Supabase project:

```bash
# Using Supabase CLI
supabase db push

# Or run migrations manually in SQL Editor
```

Key migrations:
- `001-015` – Core schema (users, students, teachers, attendance)
- `016` – RLS policy optimizations
- `017` – Foreign key indices
- `018` – Security fixes (search_path)
- `019` – Duplicate policy cleanup

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI |
| Animations | Framer Motion |
| Charts | Recharts |
| Forms | React Hook Form + Zod |

## 📖 Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Auth Integration Guide](./AUTH_INTEGRATION.md)
- [Backend Setup](./BACKEND_SETUP.md)
- [Supabase Auth Setup](./SUPABASE_AUTH_SETUP.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

---

Built with ❤️ for educational institutions
