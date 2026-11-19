import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CO_FOUNDER_EMAILS,
  FOUNDER_EMAIL,
  MAX_SUBMISSION_IMAGE_BYTES,
  TECH_DIRECTOR_EMAIL,
  canApproveOrPublish,
  canEditJournalistProfile,
  canModifyAdminAccount,
  canUserPerform,
  extractVerifiedIdentity,
  isAuthorizedFamilyAdmin,
  resolveEffectivePermissions,
  validateArticleTransition,
  validateSubmissionImageFile,
} from './permissions';
import { DEFAULT_ADMIN_USERS, DEFAULT_JOURNALISTS } from '../data/seedData';

test('only verified Founder (tmerzak@gmail.com) can approve or publish articles', () => {
  assert.equal(canApproveOrPublish(FOUNDER_EMAIL, true), true);
  assert.equal(canApproveOrPublish(FOUNDER_EMAIL, false), false);
  assert.equal(canApproveOrPublish(TECH_DIRECTOR_EMAIL, true), false);
  assert.equal(canApproveOrPublish(CO_FOUNDER_EMAILS[0], true), false);
  assert.equal(canApproveOrPublish(CO_FOUNDER_EMAILS[1], true), false);
  assert.equal(canApproveOrPublish('external.journalist@press.org', true), false);
});

test('strict family allowlist permits ONLY the 4 family emails and blocks external journalists', () => {
  assert.equal(isAuthorizedFamilyAdmin(FOUNDER_EMAIL, true, DEFAULT_ADMIN_USERS), true);
  assert.equal(isAuthorizedFamilyAdmin(TECH_DIRECTOR_EMAIL, true, DEFAULT_ADMIN_USERS), true);
  assert.equal(isAuthorizedFamilyAdmin(CO_FOUNDER_EMAILS[0], true, DEFAULT_ADMIN_USERS), true);
  assert.equal(isAuthorizedFamilyAdmin(CO_FOUNDER_EMAILS[1], true, DEFAULT_ADMIN_USERS), true);
  assert.equal(isAuthorizedFamilyAdmin('external@journalist.com', true, DEFAULT_ADMIN_USERS), false);
  assert.equal(isAuthorizedFamilyAdmin(TECH_DIRECTOR_EMAIL, false, DEFAULT_ADMIN_USERS), false);
});

test('deactivated family member immediately loses admin access and all permissions', () => {
  const modified = DEFAULT_ADMIN_USERS.map((u) =>
    u.email === CO_FOUNDER_EMAILS[0] ? { ...u, isActive: false } : u
  );
  assert.equal(isAuthorizedFamilyAdmin(CO_FOUNDER_EMAILS[0], true, modified), false);
  assert.equal(canUserPerform(CO_FOUNDER_EMAILS[0], true, 'create_articles', modified), false);
});

test('Tech Director and Co-founders can draft and submit for review, but NEVER approve or publish', () => {
  const techDraft = validateArticleTransition({
    actorEmail: TECH_DIRECTOR_EMAIL,
    emailVerified: true,
    existingStatus: null,
    nextStatus: 'pending_review',
    isArticleCreator: true,
    adminUsers: DEFAULT_ADMIN_USERS,
  });
  assert.equal(techDraft.allowed, true);

  const techSelfPublish = validateArticleTransition({
    actorEmail: TECH_DIRECTOR_EMAIL,
    emailVerified: true,
    existingStatus: 'pending_review',
    nextStatus: 'published',
    isArticleCreator: true,
    adminUsers: DEFAULT_ADMIN_USERS,
  });
  assert.equal(techSelfPublish.allowed, false);

  const coFounderSelfApprove = validateArticleTransition({
    actorEmail: CO_FOUNDER_EMAILS[1],
    emailVerified: true,
    existingStatus: 'draft',
    nextStatus: 'approved',
    isArticleCreator: true,
    adminUsers: DEFAULT_ADMIN_USERS,
  });
  assert.equal(coFounderSelfApprove.allowed, false);

  const founderPublish = validateArticleTransition({
    actorEmail: FOUNDER_EMAIL,
    emailVerified: true,
    existingStatus: 'pending_review',
    nextStatus: 'published',
    isArticleCreator: false,
    adminUsers: DEFAULT_ADMIN_USERS,
  });
  assert.equal(founderPublish.allowed, true);
});

test('non-founder cannot edit already published articles', () => {
  const res = validateArticleTransition({
    actorEmail: TECH_DIRECTOR_EMAIL,
    emailVerified: true,
    existingStatus: 'published',
    nextStatus: 'draft',
    isArticleCreator: true,
    adminUsers: DEFAULT_ADMIN_USERS,
  });
  assert.equal(res.allowed, false);
});

test('protected Founder account cannot be deleted, deactivated, or demoted', () => {
  const founderDoc = DEFAULT_ADMIN_USERS.find((u) => u.email === FOUNDER_EMAIL)!;
  const deleteCheck = canModifyAdminAccount({
    actorEmail: FOUNDER_EMAIL,
    emailVerified: true,
    targetAccount: founderDoc,
    nextRole: 'founder',
    nextIsActive: true,
    isDelete: true,
  });
  assert.equal(deleteCheck.allowed, false);

  const demoteCheck = canModifyAdminAccount({
    actorEmail: FOUNDER_EMAIL,
    emailVerified: true,
    targetAccount: founderDoc,
    nextRole: 'co_founder',
    nextIsActive: true,
  });
  assert.equal(demoteCheck.allowed, false);

  const nonFounderTry = canModifyAdminAccount({
    actorEmail: TECH_DIRECTOR_EMAIL,
    emailVerified: true,
    targetAccount: DEFAULT_ADMIN_USERS[2],
    nextRole: 'co_founder',
    nextIsActive: false,
  });
  assert.equal(nonFounderTry.allowed, false);
});

