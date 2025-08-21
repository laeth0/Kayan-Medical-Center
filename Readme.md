# Kayan Medical Center

A full-stack healthcare web app where **patients** book appointments, **doctors** manage working hours and conduct visits, and **finance** reviews completed visits and totals. The repo is a simple mono-repo with a React front-end and a Node/Express/MongoDB back-end.

---

## ✨ Features

- **Patient**
  - Register/login and book appointments with doctors
  - View upcoming/past appointments and visits
  - Edit own profile
- **Doctor**
  - Define weekly working hours (per weekday windows)
  - View daily/period schedules and appointment details
  - Start/complete visits, add clinical notes and treatments
- **Finance**
  - Search completed visits by doctor/patient/date
  - See calculated totals (from treatments)

> Data integrity rules implemented include “one active visit per doctor” and automatic line-item totals (quantity × unit price).  

---

## 🗂 Repository layout

<pre>
  Kayan-Medical-Center/
├─ Front/ # React (Vite) app: MUI, React Router, Axios
├─ Back/ # Node.js + Express + MongoDB (Mongoose)
├─ DbDiagrame.txt # DB outline
└─ Technical Task.pdf # Original technical brief
</pre>


The repo root shows `Front/`, `Back/`, `DbDiagrame.txt`, and `Technical Task.pdf`.

---

## 🧱 Tech stack

- **Frontend:** React 18, React Router v6, Material UI, Axios, React-Toastify  
- **Backend:** Node.js, Express, Mongoose (MongoDB Atlas or local)  
- **Auth:** JWT access tokens + refresh tokens (HttpOnly cookie), role-based access control  
- **Validation:** Joi schemas via a reusable `validate(source, schema)` middleware

You’ll find the front-end under `Front/` and back-end under `Back/`. :contentReference[oaicite:2]{index=2}

---

## 👤 Roles & permissions

- **patient** – can book/cancel, browse own appointments/visits, update own profile  
- **doctor** – can manage working hours, view schedules, start/complete visits, add treatments, see past visits & details  
- **finance** – can search completed visits and review totals  
- **admin** – management endpoints (e.g., create users)

All protected endpoints are guarded by `authenticate` (JWT) → `authorize("role")` → handler.

---

## 🧾 Data model (high level)

- **User** (core user fields; doctor fields: `specialty`, `license_no`, `slot_minutes`)  
- **Role** (`user_id` + `role` unique; values: `patient`, `doctor`, `finance`, `admin`)  
- **DoctorWorkingHour** (per weekday `start_time`–`end_time` windows)  
- **Appointment** (`patient_id`, `doctor_id`, `start_time`, `end_time`, `status`, `VisitType`, `reason`, `notes`)  
- **Visit** (links to `appointment_id`; `start_time`, `end_time`, `status`, `clinical_notes`)  
- **Treatment** (per visit line items; pre-save hook computes `total_price`)  
- **Invoice** (one per visit; `total_amount`, optional review metadata)  
- **RefreshToken** (server-side refresh token persistence)

---

## 🔐 Authentication flow

- **Access Token** (short-lived) returned on login/register; stored in memory/`localStorage` (if “remember me”).  
- **Refresh Token** (long-lived) set as **HttpOnly** cookie; `/refresh-token` rotates a new access token; `/logout` clears the cookie session.  
- Front-end route protection uses `<AccessControl roles={[...]} />` and a role-based landing path priority.

## 🔗 Important endpoints (high-level)

### Auth
- `POST /login`
- `POST /register`
- `POST /refresh-token`
- `POST /logout`

### Patient
- `POST /appointments` — book
- `GET /appointments/patient` — list upcoming/past; filters + pagination
- `POST /appointments/cancel/:id`
- `PUT /profile` — update own profile

### Doctor
- `GET /doctor/working-hours`
- `POST /doctor/working-hours`
- `DELETE /doctor/working-hours`
- `GET /doctor/appointments` — by date range
- `GET /doctor/appointments/:id` — details
- `POST /visits/start`
- `POST /visits/:appointmentId/complete`
- `GET /visits/doctor` — past visits
- `GET /visits/doctor/:id` — visit details

### Finance
- `GET /finance/visits` — filters: doctor, patient, date range; paginated

> All protected routes use `authenticate` + `authorize("<role>")` and are validated with `validate()` (Joi).

---

## 🛠 Development notes

- **Validation** — centralized in `middlewares/validate.js` with source-aware sanitization (`body`, `query`, `params`).

- **Scheduling (booking)** enforces:
  - time falls within a doctor’s working windows for the given weekday,
  - slot alignment to the doctor’s `slot_minutes`,
  - no overlapping appointments in the same interval.

- **Visits** — only one active visit per doctor; completing a visit:
  - writes treatments (with computed `total_price`),
  - updates appointment status,
  - upserts one invoice per visit.

---


## 📄 Project docs

The repository also includes a simple DB diagram text file and the original technical brief (`Technical Task.pdf`) in the root.

