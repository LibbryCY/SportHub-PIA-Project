# SportSphere Hub - Setup Guide

## Stack

- **Frontend**: Angular 20 (Standalone Components)
- **Backend**: Node.js + Express
- **Database**: MongoDB

---

## 1. Backend Setup

```bash
cd backend
npm install
```

Edit `.env` file with your settings (MongoDB URI, etc.)

```bash
# Seed the database with test data
node seed.js

# Start development server
npm run dev
```

Backend runs on: http://localhost:3000

**Test accounts:**
| Role | Username | Password |
|------|----------|----------|
| Admin | admin | Admin123! |
| Employee | zaposleni1 | Zaposleni1! |
| Athlete | sportista1 | Sportista1! |
| Athlete | sportista2 | Sportista1! |

---

## 2. Frontend Setup

```bash
# Create Angular project (run once)
ng new frontend --routing=true --style=css --standalone=false --skip-git --skip-tests
cd frontend

# Install extra packages
npm install leaflet @types/leaflet chart.js ng2-charts jspdf
```

Copy these files to your Angular project:

- `app-routing.module.ts` → `src/app/app-routing.module.ts`
- `auth.service.ts` → `src/app/services/auth.service.ts`
- `guards-and-interceptor.ts` → split into `src/app/guards/` folder
- `styles.css` → `src/styles.css`

Set API URL in `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: "http://localhost:3000/api",
};
```

```bash
ng serve
```

Frontend runs on: http://localhost:4200

---

## 3. Project Structure (what to build)

### Backend (DONE ✅)

- `server.js` - entry point
- `middleware/auth.js` - JWT + role check
- `models/User.js` - user schema
- `models/Facility.js` - facility + courts
- `models/Reservation.js` - reservations
- `models/index.js` - Sport, Equipment, Order, Ad, Trainer, Training, Promotion, Comment
- `routes/auth.js` - login, register, forgot/reset password
- `routes/users.js` - profile, admin user management
- `routes/facilities.js` - CRUD, search, like/comment
- `routes/reservations.js` - create, cancel, confirm, drag-drop
- `routes/sports.js` - sport list + admin CRUD
- `routes/promotions.js` - promotions
- `routes/ads.js` - saaigrači ads
- `routes/trainers.js` - trainers + training sessions
- `routes/equipment.js` - equipment catalog + orders
- `routes/reports.js` - PDF reports

### Frontend (TO BUILD - page by page):

**Public pages:**

- [ ] Home (stats + top3 + promotions + search)
- [ ] Login / Register / Forgot password
- [ ] Facility list + detail with calendar

**Athlete pages:**

- [ ] Profile + reservations table
- [ ] Search + reservation form + calendar
- [ ] Saaigrači ads
- [ ] Trainers + training booking
- [ ] Equipment shop
- [ ] Statistics charts

**Employee pages:**

- [ ] Profile + facility list
- [ ] Add/edit facility (+ JSON import)
- [ ] Reservations table + confirm/no-show
- [ ] Drag-drop calendar
- [ ] Promotions + equipment management
- [ ] PDF reports

**Admin pages:**

- [ ] User management + approve/reject
- [ ] Facility approval
- [ ] Sports management
- [ ] Trainer management

---

## 4. Key Notes

- **Minimum requirements** (from pia_2526_junjul_min.pdf): See first PDF - items marked "да" are mandatory
- **Password format**: 8-12 chars, starts with letter, 1 uppercase, 1 number, 1 special char
- **Cancel reservation**: Only if > 12h before start
- **Confirm/no-show**: Only within 10 min of start time
- **Reactions**: Only if user has confirmed reservation; count ≤ confirmed reservations
- **Calendar**: Weekly view, 1h min slots, starts on the hour
- **Admin login route**: `/admin-login` (hidden from main nav)
