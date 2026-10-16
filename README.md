# مشوار الجامعة · Mishwar UJ

Student ride-sharing app for the **University of Jordan (Amman)**. Students book seats with assigned captains on two launch routes:

- **Dahiyat Al-Amir Rashid ⇄ University of Jordan**
- **Al-Yadoudeh (near Ahmed Al-Jilani Supermarket) ⇄ University of Jordan**

Built with **Expo (React Native)** + **Firebase** (Auth + Firestore, real-time) + **Google Maps**. Arabic is the default language (full RTL), English is one tap away.

## Features

| Role | What they can do |
|---|---|
| **Student** | Browse captains and upcoming trips by area & direction · open a captain's profile and see each trip's seats (🟢 available / 🔴 booked / 🔵 yours) · pick a specific seat and confirm the departure time · cancel (up to 30 min before) · join the **waitlist** when a car is full and see **alternative cars** near the same time · **schedule a ride request** at a specific time · set the exact home pickup point on **Google Maps** |
| **Captain** | See upcoming trips with passenger names, phones and pickup pins (opens Google Maps) · create trips · accept scheduled requests (new trip or add to an existing one) · remove riders · complete/cancel trips · see earnings and platform fees owed |
| **Admin** | Full access · **manually enter driver and car details** (name, phone, email, licence, photo, make, model, year, colour, plate, seat count, areas) · create trips for any captain · manage all trips · view users and change roles · revenue dashboard per captain |

### Pricing (`src/constants/config.js`)

| Riders in car | Fare per rider (to captain) | Captain earns | Platform fee | Student pays |
|---|---|---|---|---|
| 1–2 | 3 JD | 3–6 JD | 0.25 JD/student | 3.25 JD |
| 3–4 | 2 JD | 6–8 JD | 0.25 JD/student | 2.25 JD |

All fares go to the captain. The platform earns **0.25 JD per student per trip**, shown to students as a service fee. Captains collect cash; the app tracks the fees each captain owes the platform.

> Assumptions to confirm: 1 rider pays the 2-rider fare and 3 riders pay the 4-rider fare; the 0.25 JD is added on top of the fare (not deducted from the captain). Change `FARE_TIERS` / `PLATFORM_FEE_PER_RIDER` if you want otherwise.

## Setup

### 1. Firebase
1. Create a project at <https://console.firebase.google.com>.
2. **Authentication → Sign-in method →** enable **Email/Password**.
3. **Firestore Database →** create (region `europe-west` or `me-central1` is closest to Jordan).
4. **Project settings → Your apps →** add a **Web app** and copy its config values.
5. Deploy security rules and indexes:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add        # pick your project
   npm run deploy:rules
   ```

### 2. Google Maps
In Google Cloud Console (same project), enable **Maps SDK for Android** and **Maps SDK for iOS**, create an API key and restrict it to package `jo.studentrides.app`.

### 3. Run the app
```bash
cp .env.example .env      # paste the Firebase + Maps values
npm install
npx expo install --fix    # aligns native package versions with your Expo SDK
npx expo start            # scan the QR code with Expo Go
```
For a store build: `npm i -g eas-cli && eas build -p android` (the Maps key in `.env` is baked in at build time).

### 4. Make yourself admin
1. Sign up in the app with your email (you'll land as a student).
2. Firebase console → Firestore → `users` → your document → set `role` to `admin`.
3. Restart the app — you're in the admin panel.

### 5. Add the two captains
Admin → **Captains → Add captain**. Enter the driver and car details, including the **email** the captain will use. When the captain signs up with that email, their account links automatically (if they signed up first, saving the captain record links it).

### 6. Verify route pins
Open `src/constants/routes.js` and replace the approximate coordinates (marked `VERIFY`) with exact pins for the UJ gate, Dahiyat Al-Amir Rashid and Ahmed Al-Jilani Supermarket.

## Project structure
```
app/                     screens (expo-router)
  login.js, register.js
  student/               rides, captain/[id] (seat map), trip/[id], schedule, bookings, profile
  captain/               trips, new-trip, requests, trip/[id], profile
  admin/                 dashboard, captains, captain/[id] (driver & car form), trips, users
src/
  constants/             config.js (prices, fees), routes.js (areas & coordinates)
  lib/seats.js           seat booking, cancel, waitlist promotion, alternatives (pure, tested)
  lib/pricing.js         fare / fee calculations (pure, tested)
  lib/api.js             all Firestore reads/writes (transactions prevent double booking)
  components/            SeatMap, BookingPanel, LocationPicker, TripManage, …
  i18n/                  ar.json (default), en.json
firestore.rules          role-based security
tests/                   npm test
```

## Data model (Firestore)
- `users/{uid}` – name, phone, email, role, captainId, home `{latitude, longitude, address, areaId}`
- `captains/{id}` – driver details, `car {make, model, year, color, plate}`, seatCount, areaIds, uid (linked account)
- `trips/{id}` – captainId, areaId, direction (`toUni`/`fromUni`), departureAt, `seats {"1": rider|null, …}`, riderUids, waitlist, status
- `bookings/{tripId}_{uid}` – one per student per trip, with status history
- `rideRequests/{id}` – scheduled requests: area, direction, desiredAt, status

## How the waitlist works
When a car is full the student can join its waitlist (and is shown other open cars on the same route within ±45 minutes). If a booked student cancels, the freed seat goes to the first person on the waitlist in the same transaction, and their booking appears in **My rides** marked "booked from waitlist".

## Tests
```bash
npm test   # pricing, seat booking, waitlist promotion, cancel cutoff, alternatives
```

## Known limits / next steps
- Seat-level rules are enforced in app transactions; Firestore rules restrict students to changing only their own entry but can't validate every seat field. For a public launch, move booking into a Cloud Function.
- No push notifications yet (e.g. "you got a seat from the waitlist") — add Expo Notifications + a Cloud Function trigger.
- Payments are cash; online payment can be added later.
