# Detailed Test Cases & Expected Behaviors
**Test Engineer:** Senior QA Engineer  
**Format:** Black-box testing scenarios with expected outcomes  
**Status:** Ready for execution in staging environment

---

## TEST SUITE 1: RATE LIMITING

### TC-001: Login Rate Limit Enforcement
**Test Type:** Security / Functional  
**Priority:** CRITICAL

**Setup:**
- Backend running on localhost:8000
- PostgreSQL running with test user: ADMIN/admin123

**Test Steps:**
```
1. POST /api/auth/login
   Payload: {"employee_id": "INVALID", "password": "wrong"}
   Expected: 401 Unauthorized

2. Repeat step 1 for attempts 2-5
   Expected: All return 401 Unauthorized

3. Attempt 6 (within 60 seconds)
   Expected: 429 Too Many Requests
   Response: {"detail": "Rate limit exceeded. Please try again later."}

4. Wait 60 seconds

5. Attempt 7 (after rate limit window)
   Expected: 401 Unauthorized (counter reset)
```

**Pass Criteria:**
- ✅ Requests 1-5 return 401
- ✅ Request 6 returns 429
- ✅ Request 7 (after reset) returns 401
- ✅ Correct error messages returned

---

### TC-002: Successful Login Resets Counter
**Test Type:** Functional  
**Priority:** HIGH

**Test Steps:**
```
1. POST /api/auth/login
   Payload: {"employee_id": "ADMIN", "password": "admin123"}
   Expected: 200 OK with token

2. POST /api/auth/login
   Payload: {"employee_id": "INVALID", "password": "wrong"}
   Expected: 401 Unauthorized

3. Repeat step 2 five times
   Expected: 401 each time

4. Attempt 7 (without waiting)
   Expected: 429 Too Many Requests

5. POST /api/auth/login (valid credentials)
   Expected: 200 OK with token

6. Attempt invalid login 5 times again
   Expected: All 401s, then 429 on 6th
```

**Pass Criteria:**
- ✅ Successful login accepted even after failed attempts
- ✅ Counter resets after successful login
- ✅ Can retry failed logins after valid login

---

## TEST SUITE 2: INPUT VALIDATION

### TC-003: Signature Validation - Format Check
**Test Type:** Security / Functional  
**Priority:** CRITICAL

**Setup:**
- Job created and checked in
- Ready to submit

**Test Steps:**

**Test 3A: Valid PNG Signature**
```
POST /api/jobs/{job_id}/submit
Payload: {
  "checkout_lat": 12.34,
  "checkout_lng": 56.78,
  "products_used": "Cleaning agent",
  "remarks": "Service completed",
  "signature_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
}
Expected: 200 OK, PDF generated
```

**Test 3B: Invalid Format (JPEG instead of PNG)**
```
POST /api/jobs/{job_id}/submit
Payload: {
  ...same payload but...
  "signature_data": "data:image/jpeg;base64,..."
}
Expected: 422 Unprocessable Entity
Response: {"detail": "Invalid signature format - must be PNG base64 encoded"}
```

**Test 3C: Missing data: prefix**
```
Payload:
  "signature_data": "iVBORw0KGgo... (no data: prefix)"
Expected: 422 Unprocessable Entity
Response: {"detail": "Invalid signature format..."}
```

**Pass Criteria:**
- ✅ Valid PNG accepts and processes
- ✅ JPEG format rejected
- ✅ Missing format prefix rejected
- ✅ Clear error messages returned

---

### TC-004: Signature Size Validation
**Test Type:** Security / Functional  
**Priority:** CRITICAL

**Test Steps:**

**Test 4A: Signature Under 375KB**
```
Valid signature ~50KB: Accepts ✅
Valid signature ~300KB: Accepts ✅
```

**Test 4B: Signature Over 375KB**
```
Generate base64 string 500KB in size
POST /api/jobs/{job_id}/submit with oversized signature

Expected: 422 Unprocessable Entity
Response: {"detail": "Signature too large (400.5KB) - max 375KB"}
```

**Test 4C: Empty Signature**
```
Payload:
  "signature_data": ""
Expected: 422 Unprocessable Entity
Response: {"detail": "Signature cannot be empty"}
```

