# MiniLedger

A small app for keeping track of money you have lent to friends.
Log in with your phone number, add who owes you what and by when, attach a receipt, and mark entries as repaid.

## Tech stack

- **Backend:** Node.js, TypeScript, Express 5, PostgreSQL (`pg` with plain SQL), zod, jsonwebtoken, multer, cors
- **Mobile:** Expo (SDK 58), React Native, TypeScript, React Navigation (native stack), react-native-web, expo-secure-store, expo-image-picker, @react-native-community/datetimepicker, @expo/vector-icons (Feather), DM Sans and Instrument Serif via @expo-google-fonts
- **Tests:** Jest, supertest
- **Tooling:** ESLint and Prettier in both projects

## Prerequisites

- Node.js 20 or newer (built with 22)
- Docker (for PostgreSQL)
- A browser, or Expo Go on your phone, or an Android emulator / iOS simulator

## Running it

### 1. Start PostgreSQL

```bash
docker compose up -d
```

This starts Postgres 16 on port 5432 with two databases: `miniledger` for development and `miniledger_test` for the tests.

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

The API runs on `http://localhost:4000`.

There is no SMS provider. When you request an OTP, the backend prints it to its own terminal:

```
[otp] +919876543210 -> 482913
```

Other backend scripts: `npm run build`, `npm start` (runs the build), `npm run lint`, `npm run format`, `npm run typecheck`.

### 3. Mobile

```bash
cd mobile
cp .env.example .env
npm install
npm run web
```

`npm run web` starts Expo and opens the app in your browser at `http://localhost:8081`. Use `npx expo start` instead to run it on a phone or emulator (press `a` for Android, `i` for iOS, or scan the QR code with Expo Go).

Set `EXPO_PUBLIC_API_URL` in `mobile/.env` to the address of the backend **as seen from the device**:

| Where the app runs | Value                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| Browser (web)      | `http://localhost:4000` (the default in `.env.example`)                 |
| Physical phone     | `http://<your computer's LAN IP>:4000`, e.g. `http://192.168.1.10:4000` |
| Android emulator   | `http://10.0.2.2:4000`                                                  |
| iOS simulator      | `http://localhost:4000`                                                 |

`localhost` on a phone or the Android emulator points at the device itself, not your computer. Find your LAN IP with `ipconfig` (Windows) or `ipconfig getifaddr en0` (macOS). Your phone and computer must be on the same Wi-Fi network, and the firewall must allow port 4000.

Restart Expo after changing `.env`, because it inlines `EXPO_PUBLIC_*` values when it bundles. If the old value still shows up, restart with `npx expo start --clear`.

On the web the app works the same way, with a few platform differences:

- The token is kept in `localStorage` instead of the secure keychain.
- The due date uses the browser's date input.
- "Attach receipt" opens a file picker (no camera option).
- Confirmations use the browser's confirm dialog.
- The browser back button works, and the app stays in a phone-width column on large screens.

The backend allows cross-origin requests so the browser can call it.

## Tests

With the Postgres container running:

```bash
cd backend
npm test
```

The tests use `TEST_DATABASE_URL`, apply migrations to it automatically, and truncate the tables before each test. They cover the OTP flow (wrong, expired, reused and rate-limited codes), loan creation and validation, receipts, repaying (including 409 and 404 for another user's loan), and the summary maths.

## API

All `/loans` routes need an `Authorization: Bearer <token>` header. Errors always look like `{ "error": { "message": "...", "details": ... } }`.

| Method | Path                | Description                                                                               |
| ------ | ------------------- | ----------------------------------------------------------------------------------------- |
| POST   | `/auth/request-otp` | `{ phone }`. Sends (logs) a 6-digit code. One request per number every 30 seconds.        |
| POST   | `/auth/verify-otp`  | `{ phone, code }`. Returns `{ token, user }` and creates the user on first login.         |
| GET    | `/loans`            | The user's loans, newest first, each with a computed `status`.                            |
| POST   | `/loans`            | `{ friendName, amount, dueDate }` as JSON, or multipart with an optional `receipt` image. |
| PATCH  | `/loans/:id/repay`  | Marks a loan as repaid. 404 if it is not yours, 409 if it is already repaid.              |
| GET    | `/loans/summary`    | Totals lent, repaid, overdue and outstanding, plus counts per status.                     |
| GET    | `/uploads/:file`    | Serves an uploaded receipt.                                                               |

## Project structure

```
backend/
  migrations/           SQL files, applied in order by npm run migrate
  src/
    app.ts              Express app: middleware, routes, error handler
    server.ts           Starts the HTTP server
    config.ts           Reads environment variables
    db.ts               Postgres pool and type parsers
    migrate.ts          Migration runner
    errors.ts           HttpError and the central error handler
    auth/               Phone validation, OTP logic, JWT helpers, auth routes
    loans/              Validation schema, SQL queries, loan routes
    middleware/         requireAuth and the receipt upload (multer)
  tests/                Jest + supertest tests
mobile/
  App.tsx               Providers and navigation container
  src/
    api/                fetch wrapper and typed endpoint functions
    auth/               AuthContext and storage (SecureStore on native, localStorage on web)
    navigation/         Stack navigator, switches on login state
    screens/            Login, Home, AddEntry
    components/         Button, TextField, OtpInput, DueDateField (+ .web.tsx), SummaryCard, LoanCard, ReceiptViewer
    theme.ts            Colours, fonts, spacing, font sizes
    format.ts           Rupee and date formatting
    validation.ts       Client-side form rules, same as the backend's
    dialogs.ts          Confirm and message dialogs (Alert on native, window.confirm on web)
docker-compose.yml      PostgreSQL only
```

## Notes on decisions

- **Amounts are stored in paise.** The `loans.amount_paise` column is a `bigint`, so there is no floating point rounding in the database. The API accepts and returns rupees (for example `1500.5`) and converts at the edge. Amounts must be positive, have at most 2 decimal places, and be no more than 1 crore.
- **Overdue is calculated, not stored.** A loan is `repaid` if `repaid_at` is set, `overdue` if it is not repaid and `due_date` is before today, and `pending` otherwise. A loan due today is still pending. Postgres works out "today" in the `Asia/Kolkata` time zone (set on the connection), so the answer does not depend on where the server runs. The list and the summary use the same rule.
- **Receipts are stored on local disk** in `backend/uploads` (gitignored) under a random UUID filename. Only JPG, PNG and WEBP up to 5MB are accepted. They are served as static files, so anyone with the URL can see one. That is fine for a demo; a real app would use object storage with signed URLs.
- **OTPs are hashed** (HMAC-SHA256 with the server secret) and never stored in plain text. A code expires after 5 minutes, allows 5 wrong attempts, and can only be used once. Only the latest code for a number is valid.
- **Every loan query filters on `user_id`** from the JWT, so one user can never read or change another user's loans. Asking to repay someone else's loan returns 404 rather than 403, so loan IDs do not leak.
- **State on mobile is kept simple:** a React Context for auth, and each screen loads its own data. The home screen reloads whenever it comes into focus, which is how it refreshes after adding an entry.
