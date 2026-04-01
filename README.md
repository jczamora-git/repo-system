
# LRMS (Learning Resource Management System)

 - LRMS Backend System (Django + MySQL + S3)

## Overview
A scalable, role-based system for managing educational resources across institutions (DepEd, CHED, ALS).

---

## Features

- Dynamic hierarchy (Institution → Program → Subject)
- Role-based access control
- File approval workflow
- Version control
- Analytics & audit logs
- S3 cloud storage integration
- Tagging and metadata support

---

## User Roles

- Super Admin – system control
- Admin – manages users
- Coordinator – approves uploads
- Teacher – uploads resources
- Student – accesses resources

---

## File Access Types

- Private – owner only
- Public – inside system
- Restricted – specific users/groups
- Mass – public outside system

---

## Sample Flow

1. Teacher uploads file:
   - Path: CCS/BSIT/Programming 1
   - Access: Restricted

2. System:
   - Auto-creates nodes
   - Stores file in S3

3. Coordinator:
   - Approves file

4. Student:
   - Searches resource
   - Downloads if permitted

---

## Example Structure

CCS/
 └── BSIT/
      └── Programming 1/
           └── files

---

## Tech Stack

- Django + DRF
- MySQL
- AWS S3
- Redis (optional)
- Elasticsearch (optional)

---

## Notes

- Files are NOT stored in DB
- Only file_key is stored
- System is scalable and multi-institution ready

---



## 📌 Why We Use NODE Instead of Separate Tables

### ❌ Separate Tables Approach
Institution → Program → Subject → File

Problems:
- Fixed structure (not flexible)
- Hard to support ALS, SHS, College in one system
- Requires schema change when structure changes
- Cannot support custom folders easily

---

### ✅ Node (Materialized Path) Approach

We use ONE table (`Node`) to represent ALL hierarchy levels.

Example:
    CCS.BSIT.Programming 1
    SeniorHigh.Grade 11.Math
    ALS.ALS.Subject

---

### 🔥 Advantages

- Fully dynamic (supports any institution)
- No schema changes needed
- Supports unlimited depth
- Faster reads using indexed `path`
- Easier to scale

---

## 🧠 System Flow

### Upload Flow

1. Teacher uploads file
2. System:
   - Parses path (e.g., CCS/BSIT/Programming 1)
   - Auto-creates nodes
3. File stored in S3
4. Status = Pending

---

### Approval Flow

1. Coordinator reviews file
2. Approves → status = approved
3. File becomes visible

---

### Access Flow

- Private → owner only
- Public → all users
- Restricted → specific users/groups
- Mass → external public access

---

## 📂 Example Structure

CCS/
 └── BSIT/
      └── Programming 1/
           └── Files

---

## 🔍 Query Example

Get all subjects under BSIT:
```python
Node.objects.filter(path__startswith="CCS.BSIT", depth=2)




---

🔗 Relationship Summary

User → Resource = One-to-Many
Node → Node = One-to-Many (Hierarchy)
Node → Resource = One-to-Many
Resource → Version = One-to-Many
Resource ↔ User (Access) = Many-to-Many
Resource → Analytics = One-to-Many

🧱 SIMPLIFIED ER STRUCTURE (TEXT)

User
 ├── Resource (owner)
 ├── ResourceAccess
 ├── ResourceAnalytics
 └── AuditLog

Node (Hierarchy)
 ├── Node (child)
 └── Resource

Resource
 ├── ResourceVersion
 ├── ResourceAccess
 ├── ResourceAnalytics
 └── AuditLog




---

🛣️ DEVELOPMENT ROADMAP
Phase 1 (Current)
    LRMS core
    🔍 ADVANCED SEARCH (ELASTICSEARCH)
        Full-text search
        Filters:
            Subject
            Tags
            Grade
        Autocomplete
Phase 2
    Website module (Announcements, News)
Phase 3
    Analytics dashboard
Phase 4
    LMS features
    Educational Games
Phase 5
    AI features

---

## EXPANSION PLAN (OFFICIAL WEBSITE + LMS FEATURES)

🌐 Phase 2. OFFICIAL WEBSITE MODULE
    - Public-facing website
    - School updates
    - Engagement platform

📰 News/Announcement
    Title
    Content
    Featured image
    Category (Events, Updates)
    Publish date

📢 Event
    Event name
    Description
    Date & time
    Location
    Organizer

🏫 ORGANIZATIONAL STRUCTURE

---

📊 Phase 3. ADVANCED ANALYTICS DASHBOARD
    Most downloaded resources
    Active users
    Popular subjects
    File usage trends

👉 Tech:

    Charts (Chart.js / Recharts)
