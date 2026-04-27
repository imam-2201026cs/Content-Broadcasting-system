# Content Broadcasting System

A backend system for educational environments where teachers upload content (question papers, announcements, materials), and once approved by the Principal, it is broadcasted via a public API that students can access.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (via Mongoose ODM)
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **File Upload**: Multer (local disk storage)
- **Validation**: express-validator
- **Security**: helmet, cors, express-rate-limit

## Features

- **Auth Module**: JWT-based login/register with role-based access control (Principal / Teacher)
- **Content Upload**: Teachers upload images (JPG/PNG/GIF, max 10MB) with subject, scheduling window, and rotation duration
- **Approval Workflow**: Principal approves or rejects content (rejection requires a reason)
- **Public Broadcasting API**: Students access live content per teacher — subject-based rotation with stateless time algorithm
- **Scheduling Logic**: Each subject has its own independent rotation cycle based on content duration
- **Edge Case Handling**: No content, not scheduled, invalid teacher/subject all return graceful empty responses

---

## Setup Instructions

### Prerequisites

- Node.js v18+
- MongoDB v6+ (Local or MongoDB Atlas)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd content-broadcasting-system
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=3000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/content_broadcasting

JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads
```

### 3. Seed Default Users

Run this command to create the initial Principal and Teacher accounts:

```bash
npm run seed
```

Default accounts after seeding:

| Role      | Email                   | Password     |
|-----------|-------------------------|--------------|
| Principal | principal@school.com    | principal123 |
| Teacher 1 | teacher1@school.com     | teacher123   |
| Teacher 2 | teacher2@school.com     | teacher123   |
| Teacher 3 | teacher3@school.com     | teacher123   |

### 4. Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server runs at `http://localhost:3000`

---

## API Documentation

### Base URL
```
http://localhost:3000
```

---

### Auth Routes

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@school.com",
  "password": "password123",
  "role": "teacher"        // "teacher" or "principal"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "teacher1@school.com",
  "password": "teacher123"
}

Response:
{
  "success": true,
  "data": {
    "token": "eyJhbGc...",
    "user": { "id": "...", "name": "...", "role": "teacher" }
  }
}
```

#### Get Current User
```
GET /auth/me
Authorization: Bearer <token>
```

---

### Content Routes

#### Upload Content (Teacher only)
```
POST /content/upload
Authorization: Bearer <teacher-token>
Content-Type: multipart/form-data

Fields:
  file            (required) Image file (jpg/png/gif, max 10MB)
  title           (required) Content title
  subject         (required) Subject name (maths, science, etc.)
  description     (optional) Description text
  start_time      (optional) ISO 8601 datetime (e.g., 2024-05-01T09:00:00Z)
  end_time        (optional) ISO 8601 datetime
  rotation_duration (optional) Minutes per rotation slot (default: 5)
```

#### View My Content (Teacher only)
```
GET /content/my
Authorization: Bearer <teacher-token>

Query params:
  status    filter by status (pending/approved/rejected)
  subject   filter by subject
  page      page number (default: 1)
  limit     items per page (default: 10)
```

#### View Schedule (Teacher only)
```
GET /content/schedule
Authorization: Bearer <teacher-token>
```

#### View All Content (Principal only)
```
GET /content/all
Authorization: Bearer <principal-token>

Query params:
  status, subject, teacher_id, page, limit
```

#### View Pending Content (Principal only)
```
GET /content/pending
Authorization: Bearer <principal-token>
```

#### Approve Content (Principal only)
```
PATCH /content/:id/approve
Authorization: Bearer <principal-token>
```

#### Reject Content (Principal only)
```
PATCH /content/:id/reject
Authorization: Bearer <principal-token>
Content-Type: application/json

{
  "reason": "Content does not meet curriculum standards"
}
```

---

### Public Broadcasting API (No Auth Required)

#### Get Live Content for a Teacher
```
GET /content/live/:teacherId

Query params:
  subject   (optional) filter by specific subject

Examples:
  GET /content/live/teacher-uuid-here
  GET /content/live/teacher-uuid-here?subject=maths

Response (content available):
{
  "success": true,
  "message": "Live content fetched successfully",
  "data": {
    "maths": {
      "id": "...",
      "title": "Chapter 5 Quiz",
      "subject": "maths",
      "file_url": "/uploads/content-xxx.jpg",
      ...
    },
    "science": { ... }
  }
}

Response (no content):
{
  "success": true,
  "message": "No content available",
  "data": null
}
```

---

## Scheduling Logic

Content is shown only when:
1. Status is `approved`
2. `start_time <= current_time <= end_time`

For each subject, rotation is stateless and time-based:

```
totalCycle = sum of all content durations (in minutes)
position   = (now - fixedEpoch) % totalCycle
```

The content whose rotation window contains `position` is currently active.

**Example (Maths — 3 items):**
```
ContentA: 5 min → active at minutes 0–4
ContentB: 5 min → active at minutes 5–9
ContentC: 5 min → active at minutes 10–14
→ loops every 15 minutes
```

---

## Edge Cases

| Scenario                        | Response                    |
|---------------------------------|-----------------------------|
| No approved content             | "No content available"      |
| Approved but no time window set | Not shown in live feed      |
| Outside time window             | Not shown in live feed      |
| Invalid subject                 | "No content available"      |
| Invalid teacher ID              | "No content available"      |

---

## Folder Structure

```
src/
  app.js
  config/
    database.js
    seed.js
  models/
    index.js
    User.js
    Content.js
    ContentSlot.js
    ContentSchedule.js
  controllers/
    authController.js
    contentController.js
  services/
    authService.js
    contentService.js
    schedulingService.js
  routes/
    authRoutes.js
    contentRoutes.js
  middlewares/
    auth.js
    upload.js
    validate.js
    errorHandler.js
  utils/
    response.js
uploads/
architecture-notes.txt
README.md
.env.example
```

---

## Assumptions

- Teachers must set `start_time` and `end_time` for content to appear in the live feed
- Subject names are normalized to lowercase (Maths = maths = MATHS)
- Only image files are supported (JPG, PNG, GIF) per assignment spec
- A teacher's content is only accessible via that teacher's specific live endpoint
- The public live endpoint returns current snapshot; students poll it periodically
