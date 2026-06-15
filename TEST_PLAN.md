# ServiceMonks ERP - Comprehensive Testing Plan
**Test Engineer:** Senior QA Engineer  
**Date:** June 15, 2026  
**Scope:** All security and operational improvements

---

## Test Execution Plan

### Phase 1: Environment & Configuration Tests
- [ ] Verify virtual environment setup
- [ ] Verify all dependencies installed
- [ ] Verify no secrets in .env (only example files)
- [ ] Verify .gitignore prevents secret commits

### Phase 2: Security Tests
- [ ] Secret key is NOT hardcoded
- [ ] Secret key validates in production mode
- [ ] CORS restricted (not allow_origins=["*"])
- [ ] Rate limiting middleware loaded
- [ ] Input validation on JobExecutionSubmit

### Phase 3: Startup & Health Check Tests
- [ ] Application starts without errors
- [ ] Database connection verified
- [ ] Upload directories created
- [ ] Seed data initialized
- [ ] Health endpoint returns correct status
- [ ] Health endpoint checks database

### Phase 4: Authentication & Rate Limiting Tests
- [ ] Login with valid credentials succeeds
- [ ] Login with invalid credentials fails with 401
- [ ] Rate limiting triggers after 5 failed attempts/minute
- [ ] Rate limit error message is clear
- [ ] Successful login resets rate limit counter

### Phase 5: Input Validation Tests
- [ ] Signature field rejects > 500KB
- [ ] Signature field rejects non-PNG base64
- [ ] Signature field rejects empty values
- [ ] Products_used field rejects > 500 chars
- [ ] Remarks field rejects > 2000 chars
- [ ] Notes field rejects > 1000 chars

### Phase 6: Error Handling Tests
- [ ] Invalid routes return 404
- [ ] Malformed JSON returns 422
- [ ] Database errors don't crash app
- [ ] Missing required fields return proper error
- [ ] Unauthorized access returns 403

### Phase 7: Logging Tests
- [ ] Login attempts logged
- [ ] Job creation logged
- [ ] Job submission logged
- [ ] Errors logged with stack traces
- [ ] No sensitive data in logs

### Phase 8: Job Submission Workflow Tests
- [ ] Job check-in succeeds
- [ ] Job submission with valid signature succeeds
- [ ] PDF generated successfully
- [ ] Email send attempt logged
- [ ] Job status updated to COMPLETED
- [ ] Response includes success message

### Phase 9: Error Scenarios Tests
- [ ] Submit completed job returns error
- [ ] Submit job not assigned to technician returns 403
- [ ] Submit job without signature returns validation error
- [ ] PDF generation failure doesn't block job completion
- [ ] Email failure doesn't block job completion

### Phase 10: Production Mode Tests
- [ ] Production mode disables Swagger docs
- [ ] Production mode requires SECRET_KEY
- [ ] Production mode requires SMTP_PASSWORD
- [ ] Error messages don't leak sensitive info

---

## Test Results Template

```
TEST: [Test Name]
STATUS: [PASS/FAIL]
DETAILS: [Description of what was tested and result]
SEVERITY: [Critical/High/Medium/Low]
```

