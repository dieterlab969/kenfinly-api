# Saving Habit Tracker - Architecture Overview

## System Architecture

The Saving Habit Tracker is built using a modern client-server architecture with Laravel 12 providing the backend API and React handling the frontend user interface. The system follows RESTful API principles with JWT authentication for security.

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │         │                 │
│  React Frontend │ ◄─────► │  Laravel API    │ ◄─────► │  MySQL Database │
│                 │   HTTP  │                 │   SQL   │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘


```

## Backend Architecture (Laravel 12)

### Core Components

1. **API Controllers**  
   - `AuthController`: Handles user authentication (login, register, logout)  
   - `HabitController`: Manages habit CRUD operations and statistics  
   - `HabitTrackingController`: Manages tracking habit completion  
   - `AchievementController`: Provides achievement data
2. **Models**  
   - `User`: Represents system users with JWT authentication  
   - `Habit`: Represents saving habits created by users  
   - `HabitTracking`: Records daily habit completion status  
   - `Achievement`: Stores user achievements
3. **Services**  
   - `AchievementService`: Business logic for achievement calculations and awarding
4. **Middleware**  
   - `auth:api`: JWT authentication middleware  
   - Custom authorization policies for resource access
5. **Database**  
   - MySQL for persistent storage  
   - Migrations for database schema management

### Data Flow (Backend)

1. Client sends authenticated request to API endpoint
2. JWT middleware validates authentication token
3. Request is routed to appropriate controller
4. Controller applies business logic, often using services
5. Controller interacts with models for data access
6. Response is formatted and returned to client

## Frontend Architecture (React)

### Core Components

1. **Authentication**  
   - `LoginPage`  
   - `RegisterPage`  
   - `AuthContext`: Manages authentication state
2. **Habit Management**  
   - `SavingHabitTracker`: Main dashboard component  
   - `HabitForm`: Component for creating/editing habits  
   - `HabitList`: Displays user habits
3. **Tracking & Visualization**  
   - `TrackingCalendar`: Calendar interface for marking habits  
   - `StatsDisplay`: Shows savings and streak statistics  
   - `AchievementList`: Displays user achievements
4. **Services**  
   - `api.js`: API client with interceptors for JWT management  
   - Service modules for each API resource (habits, tracking, achievements)

### State Management

- React useState/useEffect for local component state
- Context API for global state (auth, notifications)

## API Endpoints

Method

Endpoint

Description

POST

/api/login

User login

POST

/api/register

User registration

POST

/api/logout

User logout

GET

/api/habits

Get all user habits

POST

/api/habits

Create new habit

PUT

/api/habits/{id}

Update existing habit

DELETE

/api/habits/{id}

Delete habit

POST

/api/tracking/toggle

Toggle habit completion for a day

GET

/api/tracking/{habitId}

Get tracking data for habit

GET

/api/achievements

Get user achievements

GET

/api/stats/habits/{id}

Get statistics for specific habit

GET

/api/stats/overall

Get overall saving statistics

## Data Models

### Habit

```
{
  id: number,
  name: string,
  amount: number,       // Amount saved per instance
  frequency: number,    // Target frequency per week
  color: string,        // Color code for habit
  user_id: number,
  created_at: datetime,
  updated_at: datetime
}


```

### HabitTracking

```
{
  id: number,
  habit_id: number,
  date: date,
  completed: boolean,
  created_at: datetime,
  updated_at: datetime
}


```

### Achievement

```
{
  id: number,
  user_id: number,
  habit_id: number,
  title: string,
  description: string,
  icon: string,
  achieved_at: datetime,
  created_at: datetime,
  updated_at: datetime
}


```

## Authentication Flow

1. **User Registration**:  
   - Client submits registration form  
   - Server validates data and creates user  
   - JWT token generated and returned  
   - Client stores token in localStorage
2. **User Login**:  
   - Client submits login credentials  
   - Server validates credentials  
   - JWT token generated and returned  
   - Client stores token in localStorage
3. **Authenticated Requests**:  
   - Client includes JWT in Authorization header  
   - Server validates token for each request  
   - Token expiration handled with refresh mechanism

## Deployment Architecture

### Development Environment

- Local development servers for frontend and backend
- MySQL for database
- Environment-specific configuration via .env files

### Production Environment

- Containerized deployment with Docker
- Nginx as web server/reverse proxy
- MySQL for database
- Redis for caching (optional)

```
┌─────────────────────────────────────────┐
│                Nginx                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌────────────┴────────────┐     ┌─────────┐
│                         │     │         │
│   Laravel API (PHP-FPM) │ ◄─► │  Redis  │
│                         │     │         │
└────────────┬────────────┘     └─────────┘
             │
             ▼
