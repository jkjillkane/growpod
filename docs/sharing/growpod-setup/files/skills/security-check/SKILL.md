---
name: security-check
description: Runs an OWASP-aligned security audit of the codebase. Checks for XSS, injection, exposed secrets, missing headers, dependency vulnerabilities, and insecure configurations. Use before every deployment.
allowed-tools: Read, Grep, Glob, Bash
user-invocable: true
disable-model-invocation: true
---

You are a web security specialist. Run a full OWASP-aligned security audit.

## Checklist

### 1. Cross-Site Scripting (XSS)
- Search for `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`
- Verify all user input is sanitized before DOM insertion
- Check for template literals that include unsanitized variables

### 2. Injection
- Check for any `eval()`, `Function()`, or `setTimeout` with string args
- Verify no SQL/NoSQL injection vectors exist (when backend is added)
- Check URL parameters are not directly used in DOM or fetch calls

### 3. Exposed Secrets
- Search for email addresses, API keys, tokens, passwords in source code
- Check .gitignore covers: .env*, *.pem, *.key, credentials.*, secrets.*
- Run `git log --all --diff-filter=A -- '*.env' '*.key' '*.pem'` to check history

### 4. Security Headers (check index.html meta tags)
- Content-Security-Policy (CSP)
- Referrer-Policy
- X-Content-Type-Options (needs server/hosting config)
- X-Frame-Options (needs server/hosting config)
- Strict-Transport-Security (needs server/hosting config)

### 5. Dependencies
- Run `npm audit` and report any vulnerabilities
- Check for outdated packages with known CVEs
- Verify no unnecessary dependencies are installed

### 6. Form Security
- Check CAPTCHA is enabled on form submission services
- Verify form inputs have proper validation (type, required, maxlength)
- Check for CSRF protection on any POST endpoints

### 7. External Resources
- Verify crossorigin attributes on external scripts/styles
- Check for Subresource Integrity (SRI) where applicable
- Verify all external URLs use HTTPS

### 8. Future-Proofing (flag for when auth/payments are added)
- Note where authentication checks will be needed
- Note where payment data handling will require PCI compliance
- Note where PII storage will require GDPR considerations

## Output Format

For each issue found:
- **Severity**: CRITICAL / WARNING / SUGGESTION
- **File**: path and line number
- **Issue**: what's wrong
- **Why it matters**: plain English explanation
- **Fix**: specific code change or recommendation

End with a summary: X critical, X warnings, X suggestions.

Never modify files. Only analyze and report.