**Pass Criteria:**
- ✅ <375KB signatures accepted
- ✅ >375KB signatures rejected
- ✅ Empty signatures rejected
- ✅ Size estimate provided in error message

---

### TC-005: Text Field Length Validation
**Test Type:** Functional  
**Priority:** HIGH

**Test 5A: Products Used (Max 500 chars)**
```
Valid (500 chars): ✅ Accepted
Invalid (501 chars): ✅ 422 Rejected
```

**Test 5B: Remarks (Max 2000 chars)**
```
Valid (2000 chars): ✅ Accepted
Invalid (2001 chars): ✅ 422 Rejected
```

**Test 5C: Notes (Max 1000 chars)**
```
Valid (1000 chars): ✅ Accepted
Invalid (1001 chars): ✅ 422 Rejected
```

**Pass Criteria:**
- ✅ All fields properly enforce max length
- ✅ 422 error returned for oversized fields
- ✅ Exactly at limit accepted
- ✅ One character over limit rejected

---

## TEST SUITE 3: ERROR HANDLING

### TC-006: Job Not Found Error
**Test Type:** Functional  
**Priority:** HIGH

**Test Steps:**
```
POST /api/jobs/99999/checkin
Expected: 404 Not Found
Response: {"detail": "Job not found"}

POST /api/jobs/99999/submit
Payload: {signature, remarks, etc}
Expected: 404 Not Found
Response: {"detail": "Job not found"}
```

**Pass Criteria:**
- ✅ Non-existent job returns 404
- ✅ Clear error message
- ✅ No sensitive info leaked

---

### TC-007: Unauthorized Access
**Test Type:** Security / Functional  
**Priority:** CRITICAL

**Setup:**
- Create job assigned to Technician A
- Login as Technician B

**Test Steps:**
```
POST /api/jobs/{technician_a_job}/checkin
Expected: 404 Not Found (not 403 - prevent enumeration)

POST /api/jobs/{technician_a_job}/submit
Expected: 404 Not Found
```

**Pass Criteria:**
- ✅ Cannot access others' jobs
- ✅ Returns 404 (prevents job enumeration)
- ✅ No indication of job existence

---

### TC-008: Job Already Completed
**Test Type:** Functional  
**Priority:** HIGH

**Setup:**
- Job already submitted and completed

**Test Steps:**
```
POST /api/jobs/{completed_job}/submit
Payload: {signature, remarks, etc}
Expected: 400 Bad Request
Response: {"detail": "Job already completed"}
```

**Pass Criteria:**
- ✅ Cannot resubmit completed job
- ✅ Clear error message
- ✅ 400 Bad Request appropriate

---

### TC-009: Graceful PDF Generation Failure
**Test Type:** Operational  
**Priority:** HIGH

**Test Steps:**
```
1. Mock PDF generation to throw exception
2. POST /api/jobs/{job_id}/submit
3. Expected:
   - Job status updated to COMPLETED ✅
   - pdf_path = null or error marker
   - Email still sent (if enabled)
   - Error logged with full stack trace
   - Response includes warning:
     "message": "Service completion recorded successfully (PDF generation failed - manual review needed)"
4. Return 200 OK (job still succeeds)
```

**Pass Criteria:**
- ✅ Job completes even if PDF fails
- ✅ Error logged
- ✅ Email attempt made
- ✅ No 500 error returned

---

### TC-010: Graceful Email Failure
**Test Type:** Operational  
**Priority:** HIGH

**Test Steps:**
```
1. Mock SMTP to fail
2. POST /api/jobs/{job_id}/submit with valid data
3. Expected:
   - Job status = COMPLETED ✅
   - PDF generated ✅
   - Email not sent ✅
   - email_sent flag = false
   - Error logged
   - Response includes:
     "email_sent": false
4. Return 200 OK (job still succeeds)
```

**Pass Criteria:**
- ✅ Job succeeds despite email failure
- ✅ email_sent flag tracks actual status
- ✅ Error logged for retry
- ✅ No 500 error

---

## TEST SUITE 4: LOGGING COVERAGE

