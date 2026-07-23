# AI SaaS Backend

Bulletproof Backend Architecture for AI SaaS Platform with Credit/Wallet System.

## Features

- **Atomic Transactions**: All balance mutations use PostgreSQL transactions with `FOR UPDATE` locks
- **Deadlock Prevention**: Deterministic lock ordering prevents circular wait conditions
- **Immutable Ledger**: Append-only transaction log with trigger protection
- **Hold/Reserve Pattern**: Safe AI credit deduction with rollback on failure
- **Rate Limiting**: Redis-based rate limiting with atomic Lua scripts
- **Security**: Argon2 password hashing, JWT with refresh tokens

## Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript
- **Database**: PostgreSQL + TypeORM
- **Cache**: Redis
- **Auth**: JWT + Passport + Argon2
- **API Docs**: Swagger

## Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- Redis >= 6

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 3. Start Database (Docker)

```bash
docker-compose up -d db redis
```

### 4. Run Migrations

```bash
npm run typeorm:migration:run
```

### 5. Start Development Server

```bash
npm run start:dev
```

### 6. Access API Documentation

Open http://localhost:3000/api/docs

## Project Structure

```
src/
├── common/           # Guards, decorators, interceptors, filters
├── config/           # Configuration files
├── modules/
│   ├── auth/         # Authentication (JWT, login, register)
│   ├── users/        # User management
│   ├── wallet/       # Credit/Wallet system
│   ├── payout/       # Withdrawal requests
│   ├── ai/           # AI model integration
│   └── admin/        # Admin operations
└── database/         # SQL schemas and migrations
```

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

### Wallet
- `GET /api/v1/wallet/balance` - Get balance
- `POST /api/v1/wallet/transfer` - Transfer credits
- `POST /api/v1/wallet/topup` - Request top-up
- `GET /api/v1/wallet/transactions` - Transaction history

## Security Features

### Deadlock Prevention
All wallet locks are acquired in deterministic order (sorted by UUID) to prevent deadlocks during concurrent transfers.

### Hold/Reserve Pattern
AI credit deductions follow a safe pattern:
1. Hold credits (mark as PENDING)
2. Call AI API
3. Confirm on success OR Refund on failure

### Rate Limiting
Financial endpoints are protected with Redis-based rate limiting using atomic Lua scripts.

## License

MIT
