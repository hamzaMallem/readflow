# ReadFlow

A local-first reading app with Google sign-in and Firebase Firestore synchronization.
Use the **same Google account and the same site URL** on phone, computer, and iPad.
The existing deployment recorded in the project is https://readflow-red.vercel.app.

## Development

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

Copy `.env.example` to `.env.local` and supply the Firebase web app configuration.
The existing local configuration points to Firebase project `readflow-app-99db0`.
Never put service-account credentials in Vite environment variables.

## Synchronization

Open Settings and choose **Sign in with Google** on each device. Documents, tags,
and reading position synchronize while the app is open and online. Reading preferences
(font, theme, spacing) remain specific to each device. On iPhone/iPad, open the same
site in Safari; it can also be added to the Home Screen. Allow the Google sign-in popup.

The status distinguishes connecting, syncing, synced, offline, and errors. Offline
edits remain in IndexedDB and reconcile after reconnection or the next app launch.
Mobile operating systems may suspend a background app: reopen it and wait for
**Synced** before switching devices. Background synchronization while the app is
closed is not guaranteed.

Content uses `updatedAt`, reading progress uses `lastReadAt`; they merge independently.
Transactions recheck server data to protect against concurrent device writes. These
client timestamps assume reasonably accurate device clocks. Deletions retain small
permanent tombstones so a device coming back online cannot resurrect deleted documents.
Accounts have separate local databases. The first account claims the existing legacy
local library; signing out opens a separate guest library without deleting account data.
Guest documents created after that first migration stay in the guest library.

Firestore currently stores each complete document in one record (including paragraphs).
Very large transcripts can exceed Firestore's record size limit; the sync error is
shown and the local copy is retained. Do not clear browser storage until changes sync.

## Deploy the update

The existing production host is Vercel. Use the existing `readflow` project and its
six `VITE_FIREBASE_*` environment variables, build command `npm run build`, output
`dist`. `vercel.json` provides SPA route fallbacks and service-worker cache headers.
Keep the production hostname in Firebase Authentication's authorized domains and
keep the Google sign-in provider enabled.

Deploy `firestore.rules` to the **existing** Firebase project alongside the client
update. They restrict access to the signed-in user's documents and use tombstones
instead of hard deletes. Older open versions of the client should be reloaded after
this update, because they do not understand deletion markers.

```sh
npx firebase-tools deploy --only firestore:rules --project readflow-app-99db0
```

`firebase.json` configures Firestore rules; the website stays on Vercel.
Deployment commands require the owner's
existing service login. Local builds/tests do not deploy anything.

## Acceptance check on real devices

1. Open the same production URL on two devices and sign in with the same Google account.
2. Create a disposable document on one; wait for Synced and verify it on the other.
3. Read several paragraphs, return to the library, wait for Synced, then open it on
   the other device and check the saved position.
4. Disconnect one device, change reading position, reconnect, and verify convergence.
5. Delete the disposable document while offline, reconnect, then reload both devices;
   it should stay deleted.
6. Sign out and sign in to a different account: the previous library must not appear.

Automated tests cover conflict resolution and mocked sync integration (merge,
progress, offline/reconnect, tombstones, errors/retry, stale sessions, and field order).
They do not replace a real Google login, deployed security-rule checks, or iOS testing.