### TC-011: Login Logging
**Test Type:** Operational  
**Priority:** HIGH

**Test Steps:**
```
1. POST /api/auth/login (valid)
   Check logs for:
   "level": "INFO"
   "message": "Successful login: ADMIN"
   No password or sensitive data in logs ✅

2. POST /api/auth/login (invalid)
   Check logs for:
   "level": "WARNING"
   "message": "Failed login attempt for employee_id: INVALID"
   No password in logs ✅
```

**Pass Criteria:**
- ✅ Successful logins logged at INFO level
- ✅ Failed logins logged at WARNING level
- ✅ No passwords in logs
- ✅ Employee ID tracked for audit

---

### TC-012: Job Operation Logging
**Test Type:** Operational  
**Priority:** HIGH

**Expected Log Entries:**

```
Checkin:
  "level": "INFO"
  "message": "Checked in to job 5 by user 3"

PDF Generation Start:
  "level": "INFO"
  "message": "Generating PDF for job 5"

PDF Generation Success:
  "level": "INFO"
  "message": "PDF generated successfully: /app/uploads/pdfs/job_5_20260615_120000.pdf"

Job Completion:
  "level": "INFO"
  "message": "Job 5 marked as COMPLETED"

Email Send:
  "level": "INFO"
  "message": "Sending completion email for job 5"
  "level": "INFO"
  "message": "Completion email sent for job 5"
```

**Pass Criteria:**
- ✅ Each major operation logged
- ✅ Appropriate log levels used
- ✅ User IDs and job IDs tracked
- ✅ No sensitive data exposed

---

### TC-013: Error Logging with Stack Traces
**Test Type:** Operational  
**Priority:** HIGH

**Test Steps:**
```
1. Force an error (e.g., invalid database state)
2. Trigger endpoint that processes error
3. Check logs for:
   "level": "ERROR"
   "message": "error description"
   "exc_info": "full stack trace"
   "traceback": [...lines...]
```

**Pass Criteria:**
- ✅ Errors logged at ERROR level
- ✅ Full stack trace included
- ✅ Timestamp included
- ✅ Useful for debugging

---

## TEST SUITE 5: PRODUCTION MODE

### TC-014: Production Configuration Validation
**Test Type:** Security / Functional  
**Priority:** CRITICAL

**Test 14A: Missing SECRET_KEY in Production**
```
ENV: ENVIRONMENT=production
ENV: SECRET_KEY= (empty)

Startup Expected: RuntimeError
Message: "SECRET_KEY must be a long random string (min 32 chars) in production"
```

**Test 14B: Weak SECRET_KEY in Production**
```
ENV: ENVIRONMENT=production
ENV: SECRET_KEY=short_key

Startup Expected: RuntimeError
Message: "SECRET_KEY must be a long random string (min 32 chars)..."
```

**Test 14C: Missing SMTP_PASSWORD in Production**
```
ENV: ENVIRONMENT=production
ENV: SMTP_PASSWORD= (empty)

Startup Expected: RuntimeError
Message: "SMTP_PASSWORD must be set in production"
```

**Pass Criteria:**
- ✅ Production startup validates credentials
- ✅ Fast-fails with clear messages
- ✅ Prevents misconfiguration

---

### TC-015: Documentation Disabled in Production
**Test Type:** Functional  
**Priority:** MEDIUM

**Test Steps:**

**Development Mode:**
```
GET /docs
Expected: 200 OK, Swagger UI

GET /redoc
Expected: 200 OK, ReDoc

GET /openapi.json
Expected: 200 OK, OpenAPI spec
```

**Production Mode:**
```
ENV: ENVIRONMENT=production

GET /docs
Expected: 404 Not Found

GET /redoc
Expected: 404 Not Found

GET /openapi.json
Expected: 404 Not Found
```

**Pass Criteria:**
- ✅ Dev docs available in development
- ✅ Docs hidden in production
- ✅ Returns 404, not error

---

## TEST SUITE 6: HEALTH CHECK

### TC-016: Health Check - All Systems OK
**Test Type:** Operational  
**Priority:** HIGH

