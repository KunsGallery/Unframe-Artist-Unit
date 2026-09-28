const { readFile } = require("node:fs/promises");
const { after, before, beforeEach, test } = require("node:test");
const assert = require("node:assert/strict");
const { initializeTestEnvironment, assertFails, assertSucceeds } = require("@firebase/rules-unit-testing");
const { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } = require("firebase/firestore");

let testEnv;
const projectId = "demo-uau-rules-tests";

before(async () => {
  const rules = await readFile("firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: { host: "127.0.0.1", port: 8080, rules },
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore();
    await setDoc(doc(firestore, "admins", "editor"), { role: "editor", active: true });
    await setDoc(doc(firestore, "admins", "reviewer"), { role: "moderator", active: true });
    await setDoc(doc(firestore, "admins", "super"), { role: "super_admin", active: true });
    await setDoc(doc(firestore, "users", "owner"), {
      email: "owner@example.com",
      displayName: "Owner",
      accountType: "artist",
      accessStatus: "open",
      verificationStatus: "approved",
      foundingNumber: 1,
    });
    await setDoc(doc(firestore, "users", "approved-professional"), {
      email: "curator@example.com",
      displayName: "Curator",
      accountType: "curator",
      accessStatus: "approved",
    });
    await setDoc(doc(firestore, "users", "pending-professional"), {
      email: "pending@example.com",
      displayName: "Pending",
      accountType: "gallery",
      accessStatus: "pending",
    });
    await setDoc(doc(firestore, "exhibitions", "owned-exhibition"), {
      ownerUid: "owner",
      galleryId: "space",
      title: "Draft",
      published: false,
    });
    await setDoc(doc(firestore, "public_profiles", "owner-profile"), { ownerUid: "owner", published: true });
  });
});

after(async () => {
  await testEnv?.cleanup();
});

test("users can create and edit ordinary profile fields but cannot self-approve", async () => {
  const owner = testEnv.authenticatedContext("owner", { email: "owner@example.com" }).firestore();
  const newUser = testEnv.authenticatedContext("new-user", { email: "new@example.com" }).firestore();
  await assertSucceeds(setDoc(doc(newUser, "users", "new-user"), {
    email: "new@example.com",
    displayName: "New",
    accountType: "artist",
    accessStatus: "open",
    createdAt: new Date(),
  }));
  await assertSucceeds(updateDoc(doc(owner, "users", "owner"), { displayName: "Updated" }));
  await assertFails(updateDoc(doc(owner, "users", "owner"), { verificationStatus: "rejected" }));
  await assertFails(updateDoc(doc(owner, "users", "owner"), { foundingNumber: 2 }));
  await assertFails(updateDoc(doc(owner, "users", "owner"), { accessStatus: "approved" }));
});

test("only a super admin can change the administrator registry", async () => {
  const editor = testEnv.authenticatedContext("editor").firestore();
  const superAdmin = testEnv.authenticatedContext("super").firestore();
  await assertFails(setDoc(doc(editor, "admins", "new-admin"), { role: "super_admin", active: true }));
  await assertSucceeds(setDoc(doc(superAdmin, "admins", "new-admin"), { role: "editor", active: true }));
});

test("exhibition ownership cannot be transferred by its owner", async () => {
  const owner = testEnv.authenticatedContext("owner", { email: "owner@example.com" }).firestore();
  const stranger = testEnv.authenticatedContext("stranger", { email: "stranger@example.com" }).firestore();
  await assertFails(updateDoc(doc(owner, "exhibitions", "owned-exhibition"), { ownerUid: "stranger" }));
  await assertFails(updateDoc(doc(stranger, "exhibitions", "owned-exhibition"), { title: "Stolen" }));
  await assertSucceeds(updateDoc(doc(owner, "exhibitions", "owned-exhibition"), { title: "Updated draft" }));
});

test("approved professional accounts can create briefs; pending accounts cannot", async () => {
  const approved = testEnv.authenticatedContext("approved-professional", { email: "curator@example.com" }).firestore();
  const pending = testEnv.authenticatedContext("pending-professional", { email: "pending@example.com" }).firestore();
  await assertSucceeds(setDoc(doc(approved, "curatorial_briefs", "brief-1"), { ownerUid: "approved-professional", title: "Open brief" }));
  await assertFails(setDoc(doc(pending, "curatorial_briefs", "brief-2"), { ownerUid: "pending-professional", title: "Not approved" }));
});

test("published profiles are public while private profiles remain owner-only", async () => {
  const stranger = testEnv.authenticatedContext("stranger").firestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), "public_profiles", "public-artist"), { ownerUid: "owner", published: true });
    await setDoc(doc(context.firestore(), "public_profiles", "private-artist"), { ownerUid: "owner", published: false });
  });
  await assertSucceeds(getDoc(doc(stranger, "public_profiles", "public-artist")));
  await assertFails(getDoc(doc(stranger, "public_profiles", "private-artist")));
});

test("invitation viewing rooms are readable by link but not listable, and only the artist can manage them", async () => {
  const owner = testEnv.authenticatedContext("owner", { email: "owner@example.com" }).firestore();
  const stranger = testEnv.authenticatedContext("stranger").firestore();
  const guest = testEnv.unauthenticatedContext().firestore();
  const roomRef = doc(owner, "private_viewing_rooms", "high-entropy-invitation-token");
  const room = {
    ownerUid: "owner",
    artistSlug: "owner-profile",
    artistName: "Owner",
    title: "Unpublished studies",
    intro: "For invited viewers",
    works: [{ id: "work-1", title: "Study", year: "2026", medium: "Oil", dimensions: "40 × 40 cm", imageUrl: "https://media.example/preview.jpg" }],
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await assertSucceeds(setDoc(roomRef, room));
  await assertSucceeds(getDoc(doc(guest, "private_viewing_rooms", "high-entropy-invitation-token")));
  await assertFails(getDocs(query(collection(stranger, "private_viewing_rooms"), where("ownerUid", "==", "owner"))));
  await assertFails(updateDoc(doc(stranger, "private_viewing_rooms", "high-entropy-invitation-token"), { title: "Changed" }));
  await assertSucceeds(updateDoc(roomRef, { active: false }));
  await assertFails(getDoc(doc(guest, "private_viewing_rooms", "high-entropy-invitation-token")));
});
