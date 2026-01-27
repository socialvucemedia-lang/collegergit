# API Documentation

This document describes all available API endpoints for the Attendance System backend.

## Base URL

All API routes are prefixed with `/api`:
- Development: `http://localhost:3000/api`
- Production: `https://your-domain.com/api`

## Authentication Endpoints

### POST /api/auth/login

Authenticate a user and return session information.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "student" // or "teacher", "advisor", "admin"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "student",
    "full_name": "John Doe"
  },
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

### POST /api/auth/register

Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "John Doe",
  "role": "student",
  "roll_number": "201", // for students
  "employee_id": "EMP001", // for teachers
  "department_id": "uuid" // optional
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "student"
  }
}
```

## Students Endpoints

### GET /api/students

Get all students with optional filters.

**Query Parameters:**
- `roll_number` (optional) - Filter by roll number
- `department_id` (optional) - Filter by department

**Response:**
```json
{
  "students": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "roll_number": "201",
      "department_id": "uuid",
      "semester": 2,
      "user": { ... },
      "department": { ... }
    }
  ]
}
```

### GET /api/students/[id]

Get a specific student by ID.

**Response:**
```json
{
  "student": {
    "id": "uuid",
    "roll_number": "201",
    "user": { ... },
    "department": { ... }
  }
}
```

### POST /api/students

Create a new student.

**Request Body:**
```json
{
  "roll_number": "201",
  "user_id": "uuid",
  "department_id": "uuid", // optional
  "semester": 2, // optional
  "admission_year": 2023 // optional
}
```

### PATCH /api/students/[id]

Update a student.

**Request Body:**
```json
{
  "semester": 3,
  "department_id": "uuid"
}
```

### DELETE /api/students/[id]

Delete a student.

### GET /api/students/[id]/attendance

Get attendance records and statistics for a student.

**Query Parameters:**
- `subject_id` (optional) - Filter by subject
- `start_date` (optional) - Start date for date range
- `end_date` (optional) - End date for date range

**Response:**
```json
{
  "records": [ ... ],
  "statistics": {
    "total_sessions": 100,
    "present_count": 82,
    "absent_count": 18,
    "attendance_rate": 82.0
  }
}
```

## Attendance Sessions Endpoints

### GET /api/attendance/sessions

Get all attendance sessions with optional filters.

**Query Parameters:**
- `teacher_id` (optional) - Filter by teacher
- `subject_id` (optional) - Filter by subject
- `date` (optional) - Filter by date (YYYY-MM-DD)
- `status` (optional) - Filter by status (scheduled, active, completed, cancelled)

**Response:**
```json
{
  "sessions": [
    {
      "id": "uuid",
      "subject_id": "uuid",
      "teacher_id": "uuid",
      "session_date": "2024-01-15",
      "start_time": "08:30:00",
      "end_time": "09:30:00",
      "room": "B-21",
      "status": "completed",
      "subject": { ... },
      "teacher": { ... }
    }
  ]
}
```

### GET /api/attendance/sessions/[id]

Get a specific attendance session by ID.

### POST /api/attendance/sessions

Create a new attendance session.

**Request Body:**
```json
{
  "subject_id": "uuid",
  "teacher_id": "uuid", // optional
  "session_date": "2024-01-15",
  "start_time": "08:30:00", // optional
  "end_time": "09:30:00", // optional
  "room": "B-21", // optional
  "status": "scheduled" // optional, default: "scheduled"
}
```

### PATCH /api/attendance/sessions/[id]

Update an attendance session (e.g., change status to "active" or "completed").

## Attendance Records Endpoints

### GET /api/attendance/records

Get attendance records with optional filters.

**Query Parameters:**
- `session_id` (optional) - Filter by session
- `student_id` (optional) - Filter by student

**Response:**
```json
{
  "records": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "student_id": "uuid",
      "status": "present", // or "absent", "late", "excused"
      "marked_at": "2024-01-15T08:35:00Z",
      "session": { ... },
      "student": { ... }
    }
  ]
}
```

### POST /api/attendance/records

Create or update a single attendance record.

**Request Body:**
```json
{
  "session_id": "uuid",
  "student_id": "uuid",
  "status": "present",
  "notes": "On time" // optional
}
```

### PUT /api/attendance/records

Bulk create/update attendance records for a session.

**Request Body:**
```json
{
  "session_id": "uuid",
  "records": [
    {
      "student_id": "uuid",
      "status": "present",
      "notes": "Optional note"
    },
    {
      "student_id": "uuid",
      "status": "absent"
    }
  ]
}
```

**Response:**
```json
{
  "records": [ ... ] // Array of created/updated records
}
```

## Subjects Endpoints

### GET /api/subjects

Get all subjects with optional filters.

**Query Parameters:**
- `department_id` (optional) - Filter by department
- `semester` (optional) - Filter by semester

**Response:**
```json
{
  "subjects": [
    {
      "id": "uuid",
      "code": "CS201",
      "name": "Data Structures",
      "department_id": "uuid",
      "semester": 2,
      "credits": 4,
      "department": { ... }
    }
  ]
}
```

### POST /api/subjects

Create a new subject.

**Request Body:**
```json
{
  "code": "CS201",
  "name": "Data Structures",
  "department_id": "uuid", // optional
  "semester": 2, // optional
  "credits": 4 // optional
}
```

## Departments Endpoints

### GET /api/departments

Get all departments.

**Response:**
```json
{
  "departments": [
    {
      "id": "uuid",
      "code": "CS",
      "name": "Computer Science",
      "description": "Computer Science Department"
    }
  ]
}
```

### POST /api/departments

Create a new department.

**Request Body:**
```json
{
  "code": "CS",
  "name": "Computer Science",
  "description": "Computer Science Department" // optional
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All UUIDs are in standard UUID format
- Date formats: `YYYY-MM-DD` for dates, `HH:MM:SS` for times
- Row Level Security (RLS) policies enforce data access rules at the database level