**Test Steps:**
```
GET /health
Expected Response:
{
  "status": "ok",
  "database": "ok",
  "environment": "development"
}
Status Code: 200 OK
```

**Pass Criteria:**
- ✅ Returns 200 when all systems OK
- ✅ Includes database status
- ✅ Includes environment info

---

### TC-017: Health Check - Database Down
**Test Type:** Operational  
**Priority:** HIGH

**Setup:**
- Stop PostgreSQL database

**Test Steps:**
```
GET /health
Expected Response:
{
  "status": "degraded",
  "database": "error",
  "environment": "development"
}
Status Code: 503 Service Unavailable
```

**Pass Criteria:**
- ✅ Returns 503 when degraded
- ✅ Indicates which service failed
- ✅ Useful for load balancer detection

---

## TEST SUITE 7: CORS SECURITY

### TC-018: CORS Origin Validation
**Test Type:** Security  
**Priority:** CRITICAL

**Setup:**
- Frontend on http://localhost:5173
- Backend on http://localhost:8000

**Test 18A: Allowed Origin**
```
GET /api/auth/me
Headers:
  Origin: http://localhost:5173

Expected Response Headers:
  Access-Control-Allow-Origin: http://localhost:5173 ✅
  Access-Control-Allow-Credentials: true
```

**Test 18B: Disallowed Origin**
```
GET /api/auth/me
Headers:
  Origin: http://malicious.com

Expected Response Headers:
  (No Access-Control-Allow-Origin header) ✅
  Browser blocks response
```

**Pass Criteria:**
- ✅ Allowed origin gets CORS headers
- ✅ Disallowed origin blocked
- ✅ Not allow_origins=["*"]

---

## TEST SUITE 8: END-TO-END WORKFLOW

### TC-019: Complete Job Submission Workflow
**Test Type:** Functional / Integration  
**Priority:** CRITICAL

**Scenario:** Technician completes a service job

**Preconditions:**
- Customer exists in database
- Service type exists
- Technician assigned to job
- Job status = SCHEDULED

**Steps:**

```
1. LOGIN
   POST /api/auth/login
   Payload: {"employee_id": "TECH1", "password": "password"}
   Expected: 200 OK, access_token received

2. CHECK IN
   POST /api/jobs/5/checkin?lat=12.34&lng=56.78
   Expected: 200 OK, "status": "checked_in"
   Job status now = IN_PROGRESS

3. GET JOB DETAILS
   GET /api/jobs/5
   Expected: 200 OK, job with all details

4. SUBMIT JOB
   POST /api/jobs/5/submit
   Payload:
   {
     "checkout_lat": 12.35,
     "checkout_lng": 56.79,
     "products_used": "Cleaning solution, cloth",
     "remarks": "Service completed successfully. Customer satisfied.",
     "signature_data": "data:image/png;base64,iVBORw0K..."
   }
   Expected: 200 OK
   Response:
   {
     "status": "completed",
     "pdf_path": "/uploads/pdfs/job_5_20260615_120000.pdf",
     "email_sent": true,
     "message": "Service completion recorded successfully"
   }

5. VERIFY JOB STATUS
   GET /api/jobs/5
   Expected: Job.status = COMPLETED

6. CHECK LOGS
   Expected log entries:
   - Checked in to job 5
   - Generating PDF for job 5
   - PDF generated successfully
   - Sending completion email
   - Completion email sent
```

**Pass Criteria:**
- ✅ Login successful
- ✅ Check-in recorded
- ✅ Submit succeeds with valid signature
- ✅ PDF generated
- ✅ Email sent (or logged if failed)
- ✅ Job status updated
- ✅ All operations logged

---

## TEST EXECUTION COMMAND

```bash
# To run these tests:
# 1. Start PostgreSQL
# 2. Start backend: cd backend && python -m uvicorn app.main:app --reload
# 3. Use test client or curl to run test cases
# 4. Monitor logs: tail -f backend.log
# 5. Verify database state: psql -U postgres -d servicemonks
```

---

**Test Suite Created By:** Senior QA Engineer  
**Date:** June 15, 2026  
**Ready for Execution:** YES ✅

