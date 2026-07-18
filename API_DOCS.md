# API Documentation

**Base URL:** `http://localhost:3000/api/v1`

All endpoints (except login, refresh, forgot-password, and reset-password) require a Bearer token:

```
Authorization: Bearer <access_token>
```

Refresh tokens are sent automatically via HttpOnly cookies on `/auth/refresh`.

---

## 1. Authentication

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
      "accessToken": "ey...",
      "refreshToken": "ey...",
      "employee": {
        "_id": "...",
        "employeeId": "EMP001",
        "firstName": "Admin",
        "lastName": "User",
        "email": "admin@company.com",
        "role": "Super Admin"
      }
    }
  }
  ```

### Logout
- **URL:** `/auth/logout`
- **Method:** `POST`
- **Auth Required:** Yes
- **Request Body:**
  ```json
  { "refreshToken": "ey..." }
  ```
- **Success Response:** `200 OK`

### Refresh Tokens
- **URL:** `/auth/refresh`
- **Method:** `POST`
- **Auth Required:** No (uses HttpOnly refresh cookie)
- **Success Response:** `200 OK` — returns new `accessToken` and rotated `refreshToken`

### Forgot Password
- **URL:** `/auth/forgot-password`
- **Method:** `POST`
- **Auth Required:** No
- **Request Body:**
  ```json
  { "email": "user@company.com" }
  ```
- **Success Response:** `200 OK` — sends a 6-digit OTP to the email

### Reset Password
- **URL:** `/auth/reset-password`
- **Method:** `POST`
- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "user@company.com",
    "otp": "123456",
    "newPassword": "NewPassword123!"
  }
  ```
- **Success Response:** `200 OK`

---

## 2. Employees

### Get All Employees
- **URL:** `/employees`
- **Method:** `GET`
- **Auth Required:** Yes (Super Admin, HR Manager)
- **Query Params:** `page`, `limit`, `search`, `role`, `department`, `status`, `sortBy`, `sortOrder`
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "employees": [...],
      "pagination": { "total": 10, "page": 1, "pages": 1, "limit": 10 }
    }
  }
  ```

### Export Employees (CSV)
- **URL:** `/employees/export`
- **Method:** `GET`
- **Auth Required:** Yes (Super Admin, HR Manager)
- **Success Response:** `200 OK` — CSV file download

### Bulk Upload Employees (CSV)
- **URL:** `/employees/bulk-upload`
- **Method:** `POST`
- **Auth Required:** Yes (Super Admin, HR Manager)
- **Content-Type:** `multipart/form-data`
- **Body:** `file` — CSV with columns: Email, First Name, Last Name, Role, Designation
- **Success Response:** `201 Created`

### Get Own Profile
- **URL:** `/employees/me`
- **Method:** `GET`
- **Auth Required:** Yes (Any Role)

### Change Own Password
- **URL:** `/employees/me/change-password`
- **Method:** `PUT`
- **Auth Required:** Yes (Any Role)
- **Request Body:**
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }
  ```
- **Success Response:** `200 OK`

### Create Employee
- **URL:** `/employees`
- **Method:** `POST`
- **Auth Required:** Yes (Super Admin, HR Manager)
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
    "reportingManager": "60d5ecb..."
  }
  ```
- **Success Response:** `201 Created`

### Get Employee by ID
- **URL:** `/employees/:id`
- **Method:** `GET`
- **Auth Required:** Yes (Super Admin, HR Manager, or Self for Employee role)

### Update Employee
- **URL:** `/employees/:id`
- **Method:** `PUT`
- **Auth Required:** Yes (Super Admin, HR Manager, or Self)
- **Notes:** Employee role can only update `phone`, `designation`, and `profileImage` on their own profile.

### Delete Employee (Soft Delete)
- **URL:** `/employees/:id`
- **Method:** `DELETE`
- **Auth Required:** Yes (Super Admin Only)
- **Success Response:** `200 OK` — sets `isDeleted=true`, `deletedAt=Date.now()`

### Upload Profile Image
- **URL:** `/employees/:id/avatar`
- **Method:** `PATCH`
- **Auth Required:** Yes (Super Admin, HR Manager, or Self)
- **Content-Type:** `multipart/form-data`
- **Body:** `file` — image file (uploaded to Cloudinary)

### Get Direct Reports
- **URL:** `/employees/:id/reportees`
- **Method:** `GET`
- **Auth Required:** Yes (Employee can only view own reportees)
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "manager": { "_id": "...", "employeeId": "EMP001", "firstName": "John", "lastName": "Doe" },
      "directReports": [...],
      "count": 3
    }
  }
  ```

