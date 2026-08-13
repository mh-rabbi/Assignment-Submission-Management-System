# Roll Call Frontend — Known Issues

*Updated continuously. Cleared when resolved.*

---

## Active Issues

None yet — build has not started.

---

## Deferred / Watch Items

### W-01 — Self-serve admin/teacher account creation
Self-serve registration via `/api/auth/register` allows anyone to create Admin or Teacher accounts. This is flagged in decisions.md (D-07) as a product/security decision for the backend team.

### W-02 — File storage is local disk
Uploaded files are stored on the backend server's local disk (`wwwroot/uploads`). File download works while the backend server is running. No CDN or cloud storage. Noted as a known limitation in the backend plan.

### W-03 — No server-side pagination
All list endpoints return full unfiltered arrays. Client-side pagination is our workaround (built into DataTable). At real school scale (hundreds of users, thousands of submissions), this would need a backend pagination API. Documented in `backend_api.md` §10.

### W-04 — `backdrop-filter` Safari support
`backdrop-filter` requires `-webkit-backdrop-filter` prefix for older Safari. Both are included in the glass utility classes. Verify on real device in Phase 9.
