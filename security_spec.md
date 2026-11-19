# TASSI-VOX — Security Specification (Phase 0 TDD)

## 1. Core Security & Editorial Invariants

1. **Founder Exclusivity (`tmerzak@gmail.com`)**:
   - Only the verified Founder account (`tmerzak@gmail.com` with `email_verified == true`) can approve, publish, unpublish, or archive published articles.
   - Only the Founder can create, update, disable, or delete documents in `adminUsers`.
   - The Founder's own `adminUsers/tmerzak_gmail_com` account is immutable regarding `role == 'founder'`, `isActive == true`, `isProtectedOwner == true`, and cannot be deleted.
2. **Strict Family-Only `/admin` Access**:
   - Authorized family accounts:
     - `tmerzak@gmail.com` (`founder`)
     - `badroumc@gmail.com` (`tech_director`)
     - `tigrine156@gmail.com` (`co_founder`)
     - `tigrinemelissalyna@gmail.com` (`co_founder`)
     - Plus any active family account explicitly added by the Founder in `adminUsers`.
   - External journalists and public visitors have ZERO read/write access to `adminUsers`, `auditLogs`, unpublished `articles`, `siteSettings` writes, or `breakingNews` writes.
3. **Granular Permissions Enforcement**:
   - Non-founder family admins can only perform actions explicitly enabled in their `adminUsers/{emailKey}.permissions` map (e.g., `create_articles`, `edit_own_articles`, `edit_all_articles`, `delete_articles`, `manage_site_settings`, `manage_breaking_news`, `manage_journalists`).
   - Even with `create_articles` + `edit_all_articles`, non-founders can NEVER transition an article into `approved` or `published`, and NEVER overwrite `approvedByEmail` or `publishedAt`.
4. **External Journalist Isolation**:
   - External verified journalists can submit proposals to `submissions` (strictly `authorUid == request.auth.uid`, `status == 'received'`), read only their own submissions (`resource.data.authorUid == request.auth.uid`), view published articles, and update only non-privileged biographical fields on their own linked `journalists/{id}` document (`existing().ownerUid == request.auth.uid`).
5. **PII Isolation & Zero Shadow Fields**:
   - Public `journalists` documents store zero email/phone/address PII.
   - All writes enforce `keys().hasAll(...) && keys().hasOnly(...)` on `create`, `affectedKeys().hasOnly(...)` on `update`, strict `.size()` caps on every string/array, `isValidId()` on single-document paths, and server timestamp integrity (`request.time`).

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)

1. **Co-founder Self-Publish Attack**: `tigrine156@gmail.com` attempts to update an article's `status` from `pending_review` to `published`.
2. **Tech Director Self-Approval Attack**: `badroumc@gmail.com` attempts to create an article directly with `status: "published"` and `approvedByEmail: "tmerzak@gmail.com"`.
3. **Privilege Escalation Attack**: `badroumc@gmail.com` attempts to update `adminUsers/badroumc_gmail_com` to set `role: "founder"` or `permissions.manage_users: true`.
4. **Founder Account Deletion Attack**: Any user (even Founder) attempts to delete `adminUsers/tmerzak_gmail_com` or set `isActive: false` on the Founder document.
5. **External Journalist Admin Snooping**: External user `journalist@example.com` attempts `get` or `list` on `adminUsers` or `auditLogs`.
6. **External Journalist Direct Publish**: External user `journalist@example.com` attempts `create` on `articles/{id}`.
7. **Unverified Email Spoofing Attack**: Attacker token has `email: "tmerzak@gmail.com"` but `email_verified: false` and attempts to publish an article.
8. **Shadow Field Injection on Article Update**: Family admin injects undocumented field `bypassApproval: true` during an article update.
9. **Journalist Profile Hijack / Moderation Bypass**: External journalist attempts to modify `isVisible: true` or `ownerUid` on a `journalists/{id}` document.
10. **Cross-Journalist Submission Scraping**: External journalist `uid-A` attempts `get` or `list` on a submission belonging to `uid-B`.
11. **Audit Log Tampering**: Even Founder attempts `update` or `delete` on `auditLogs/{logId}`.
12. **Timestamp / ID Poisoning Attack**: User submits a client-forged `createdAt` not equal to `request.time` or a malformed document ID containing invalid characters (`../../hack`).