### Assign Reporting Manager
- **URL:** `/employees/:id/manager`
- **Method:** `PATCH`
- **Auth Required:** Yes (Super Admin, HR Manager)
- **Request Body:**
  ```json
  { "managerId": "60d5ecb..." }
  ```
- **Notes:** Pass `null` for `managerId` to remove a manager. Circular reporting chains are rejected.

---

## 3. Organization

### Get Organization Tree
- **URL:** `/organization/tree`
- **Method:** `GET`
- **Auth Required:** Yes (Super Admin, HR Manager)
- **Success Response:** `200 OK` — nested hierarchy of employees and direct reports

---

## 4. Departments

### Get All Departments
- **URL:** `/departments`
- **Method:** `GET`
- **Auth Required:** Yes

### Get Department by ID
- **URL:** `/departments/:id`
- **Method:** `GET`
- **Auth Required:** Yes

### Create Department
- **URL:** `/departments`
- **Method:** `POST`
- **Auth Required:** Yes (Super Admin, HR Manager)
- **Request Body:**
  ```json
  { "name": "Engineering", "description": "Product development team" }
  ```

### Update Department
- **URL:** `/departments/:id`
- **Method:** `PUT`
- **Auth Required:** Yes (Super Admin, HR Manager)

### Delete Department
- **URL:** `/departments/:id`
- **Method:** `DELETE`
- **Auth Required:** Yes (Super Admin, HR Manager)

---

## 5. Dashboard

