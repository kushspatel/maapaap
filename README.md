# માપાપ - maapaap

**An offline-first mobile app (starting with web) that helps families in India save accurate body & garment measurements and share tailor-ready specs instantly.**

Gujarati-first • Privacy-friendly • WhatsApp-ready

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Database](#database)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

---

## 🎯 Overview

**maapaap** helps Indian families (especially Gujarati-speaking moms and sisters) store and share clothing measurements with tailors. No more carrying notebooks or forgetting measurements at the boutique!

### Key Benefits

- ✅ Store measurements once, use forever
- ✅ Garment-first measurement flows (Choli, Chaniya, Kurti, Salwar, etc.)
- ✅ Gujarati-first terminology with English support
- ✅ Share on WhatsApp instantly
- ✅ Offline-first and privacy-friendly
- ✅ No forced login or ads

---

## ✨ Features

### MVP (Phase 1)

- [x] **Authentication** - Email OTP login
- [x] **Profiles** - Manage family member profiles (Mom, Sister, Daughter, etc.)
- [x] **Garment Templates** - Pre-configured measurement sets for:
  - Choli/Blouse (ચોળી)
  - Chaniya/Ghagra (ઘાઘરો)
  - Kurti/Kameez (કુર્તી)
  - Salwar (સલવાર)
  - Churidar (ચૂડીદાર)
  - Pants/Palazzo (પેન્ટ)
  - Dress/Gown (ડ્રેસ)
  - Kids clothes (બાળકોનાં કપડાં)
- [x] **Smart Measurement Entry** - With validation and helpful tips
- [x] **Bilingual UI** - Gujarati (default) + English
- [x] **Unit Support** - Inches and Centimeters
- [x] **WhatsApp Sharing** - One-tap share to tailors
- [x] **Copy to Clipboard** - Easy copy-paste

### Coming Soon (Phase 2)

- [ ] PDF export
- [ ] Share links (view-only)
- [ ] React Native mobile app
- [ ] Offline-first sync
- [ ] Hindi language support
- [ ] Visual measurement guides with diagrams

---

## 🛠 Tech Stack

### Frontend (Web)

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (state management)
- **next-intl** (i18n)

### Backend (API)

- **Node.js** with **Express**
- **TypeScript**
- **PostgreSQL** (database)
- **Redis** (sessions & caching)
- **JWT** (authentication)

### Shared

- **Monorepo** structure (workspaces)
- **Shared TypeScript types** across web and API

### DevOps

- **Docker** & **Docker Compose**
- **GitHub Actions** (CI/CD - planned)

---

## 📁 Project Structure

```
maapaap/
├── apps/
│   ├── web/              # Next.js web application
│   │   ├── src/
│   │   │   ├── app/      # App router pages
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   └── stores/
│   │   └── package.json
│   │
│   └── api/              # Node.js backend API
│       ├── src/
│       │   ├── routes/
│       │   ├── controllers/
│       │   ├── services/
│       │   ├── middleware/
│       │   └── config/
│       └── package.json
│
├── packages/
│   ├── shared/           # Shared TypeScript types & utilities
│   │   └── src/
│   │       ├── types.ts
│   │       ├── measurement-templates.ts
│   │       └── utils.ts
│   │
│   └── database/         # Database migrations & seeds
│       ├── migrations/
│       └── scripts/
│
├── docker-compose.yml    # Local development services
├── package.json          # Root workspace configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20+ (use `.nvmrc` file)
- **Docker** & **Docker Compose**
- **npm** or **pnpm**

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/maapaap.git
cd maapaap
```

2. **Install dependencies**

```bash
npm install
```

3. **Start Docker services** (PostgreSQL + Redis)

```bash
npm run docker:up
```

4. **Run database migrations**

```bash
npm run db:migrate
```

5. **Start development servers**

```bash
# Start both web and API
npm run dev

# Or start individually
npm run dev:web   # Web: http://localhost:3000
npm run dev:api   # API: http://localhost:3001
```

6. **Open the app**

- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:3001](http://localhost:3001)
- API Health: [http://localhost:3001/health](http://localhost:3001/health)

---

## 💻 Development

### Environment Variables

#### API (`apps/api/.env`)

```env
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://maapaap:maapaap_dev_password@localhost:5432/maapaap
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:3000
OTP_EXPIRY_MINUTES=10
```

#### Web (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Building for Production

```bash
# Build all packages
npm run build

# Build individually
npm run build:shared
npm run build:web
npm run build:api
```

### Running in Production Mode

```bash
# API
cd apps/api
npm start

# Web
cd apps/web
npm start
```

---

## 🗄️ Database

### Schema

The database includes the following tables:

- **users** - User accounts
- **profiles** - Family member profiles
- **measurement_sets** - Collections of measurements for specific garments
- **measurement_entries** - Individual measurement values
- **otps** - One-time passwords for authentication
- **sessions** - Active user sessions

### Migrations

```bash
# Run migrations
npm run db:migrate

# Seed sample data (development only)
npm run db:seed
```

### Direct Database Access

```bash
# Connect to PostgreSQL
docker exec -it maapaap-postgres psql -U maapaap -d maapaap

# View tables
\dt

# Query examples
SELECT * FROM profiles;
SELECT * FROM measurement_sets;
```

---

## 📡 API Documentation

### Base URL

```
http://localhost:3001/api/v1
```

### Authentication

All protected routes require a JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

### Endpoints

#### **Auth**

| Method | Endpoint           | Description       | Auth Required |
|--------|--------------------|-------------------|---------------|
| POST   | `/auth/send-otp`   | Send OTP to email | No            |
| POST   | `/auth/verify-otp` | Verify OTP & login| No            |
| GET    | `/auth/me`         | Get current user  | Yes           |
| POST   | `/auth/logout`     | Logout            | Yes           |

#### **Profiles**

| Method | Endpoint                            | Description                     | Auth Required |
|--------|-------------------------------------|---------------------------------|---------------|
| GET    | `/profiles`                         | Get all profiles                | Yes           |
| POST   | `/profiles`                         | Create new profile              | Yes           |
| GET    | `/profiles/:id`                     | Get profile by ID               | Yes           |
| PUT    | `/profiles/:id`                     | Update profile                  | Yes           |
| DELETE | `/profiles/:id`                     | Delete profile                  | Yes           |
| GET    | `/profiles/:id/measurement-sets`    | Get all measurement sets        | Yes           |

#### **Measurement Sets**

| Method | Endpoint                  | Description              | Auth Required |
|--------|---------------------------|--------------------------|---------------|
| POST   | `/measurement-sets`       | Create measurement set   | Yes           |
| GET    | `/measurement-sets/:id`   | Get measurement set      | Yes           |
| PUT    | `/measurement-sets/:id`   | Update measurement set   | Yes           |
| DELETE | `/measurement-sets/:id`   | Delete measurement set   | Yes           |

### Example Requests

#### Send OTP

```bash
curl -X POST http://localhost:3001/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user@example.com",
    "type": "email"
  }'
```

#### Create Profile

```bash
curl -X POST http://localhost:3001/api/v1/profiles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "માધવી",
    "nickname": "Mom",
    "age": 45
  }'
```

#### Create Measurement Set

```bash
curl -X POST http://localhost:3001/api/v1/measurement-sets \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "<profile-id>",
    "garment_type": "BLOUSE_CHOLI",
    "title": "Navratri Choli 2026",
    "unit_default": "IN",
    "fit_preference": "REGULAR",
    "measurements": [
      {"key": "bust_round", "value": 36, "unit": "IN"},
      {"key": "waist_round", "value": 28, "unit": "IN"}
    ]
  }'
```

---

## 🚢 Deployment

### Docker Deployment

1. Build production images:

```bash
docker build -t maapaap-api ./apps/api
docker build -t maapaap-web ./apps/web
```

2. Run with docker-compose:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Setup

- Set strong `JWT_SECRET`
- Configure proper SMTP for OTP emails
- Set up SSL/TLS certificates
- Configure CORS for production domain

---

## 🗺️ Roadmap

### ✅ Phase 1 (MVP - Infrastructure Complete)

- [x] Core infrastructure (monorepo, database, API)
- [x] Authentication (Email OTP)
- [x] Profile management
- [x] Measurement templates for 8 garment types
- [x] Basic web UI
- [x] RESTful API endpoints

### 🚧 Phase 2 (Next Steps)

- [ ] Complete web UI with all flows
- [ ] Visual measurement guides
- [ ] PDF export
- [ ] Share links (view-only)
- [ ] Enhanced validation
- [ ] WhatsApp integration

### 📅 Phase 3 (Future)

- [ ] React Native mobile app (Expo)
- [ ] Offline-first sync
- [ ] Camera-based measurements (AR)
- [ ] Hindi language support
- [ ] Tailor marketplace (optional)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Guidelines

- Use TypeScript for all new code
- Follow existing code style
- Write descriptive commit messages
- Add tests for new features
- Update documentation

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Built with ❤️ for Indian families
- Special thanks to all the moms and sisters who inspired this app
- Gujarati translation assistance from the community

---

## 📞 Support

For questions or support:

- Open an issue on GitHub
- Email: support@maapaap.com (coming soon)

---

**Made with ❤️ in India for India**

માપાપ - Your family's measurement keeper 📏
