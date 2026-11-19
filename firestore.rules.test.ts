import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const rulesSource = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');
const blueprint = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'firebase-blueprint.json'), 'utf8')
);

test('firestore.rules enforces global default-deny catch-all and rules_version 2', () => {
  assert.match(rulesSource, /rules_version\s*=\s*'2';/);
  assert.match(rulesSource, /match\s+\/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
});

test('every collection declared in firebase-blueprint.json has an explicit match block in firestore.rules', () => {
  const paths = Object.keys(blueprint.firestore);
  assert.ok(paths.length >= 7);
  for (const collectionPath of paths) {
    const cleanCollection = collectionPath.split('/')[1];
    assert.match(
      rulesSource,
      new RegExp(`match\\s+/${cleanCollection}/\\{`),
      `Missing match block for collection /${cleanCollection}`
    );
  }
});

test('Dirty Dozen security invariants are enforced inside firestore.rules', () => {
  // 1. Email spoofing guard: email_verified == true mandatory
  assert.match(rulesSource, /request\.auth\.token\.email_verified\s*==\s*true/);
  // 2. Protected Founder identity hardcoded to tmerzak@gmail.com
  assert.match(rulesSource, /userEmail\(\)\s*==\s*'tmerzak@gmail\.com'/);
  // 3. Non-founders restricted strictly to draft & pending_review on articles
  assert.match(rulesSource, /incoming\(\)\.status in \['draft', 'pending_review'\]/);
  // 4. Protected Founder account cannot be deleted or demoted
  assert.match(rulesSource, /existing\(\)\.isProtectedOwner == false/);
  assert.match(rulesSource, /existing\(\)\.email != 'tmerzak@gmail\.com'/);
  // 5. Immutable audit logs (no update or delete even by Founder)
  assert.match(rulesSource, /match \/auditLogs\/\{logId\}[\s\S]*allow update, delete: if false;/);
  // 6. External journalist submissions strictly check authorUid == request.auth.uid & status == 'received'
  assert.match(rulesSource, /incoming\(\)\.authorUid == request\.auth\.uid/);
  assert.match(rulesSource, /incoming\(\)\.status == 'received'/);
  // 7. Strict server timestamp validation (request.time)
  assert.match(rulesSource, /incoming\(\)\.createdAt == request\.time/);
  assert.match(rulesSource, /incoming\(\)\.updatedAt == request\.time/);
  // 8. Non-founders can never hold manage_users
  assert.match(rulesSource, /permKey != 'manage_users'/);
  assert.match(rulesSource, /incoming\(\)\.permissions\.manage_users == false/);
});
