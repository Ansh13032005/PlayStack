# API Documentation — Employee Management System (EMS)

**Base URL:** `http://localhost:3000/api/v1`

**Production:** Replace with your deployed API URL (e.g. `https://your-api.onrender.com/api/v1`).

---

## Table of Contents

1. [General Information](#general-information)
2. [Authentication](#1-authentication)
3. [Employees](#2-employees)
4. [Organization](#3-organization)
5. [Departments](#4-departments)
6. [Dashboard](#5-dashboard)
7. [Attendance](#6-attendance)
8. [Leaves](#7-leaves)
9. [Messages](#8-messages)
10. [Notifications](#9-notifications)
11. [Audit Logs](#10-audit-logs)
12. [Payroll](#11-payroll)
13. [Enums & Validation Rules](#enums--validation-rules)
14. [Error Responses](#error-responses)

---

## General Information

### Authentication headers

All protected endpoints require:

```
Authorization: Bearer <access_token>
```

For cookie-based refresh (`/auth/refresh`, `/auth/logout`), the client must send credentials:

```
withCredentials: true
```

The refresh token is stored in an **HttpOnly cookie** named `jwt_refresh` (not returned in the login JSON body).

### Standard success response

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { }
}
```

### Pagination patterns

**Employees** use a nested `pagination` object:

```json
{
  "employees": [...],
  "pagination": {
    "total": 17,
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Messages, Leaves, Attendance, Audit, Payroll** use a flat pattern:

```json
{
  "records": [...],
  "total": 50,
  "page": 1,
  "pages": 5
}
```

### Role access summary

| Role | Access |
|------|--------|
| **Super Admin** | Full system access including delete, audit logs, role assignment |
| **HR Manager** | Employee CRUD (no delete), departments, org chart, payroll, leaves review |
| **Employee** | Own profile, attendance, leaves, messages, payslips |

---

## 1. Authentication

> Auth endpoints (`login`, `forgot-password`, `reset-password`) are rate-limited to **5 requests per 15 minutes** per IP.

### Login

- **URL:** `/auth/login`
- **Method:** `POST`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "admin@company.com",
    "password": "Admin@123"
  }
  ```
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "accessToken": "eyJhbG...",
      "employee": {
        "_id": "665a1b2c3d4e5f6789012345",
        "employeeId": "EMP001",
        "firstName": "Rajesh",
        "lastName": "Sharma",
        "email": "admin@company.com",
        "role": "Super Admin",
        "status": "Active"
      }
    }
  }
  ```
- **Notes:**
  - `refreshToken` is set as HttpOnly cookie `jwt_refresh` — **not** in the JSON body.
  - After login, the frontend routes users by role (Employee → profile, HR/Admin → dashboard).

### Logout

- **URL:** `/auth/logout`
- **Method:** `POST`
- **Auth Required:** Yes (Bearer token)
- **Request Body:** None (uses `jwt_refresh` cookie)
- **Success Response:** `200 OK`
  ```json
  { "success": true, "message": "Logged out successfully" }
  ```
- **Notes:** Clears the `jwt_refresh` cookie and invalidates the refresh token server-side.

### Refresh Tokens

- **URL:** `/auth/refresh`
- **Method:** `POST`
- **Auth Required:** No (requires `jwt_refresh` HttpOnly cookie)
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Tokens refreshed successfully",
    "data": {
      "accessToken": "eyJhbG...",
      "employee": { "_id": "...", "role": "HR Manager", ... }
    }
  }
  ```
- **Notes:** Rotates refresh token — old cookie is replaced with a new one.

### Forgot Password

- **URL:** `/auth/forgot-password`
- **Method:** `POST`
- **Auth Required:** No
- **Request Body:**
  ```json
  { "email": "user@company.com" }
  ```
- **Success Response:** `200 OK` — sends a 6-digit OTP to the email (valid 10 minutes)

### Reset Password

- **URL:** `/auth/reset-password`
- **Method:** `POST`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "user@company.com",
    "otp": "123456",
    "password": "NewPassword123!"
  }
  ```
- **Notes:** Field is `password` (not `newPassword`). Must meet password complexity rules (8+ chars, upper, lower, number, special char).

---

## 2. Employees

### Get All Employees

- **URL:** `/employees`
- **Method:** `GET`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Query Params:**

  | Param | Type | Description |
  |-------|------|-------------|
  | `page` | number | Page number (default: 1) |
  | `limit` | number | Items per page (default: 10, max: 100) |
  | `search` | string | Search firstName, lastName, email, employeeId |
  | `department` | string | Filter by department name |
  | `role` | string | `Super Admin`, `HR Manager`, `Employee` |
  | `status` | string | `Active`, `Inactive` |
  | `sortBy` | string | `firstName`, `lastName`, `salary`, `joiningDate`, `createdAt` |
  | `sortOrder` | string | `asc` or `desc` (default: `desc`) |

- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Employees fetched successfully",
    "data": {
      "employees": [
        {
          "_id": "...",
          "employeeId": "EMP007",
          "firstName": "Rohan",
          "lastName": "Kapoor",
          "email": "rohan.kapoor@company.com",
          "phone": "9876543216",
          "department": "Engineering",
          "designation": "Senior Software Engineer",
          "salary": 1100000,
          "role": "Employee",
          "status": "Active",
          "joiningDate": "2022-05-18T00:00:00.000Z",
          "reportingManager": { "_id": "...", "firstName": "Arjun", "lastName": "Mehta" }
        }
      ],
      "pagination": {
        "total": 17,
        "page": 1,
        "limit": 10,
        "totalPages": 2,
        "hasNextPage": true,
        "hasPrevPage": false
      }
    }
  }
  ```

### Export Employees (CSV)

- **URL:** `/employees/export`
- **Method:** `GET`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Success Response:** `200 OK` — CSV file download (`Content-Type: text/csv`)

### Bulk Upload Employees (CSV)

- **URL:** `/employees/bulk-upload`
- **Method:** `POST`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Content-Type:** `multipart/form-data`
- **Body:** `file` — CSV columns: `Email`, `First Name`, `Last Name`, `Role`, `Designation`
- **Success Response:** `201 Created`

### Get Own Profile

- **URL:** `/employees/me`
- **Method:** `GET`
- **Auth Required:** Yes (any role)

### Change Own Password

- **URL:** `/employees/me/change-password`
- **Method:** `PUT`
- **Auth Required:** Yes (any role)
- **Request Body:**
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }
  ```

### Create Employee

- **URL:** `/employees`
- **Method:** `POST`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Required fields:** `firstName`, `lastName`, `email`, `password`
- **Request Body:**
  ```json
  {
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane@company.com",
    "password": "Password123!",
    "phone": "9876543210",
    "department": "Engineering",
    "designation": "Software Engineer",
    "salary": 800000,
    "joiningDate": "2024-01-15",
    "status": "Active",
    "role": "Employee",
    "reportingManager": "665a1b2c3d4e5f6789012345"
  }
  ```
- **Success Response:** `201 Created`
- **Notes:** HR Manager cannot create `Super Admin`. Phone must be 10 digits if provided.

### Get Employee by ID

- **URL:** `/employees/:id`
- **Method:** `GET`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**, or **self** for Employee role)

### Update Employee

- **URL:** `/employees/:id`
- **Method:** `PUT`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**, or **self**)
- **Notes:**
  - **Employee** role can only update own profile: `phone`, `designation`, `profileImage`
  - **HR Manager** cannot assign `Super Admin` role

### Delete Employee (Soft Delete)

- **URL:** `/employees/:id`
- **Method:** `DELETE`
- **Auth Required:** Yes (**Super Admin** only)
- **Notes:** Sets `isDeleted=true`, `deletedAt=Date.now()`. Cannot delete yourself.

### Upload Profile Image

- **URL:** `/employees/:id/avatar`
- **Method:** `PATCH`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**, or **self**)
- **Content-Type:** `multipart/form-data`
- **Body:** `file` — image uploaded to Cloudinary

### Get Direct Reports

- **URL:** `/employees/:id/reportees`
- **Method:** `GET`
- **Auth Required:** Yes (Employee can only view **own** reportees)
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "manager": {
        "_id": "...",
        "employeeId": "EMP003",
        "firstName": "Arjun",
        "lastName": "Mehta",
        "role": "Employee"
      },
      "directReports": [
        { "_id": "...", "employeeId": "EMP007", "firstName": "Rohan", "lastName": "Kapoor" }
      ],
      "count": 4
    }
  }
  ```

### Assign Reporting Manager

- **URL:** `/employees/:id/manager`
- **Method:** `PATCH`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Request Body:**
  ```json
  { "managerId": "665a1b2c3d4e5f6789012345" }
  ```
- **Notes:** Pass `null` for `managerId` to remove a manager. Circular reporting chains are rejected with `400`.

---

## 3. Organization

### Get Organization Tree

- **URL:** `/organization/tree`
- **Method:** `GET`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Success Response:** `200 OK` — array of nested nodes
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "...",
        "employeeId": "EMP001",
        "firstName": "Rajesh",
        "lastName": "Sharma",
        "role": "Super Admin",
        "designation": "CEO",
        "children": [
          {
            "_id": "...",
            "firstName": "Priya",
            "lastName": "Patel",
            "role": "HR Manager",
            "children": []
          }
        ]
      }
    ]
  }
  ```

---

## 4. Departments

### Get All Departments

- **URL:** `/departments`
- **Method:** `GET`
- **Auth Required:** Yes (any role)

### Get Department by ID

- **URL:** `/departments/:id`
- **Method:** `GET`
- **Auth Required:** Yes (any role)

### Create Department

- **URL:** `/departments`
- **Method:** `POST`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Request Body:**
  ```json
  {
    "name": "Engineering",
    "description": "Product development team",
    "headOfDepartment": "665a1b2c3d4e5f6789012345"
  }
  ```

### Update Department

- **URL:** `/departments/:id`
- **Method:** `PUT`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)

### Delete Department

- **URL:** `/departments/:id`
- **Method:** `DELETE`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Notes:** Fails if employees are assigned to this department.

---

## 5. Dashboard

### Get Dashboard Stats

- **URL:** `/dashboard/stats`
- **Method:** `GET`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "overview": {
        "totalEmployees": 17,
        "activeEmployees": 16,
        "inactiveEmployees": 1,
        "totalDepartments": 5
      },
      "charts": {
        "departmentDistribution": [
          { "name": "Engineering", "value": 6 }
        ],
        "roleDistribution": [
          { "name": "Employee", "value": 14 }
        ],
        "statusDistribution": [
          { "name": "Active", "value": 16 }
        ]
      },
      "recentJoinees": [
        { "firstName": "Isha", "lastName": "Khanna", "joiningDate": "2025-02-01" }
      ],
      "salaryStats": {
        "totalSalary": 15000000,
        "averageSalary": 882352,
        "maxSalary": 2500000,
        "minSalary": 300000
      }
    }
  }
  ```

---

## 6. Attendance

### Clock In

- **URL:** `/attendance/clock-in`
- **Method:** `POST`
- **Auth Required:** Yes (any role)
- **Notes:** Marks **Late** if clock-in is after 9:00 AM.

### Clock Out

- **URL:** `/attendance/clock-out`
- **Method:** `POST`
- **Auth Required:** Yes (any role)
- **Notes:** Marks **Half-Day** if total hours &lt; 4.

### Get Today's Status

- **URL:** `/attendance/today`
- **Method:** `GET`
- **Auth Required:** Yes (any role)

### Get My Attendance History

- **URL:** `/attendance/me`
- **Method:** `GET`
- **Auth Required:** Yes (any role)
- **Query Params:** `page`, `limit`

### Get All Attendance (Admin/HR)

- **URL:** `/attendance/all`
- **Method:** `GET`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Query Params:** `page`, `limit`, `employeeId`, `date`

---

## 7. Leaves

### Apply for Leave

- **URL:** `/leaves/apply`
- **Method:** `POST`
- **Auth Required:** Yes (any role)
- **Request Body:**
  ```json
  {
    "leaveType": "Sick",
    "startDate": "2024-10-01",
    "endDate": "2024-10-03",
    "totalDays": 3,
    "reason": "Flu"
  }
  ```
- **Notes:**
  - `leaveType`: `Sick`, `Casual`, `Earned`, `Unpaid`
  - Annual quotas: Sick=10, Casual=12, Earned=15 days
  - Creates notifications for HR/Admin

### Get My Leaves

- **URL:** `/leaves/me`
- **Method:** `GET`
- **Auth Required:** Yes (any role)
- **Query Params:** `page`, `limit`

### Cancel Leave

- **URL:** `/leaves/:id/cancel`
- **Method:** `DELETE`
- **Auth Required:** Yes (own **Pending** leave only)

### Get All Leaves (Admin/HR)

- **URL:** `/leaves/all`
- **Method:** `GET`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Query Params:** `page`, `limit`, `status` (`Pending`, `Approved`, `Rejected`)

### Review Leave (Admin/HR)

- **URL:** `/leaves/:id/review`
- **Method:** `PATCH`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Request Body:**
  ```json
  {
    "status": "Approved",
    "reviewNote": "Approved as per policy"
  }
  ```

---

## 8. Messages

### Search Recipients (Compose)

- **URL:** `/messages/recipients`
- **Method:** `GET`
- **Auth Required:** Yes (any role)
- **Query Params:**

  | Param | Type | Description |
  |-------|------|-------------|
  | `search` | string | Search by name, email, or employee ID |
  | `limit` | number | Max results (default: 100, max: 500) |

- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "employees": [
        {
          "_id": "...",
          "firstName": "Priya",
          "lastName": "Patel",
          "email": "hr@company.com",
          "employeeId": "EMP002",
          "role": "HR Manager"
        }
      ]
    }
  }
  ```
- **Notes:** Excludes current user and inactive/deleted employees. Used by the compose message picker.

### Send Message

- **URL:** `/messages/send`
- **Method:** `POST`
- **Auth Required:** Yes (any role)
- **Content-Type:** `multipart/form-data`
- **Body:**

  | Field | Required | Description |
  |-------|----------|-------------|
  | `recipientId` | Yes | Employee MongoDB `_id` |
  | `subject` | Yes | Max 100 characters |
  | `content` | Yes | Message body |
  | `attachments` | No | Up to 5 files |

- **Success Response:** `201 Created`

### Get Inbox

- **URL:** `/messages/inbox`
- **Method:** `GET`
- **Auth Required:** Yes (any role)
- **Query Params:** `page`, `limit`
- **Response data:** `{ records, total, page, pages }`

### Get Sent Messages

- **URL:** `/messages/sent`
- **Method:** `GET`
- **Auth Required:** Yes (any role)
- **Query Params:** `page`, `limit`
- **Response data:** `{ records, total, page, pages }`

### Get Unread Count

- **URL:** `/messages/unread-count`
- **Method:** `GET`
- **Auth Required:** Yes (any role)
- **Success Response:**
  ```json
  { "success": true, "data": { "count": 3 } }
  ```

### Mark Message as Read

- **URL:** `/messages/:id/read`
- **Method:** `PATCH`
- **Auth Required:** Yes (recipient only)

---

## 9. Notifications

### Get Notifications

- **URL:** `/notifications`
- **Method:** `GET`
- **Auth Required:** Yes (any role)
- **Query Params:** `limit` (default: 20) — **no pagination**, returns latest N notifications

### Get Unread Count

- **URL:** `/notifications/unread-count`
- **Method:** `GET`
- **Auth Required:** Yes (any role)
- **Success Response:**
  ```json
  { "success": true, "data": { "count": 5 } }
  ```

### Mark All as Read

- **URL:** `/notifications/read-all`
- **Method:** `PATCH`
- **Auth Required:** Yes (any role)

### Mark Notification as Read

- **URL:** `/notifications/:id/read`
- **Method:** `PATCH`
- **Auth Required:** Yes (own notifications only)

---

## 10. Audit Logs

### Get Audit Logs

- **URL:** `/audit`
- **Method:** `GET`
- **Auth Required:** Yes (**Super Admin** only)
- **Query Params:**

  | Param | Type | Description |
  |-------|------|-------------|
  | `page` | number | Page number (default: 1) |
  | `limit` | number | Items per page (default: 50) |
  | `action` | string | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `PASSWORD_RESET`, `OTHER` |
  | `resource` | string | e.g. `Employee`, `Auth`, `Leave` |
  | `user` | string | Filter by user MongoDB `_id` |

- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "records": [
        {
          "_id": "...",
          "user": {
            "_id": "...",
            "firstName": "Rajesh",
            "lastName": "Sharma",
            "email": "admin@company.com",
            "role": "Super Admin"
          },
          "action": "CREATE",
          "resource": "Employee",
          "resourceId": "...",
          "details": "Created employee Amit Verma",
          "createdAt": "2024-10-01T10:00:00.000Z"
        }
      ],
      "total": 100,
      "page": 1,
      "pages": 2
    }
  }
  ```

---

## 11. Payroll

### Get My Payslips

- **URL:** `/payroll/me`
- **Method:** `GET`
- **Auth Required:** Yes (any role)
- **Query Params:** `page`, `limit`
- **Response data:** `{ records, total, page, pages }`

### Generate Payroll (Admin/HR)

- **URL:** `/payroll/generate`
- **Method:** `POST`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Request Body:**
  ```json
  { "month": 10, "year": 2024 }
  ```
- **Success Response:**
  ```json
  { "success": true, "message": "Successfully generated payroll for 16 employees." }
  ```

### Get All Payroll Records (Admin/HR)

- **URL:** `/payroll/all`
- **Method:** `GET`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Query Params:** `page`, `limit`, `month`, `year`

### Mark Payslip as Paid (Admin/HR)

- **URL:** `/payroll/:id/pay`
- **Method:** `PATCH`
- **Auth Required:** Yes (**Super Admin**, **HR Manager**)
- **Notes:** Changes status from `Draft`/`Processed` → `Paid`

---

## Enums & Validation Rules

### Roles
`Super Admin` | `HR Manager` | `Employee`

### Employee Status
`Active` | `Inactive`

### Leave Types
`Sick` | `Casual` | `Earned` | `Unpaid`

### Leave Status
`Pending` | `Approved` | `Rejected`

### Attendance Status
`Present` | `Absent` | `Late` | `Half-Day` | `On Leave`

### Payroll Status
`Draft` | `Processed` | `Paid`

### Password rules
Minimum 8 characters with at least one uppercase, lowercase, number, and special character (`@$!%*?&`).

### Phone rules
Exactly 10 digits when provided (e.g. `9876543210`).

### Salary rules
Must be ≥ 0.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": {
    "email": ["Invalid email format"],
    "phone": ["Phone must be a valid 10-digit number"]
  }
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error or bad request |
| 401 | Missing or invalid token / wrong credentials |
| 403 | Insufficient permissions or deactivated account |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email) |
| 429 | Too many auth requests (rate limited) |
| 500 | Internal server error |

---

## Demo Credentials

Run `npm run seed:reset` in `/server` to load demo data.

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@company.com` | `Admin@123` |
| HR Manager | `hr@company.com` | `Password123!` |
| Employee | `amit.verma@company.com` | `Password123!` |
