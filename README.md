# Personal Finance Application (Kenfinly)

> **Understand your finances.**

Kenfinly is a personal finance application designed to help individuals **understand, track, and improve their financial health**.  
Our mission is to empower users with insights that make money management simple, transparent, and meaningful.

---

## 🚀 Planned Features

- 💰 Expense and income tracking with multi-account and multi-currency support 
- 📊 Advanced budget planning and detailed analytics dashboards  
- 🎯 Goal-oriented savings plans with progress tracking  
- 🔔 Smart notifications and personalized spending insights  
- ☁️ Secure cloud synchronization for data backup and multi-device access (planned for future release)

---

## 🧭 Vision

At Kenfinly, we believe financial clarity is the foundation of personal freedom.  
Our mission is to turn complex financial data into clear, actionable insights — helping users make smarter financial decisions every day.

---

## 🛠️ Technology Stack

- **Frontend:** React with TypeScript (currently implemented), potential exploration of Flutter or Next.js for cross-platform or server-side rendering  
- **Backend:** Laravel 12 (PHP REST API) currently powering the core backend, with Python scripts supporting data visualization. Future considerations include Node.js or FastAPI for microservices.  
- **Database:** MySQL or PostgreSQL, selected based on deployment needs and scalability  
- **CI/CD:** GitHub Actions for streamlined automated testing and deploy pipelines

> _Note: The technology stack will be finalized once the full architecture and project requirements are confirmed._

---

## 📦 Getting Started

```bash
# Clone the repository
git clone https://github.com/<your-org>/kenfinly.git

# Navigate to the project folder
cd kenfinly

# Install dependencies (example for Node.js)
npm install

# Run the app
npm start
```

## Prerequisites
Before proceeding, ensure your environment meets the following requirements:

### Software & Tools

| Component             | Supported Versions / Recommendations                                |
|-----------------------|---------------------------------------------------------------------|
| PHP                   | 8.1+                                                                |
| Composer              | Latest stable release                                                |
| Node.js & npm         | Node.js 16+ and npm (or yarn) latest stable                         |
| MySQL or PostgreSQL   | MySQL 8+ or PostgreSQL 13+                                           |
| Python                | 3.9+ with pip                                                        |
| Python Libraries      | seaborn, matplotlib, pandas (install via pip)                       |
| Git                   | For source control and cloning repository                           |
| Laravel 12            | Backend framework (via Composer)                                    |
| React with TypeScript  | Frontend framework                                                  |

### Environment

- Linux, macOS, or Windows (Windows users recommended WSL2 or similar Linux environment for best compatibility)
- Recommended 8GB+ RAM and stable internet connection for package installations

---

## Backend Setup (Laravel API)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd personal-finance-app-backend
```

### 2. Install Dependencies

```bash
composer install
```

### 3. Environment Configuration

Rename `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` according to your environment. Key settings include:

- Database credentials

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=personal_finance_db
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
```

- JWT secret key (generate if missing)

```bash
php artisan jwt:secret
```

This generates your `JWT_SECRET` in `.env` needed for token authentication.

- Mail settings (optional, for password reset emails)

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="no-reply@yourdomain.com"
MAIL_FROM_NAME="${APP_NAME}"
```

### 4. Database Setup & Migration

Create the database manually or via CLI. Then run migrations and seeders:

```bash
php artisan migrate --seed
```

This sets up all tables including users, accounts, transactions, participants, invitations, budgets, and others.

### 5. Running the Development Server

```bash
php artisan serve
```

By default, the API will be available at `http://localhost:8000`.

### 6. CSV Import & Data Handling

The backend provides a CSV import endpoint that accepts well-structured transaction files; you can test uploads once the frontend or API client is connected.

### 7. API Authentication

The backend uses JWT authentication for stateless session management:

- Register: `/api/auth/register`
- Login: `/api/auth/login`
- Password Reset (optional): via Email endpoint `/api/auth/password/reset`

Protected routes require a valid Bearer JWT token.

---

## Frontend Setup (React + TypeScript)

### 1. Navigate to Frontend Directory

```bash
cd ../personal-finance-app-frontend
```

### 2. Install Dependencies

```bash
npm install
# or yarn install
```

### 3. Environment Variables

Create `.env.local` in the frontend folder with API URL and other configs:

```env
REACT_APP_API_BASE_URL=http://localhost:8000/api
```

### 4. Running the Development Server

```bash
npm start
# or yarn start
```

Visit `http://localhost:3000` in your browser.

The frontend offers:

- Transaction entry and list management
- CSV bulk upload UI
- Dynamic dashboards showing financial charts
- User authentication UI (login/register)
- Participant invitation & role management interface

JWT tokens are securely stored via HttpOnly cookies or secure storage options by default.

---

## Python Visualization Setup (Seaborn)

The application visualizes financial insights via Python scripts using Seaborn and Matplotlib libraries.

### 1. Set Up Python Environment

If using virtual environments:

```bash
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
.\venv\Scripts\activate   # Windows
```

### 2. Install Dependencies

```bash
pip install seaborn matplotlib pandas
```

### 3. Running Visualization Scripts

The backend triggers these scripts either via CLI or HTTP microservice calls.

- To manually run visualization generation:

```bash
python3 generate_charts.py --input transactions.json --output charts/
```

(Note: Script and input/output paths will vary based on your integration.)

The generated charts are served by the backend as static images and integrated into the React dashboard.

---

## Authentication Configuration

The app uses JWT for security via Laravel Sanctum or tymon/jwt-auth package.

- Ensure `JWT_SECRET` is set (`php artisan jwt:secret`).
- Middleware protects all sensitive routes.
- Role-based access (Owner, Editor, Viewer) is enforced both in backend API and frontend UI.
- For production, use HTTPS to protect tokens and data transmission.

---

## Deployment Recommendations

### Production Environment

- Use robust web servers such as Nginx or Apache in combination with PHP-FPM.
- Set environment variables securely; never commit `.env` files to repos.
- Serve frontend statically via CDN or optimized hosting.
- Use a dedicated database server with backups and encryption at rest.
- Deploy Python visualization service separately if scaling charts on demand.
- Enable HTTPS using TLS certificates (Let’s Encrypt recommended).
- Secure JWT tokens using HttpOnly and Secure cookies.
- Set appropriate CORS policies to restrict API access.
- Monitor application logs and metrics for performance and security.

### Optional Enhancements

- Integrate Redis or another caching layer to boost API response.
- Add rate limiting and brute-force protection on authentication endpoints.
- Continuous Integration/Continuous Deployment (CI/CD) pipelines for streamlined updates.

---

## CSV Import Guidelines

- Ensure CSV files follow the required format (date, amount, category, account, currency, notes).
- Use UTF-8 encoding.
- The backend validates each entry, returning detailed errors on import failures.
- Large CSV files may be imported asynchronously in batches (future enhancement).

---


*Prepared by a Dieter R. with focus on clarity, completeness, and operational excellence.*  
*Date: 2025-10-28*