┌────────────┴────────────┐
│                         │
│          MySQL          │
│                         │
└─────────────────────────┘


```

## Project Structure

### Backend (Laravel)

```
saving-habit-tracker/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── API/
│   │   │       ├── AuthController.php
│   │   │       ├── HabitController.php
│   │   │       ├── HabitTrackingController.php
│   │   │       └── AchievementController.php
│   │   ├── Requests/
│   │   │   └── HabitRequest.php
│   │   └── Middleware/
│   ├── Models/
│   │   ├── User.php
│   │   ├── Habit.php
│   │   ├── HabitTracking.php
│   │   └── Achievement.php
│   ├── Services/
│   │   └── AchievementService.php
│   └── Policies/
│       └── HabitPolicy.php
├── database/
│   └── migrations/
├── routes/
│   └── api.php
└── config/
    ├── auth.php
    └── jwt.php


```

### Frontend (React)

```
client/
├── public/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── habits/
│   │   │   ├── HabitForm.jsx
│   │   │   ├── HabitItem.jsx
│   │   │   └── HabitList.jsx
│   │   ├── tracking/
│   │   │   └── TrackingCalendar.jsx
│   │   ├── stats/
│   │   │   └── StatsDisplay.jsx
│   │   └── achievements/
│   │       └── AchievementList.jsx
│   ├── services/
│   │   └── api.js
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js


```

## Data Flow Diagrams

### Habit Creation Flow

```
┌──────────┐   1. Create Habit Request   ┌──────────┐
│          │ ──────────────────────────► │          │
│  React   │                             │  Laravel │
│  Client  │ ◄─────────────────────────  │  API     │
│          │   2. Habit Object Response  │          │
└──────────┘                             └──────────┘
                                              │
                                              │ 3. Save to DB
                                              ▼
                                         ┌──────────┐
                                         │          │
                                         │  MySQL   │
                                         │  Database│
                                         │          │
                                         └──────────┘


```

### Habit Tracking Flow

```
┌──────────┐   1. Toggle Tracking        ┌──────────┐
│          │ ──────────────────────────► │          │
│  React   │                             │  Laravel │
│  Client  │ ◄─────────────────────────  │  API     │
│          │   4. Updated Status         │          │
└──────────┘                             └──────────┘
                                              │
                                              │ 2. Save to DB
                                              ▼
                                         ┌──────────┐
                                         │          │
                                         │  MySQL   │
                                         │  Database│
                                         │          │
                                         └──────────┘
                                              │
                                              │ 3. Check Achievements
                                              │
                                              ▼
                                         ┌──────────┐
                                         │Achievement│
                                         │ Service  │
                                         └──────────┘


```

## Security Considerations

1. **Authentication**  
   - JWT tokens with appropriate expiration  
   - Refresh token mechanism  
   - HTTPS for all communication
2. **Authorization**  
   - Resource-based policies  
   - Users can only access their own data
3. **Data Validation**  
   - Request validation using Laravel form requests  
   - Client-side validation for immediate feedback
4. **Error Handling**  
   - Consistent error response format  
   - Appropriate HTTP status codes  
   - Detailed logging on server

## Scaling Considerations

1. **Horizontal Scaling**  
   - Stateless API design allows multiple server instances  
   - Load balancing across API servers
2. **Database Optimization**  
   - Indexes on frequently queried columns  
   - Database connection pooling  
   - Potential sharding for very large user bases
3. **Caching Strategy**  
   - Redis cache for frequently accessed data  
   - Cache invalidation strategies for data consistency
4. **Performance Monitoring**  
   - API endpoint response time tracking  
   - Database query performance monitoring  
   - Client-side performance metrics