### Get Dashboard Stats
- **URL:** `/dashboard/stats`
- **Method:** `GET`
- **Auth Required:** Yes (Super Admin, HR Manager)
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "overview": {
        "totalEmployees": 50,
        "activeEmployees": 45,
        "inactiveEmployees": 5,
        "totalDepartments": 6
      },
      "departmentDistribution": [...],
      "roleDistribution": [...],
      "recentJoinees": [...],
      "salaryStats": { "average": 750000, "min": 300000, "max": 2000000 }
    }
  }
  ```

---

## 6. Attendance

### Clock In
- **URL:** `/attendance/clock-in`
- **Method:** `POST`
- **Auth Required:** Yes

### Clock Out
- **URL:** `/attendance/clock-out`
- **Method:** `POST`
- **Auth Required:** Yes

### Get Today's Status
- **URL:** `/attendance/today`
- **Method:** `GET`
- **Auth Required:** Yes

### Get My Attendance History
- **URL:** `/attendance/me`
- **Method:** `GET`
- **Auth Required:** Yes
- **Query Params:** `page`, `limit`

### Get All Attendance (Admin/HR)
- **URL:** `/attendance/all`
- **Method:** `GET`
- **Auth Required:** Yes (Super Admin, HR Manager)
- **Query Params:** `page`, `limit`, `employeeId`, `date`

---

## 7. Leaves

### Apply for Leave
- **URL:** `/leaves/apply`
- **Method:** `POST`
- **Auth Required:** Yes
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

### Get My Leaves
- **URL:** `/leaves/me`
- **Method:** `GET`
- **Auth Required:** Yes
- **Query Params:** `page`, `limit`

### Cancel Leave
- **URL:** `/leaves/:id/cancel`
- **Method:** `DELETE`
- **Auth Required:** Yes (Own pending leave only)

### Get All Leaves (Admin/HR)
- **URL:** `/leaves/all`
- **Method:** `GET`
- **Auth Required:** Yes (Super Admin, HR Manager)
- **Query Params:** `page`, `limit`, `status`

### Review Leave (Admin/HR)
- **URL:** `/leaves/:id/review`
- **Method:** `PATCH`
- **Auth Required:** Yes (Super Admin, HR Manager)
- **Request Body:**
  ```json
  {
    "status": "Approved",
    "reviewNote": "Approved as per policy"
  }
  ```

---

## 8. Messages

### Send Message
- **URL:** `/messages/send`
- **Method:** `POST`
- **Auth Required:** Yes
- **Content-Type:** `multipart/form-data`
- **Body:** `recipientId`, `subject`, `content`, optional `attachments[]`
- **Success Response:** `201 Created`

### Get Inbox
- **URL:** `/messages/inbox`
- **Method:** `GET`
- **Auth Required:** Yes
- **Query Params:** `page`, `limit`

### Get Sent Messages
- **URL:** `/messages/sent`
- **Method:** `GET`
- **Auth Required:** Yes
- **Query Params:** `page`, `limit`

### Get Unread Count
- **URL:** `/messages/unread-count`
- **Method:** `GET`
- **Auth Required:** Yes
- **Success Response:** `200 OK` — `{ "count": 3 }`

### Mark Message as Read
- **URL:** `/messages/:id/read`
- **Method:** `PATCH`
- **Auth Required:** Yes

---

## 9. Notifications

### Get Notifications
- **URL:** `/notifications`
- **Method:** `GET`
- **Auth Required:** Yes
- **Query Params:** `page`, `limit`

### Get Unread Count
- **URL:** `/notifications/unread-count`
- **Method:** `GET`
- **Auth Required:** Yes

### Mark All as Read
- **URL:** `/notifications/read-all`
- **Method:** `PATCH`
- **Auth Required:** Yes

### Mark Notification as Read
- **URL:** `/notifications/:id/read`
- **Method:** `PATCH`
- **Auth Required:** Yes

---

## 10. Audit Logs

### Get Audit Logs
- **URL:** `/audit`
- **Method:** `GET`
- **Auth Required:** Yes (Super Admin Only)
- **Query Params:** `page`, `limit`, `action`, `entity`, `userId`
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "logs": [
        {
          "_id": "...",
          "userId": "...",
          "action": "CREATE",
          "entity": "Employee",
          "description": "Created employee Jane Doe",
          "createdAt": "2024-10-01T10:00:00.000Z"
        }
      ],
      "pagination": { "total": 100, "page": 1, "pages": 10 }
    }
  }
  ```

---

## 11. Payroll

### Get My Payslips
- **URL:** `/payroll/me`
- **Method:** `GET`
- **Auth Required:** Yes (Any Role)
- **Query Params:** `page`, `limit`

### Generate Payroll (Admin/HR)
- **URL:** `/payroll/generate`
- **Method:** `POST`
- **Auth Required:** Yes (Super Admin, HR Manager)
- **Request Body:**
  ```json
  {
    "month": 10,
    "year": 2024
  }
  ```

### Get All Payroll Records (Admin/HR)
- **URL:** `/payroll/all`
- **Method:** `GET`
- **Auth Required:** Yes (Super Admin, HR Manager)
- **Query Params:** `page`, `limit`, `month`, `year`, `status`

### Mark Payslip as Paid (Admin/HR)
- **URL:** `/payroll/:id/pay`
- **Method:** `PATCH`
- **Auth Required:** Yes (Super Admin, HR Manager)

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": {
    "fieldName": ["Validation error detail"]
  }
}
```

| Status | Meaning |
|--------|---------|
| 400 | Validation error or bad request |
| 401 | Missing or invalid token |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate email) |
| 500 | Internal server error |