test('external journalist can edit ONLY their own linked public bio and gets zero admin permissions', () => {
  const linkedJournalist = { ...DEFAULT_JOURNALISTS[0], ownerUid: 'uid-ext-42' };

  const extPerms = resolveEffectivePermissions('ext@press.org', true, DEFAULT_ADMIN_USERS);
  assert.equal(extPerms.view_dashboard, false);
  assert.equal(extPerms.manage_site_settings, false);
  assert.equal(extPerms.manage_users, false);

  const ownEdit = canEditJournalistProfile({
    actorEmail: 'ext@press.org',
    actorUid: 'uid-ext-42',
    emailVerified: true,
    journalist: linkedJournalist,
    adminUsers: DEFAULT_ADMIN_USERS,
  });
  assert.equal(ownEdit.canEditOwnBioOnly, true);
  assert.equal(ownEdit.canEditFull, false);

  const otherEdit = canEditJournalistProfile({
    actorEmail: 'other@press.org',
    actorUid: 'uid-ext-99',
    emailVerified: true,
    journalist: linkedJournalist,
    adminUsers: DEFAULT_ADMIN_USERS,
  });
  assert.equal(otherEdit.canEditOwnBioOnly, false);
  assert.equal(otherEdit.canEditFull, false);
});

test('extractVerifiedIdentity resolves Google email from providerData in multi-account Firebase mode', () => {
  // Multi-account mode: root email is null and emailVerified is false, but google.com provider has the email
  const multiAccountGoogleUser = {
    email: null,
    emailVerified: false,
    providerData: [{ providerId: 'google.com', email: 'Badroumc@Gmail.com' }],
  };
  const resolved = extractVerifiedIdentity(multiAccountGoogleUser);
  assert.equal(resolved.email, TECH_DIRECTOR_EMAIL);
  assert.equal(resolved.emailVerified, true);
  assert.equal(
    isAuthorizedFamilyAdmin(resolved.email, resolved.emailVerified, DEFAULT_ADMIN_USERS),
    true
  );

  // Unverified password-only account must remain unverified
  const unverifiedPasswordUser = {
    email: TECH_DIRECTOR_EMAIL,
    emailVerified: false,
    providerData: [{ providerId: 'password', email: TECH_DIRECTOR_EMAIL }],
  };
  const unverified = extractVerifiedIdentity(unverifiedPasswordUser);
  assert.equal(unverified.email, TECH_DIRECTOR_EMAIL);
  assert.equal(unverified.emailVerified, false);

  // Anonymous user has no email and is unverified
  const anon = extractVerifiedIdentity({ email: null, emailVerified: false, providerData: [] });
  assert.equal(anon.email, '');
  assert.equal(anon.emailVerified, false);
});

test('validateSubmissionImageFile strictly enforces 2 Mo max and JPG/PNG/WebP whitelist', () => {
  assert.equal(validateSubmissionImageFile({ type: 'image/jpeg', size: 1_500_000 }).valid, true);
  assert.equal(validateSubmissionImageFile({ type: 'image/png', size: MAX_SUBMISSION_IMAGE_BYTES }).valid, true);
  assert.equal(validateSubmissionImageFile({ type: 'image/webp', size: 350_000 }).valid, true);

  // Oversized image (> 2 Mo)
  const tooLarge = validateSubmissionImageFile({ type: 'image/jpeg', size: MAX_SUBMISSION_IMAGE_BYTES + 1 });
  assert.equal(tooLarge.valid, false);
  assert.match(tooLarge.error || '', /2 Mo/);

  // Blocked SVG / GIF / PDF formats
  assert.equal(validateSubmissionImageFile({ type: 'image/svg+xml', size: 4000 }).valid, false);
  assert.equal(validateSubmissionImageFile({ type: 'image/gif', size: 4000 }).valid, false);
  assert.equal(validateSubmissionImageFile({ type: 'application/pdf', size: 4000 }).valid, false);

  // Empty file
  assert.equal(validateSubmissionImageFile({ type: 'image/png', size: 0 }).valid, false);
});

test('Tech Director can archive/restore articles and delete to free space, while publication stays Founder-only', () => {
  assert.equal(canUserPerform(TECH_DIRECTOR_EMAIL, true, 'delete_articles', DEFAULT_ADMIN_USERS), true);

  const archivePublished = validateArticleTransition({
    actorEmail: TECH_DIRECTOR_EMAIL,
    emailVerified: true,
    existingStatus: 'published',
    nextStatus: 'archived',
    isArticleCreator: false,
    adminUsers: DEFAULT_ADMIN_USERS,
  });
  assert.equal(archivePublished.allowed, true);

  const restoreToDraft = validateArticleTransition({
    actorEmail: TECH_DIRECTOR_EMAIL,
    emailVerified: true,
    existingStatus: 'archived',
    nextStatus: 'draft',
    isArticleCreator: false,
    adminUsers: DEFAULT_ADMIN_USERS,
  });
  assert.equal(restoreToDraft.allowed, true);

  // Still strictly forbidden from re-publishing an archived article
  const republishAttempt = validateArticleTransition({
    actorEmail: TECH_DIRECTOR_EMAIL,
    emailVerified: true,
    existingStatus: 'archived',
    nextStatus: 'published',
    isArticleCreator: false,
    adminUsers: DEFAULT_ADMIN_USERS,
  });
  assert.equal(republishAttempt.allowed, false);
});
