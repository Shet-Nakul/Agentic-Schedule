# Agentic Schedule API

This project provides REST APIs for managing Contracts, Staff, Skills, Day Off Requests, Shift Off Requests, and Licenses.

## Getting Started

Follow these steps to run the server locally and access the APIs.

### 1. Clone the repository

```bash
git clone https://github.com/Shet-Nakul/Agentic-Schedule.git
cd Agentic-Schedule
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

```bash
node server/server.mjs
```

### 4. Access the APIs

Open your browser and navigate to access the API documentation (Swagger UI) at:
```bash
http://localhost:3001/api-docs
```

## Available APIs

- **Contracts**: Create, fetch, and delete contracts
- **Staff**: Manage staff members
- **Skills**: Manage skill categories
- **Day Off Requests**: Submit and manage day off requests
- **Shift Off Requests**: Submit and manage shift off requests
- **Licenses**: Verify licenses and fetch license information
- **Machine ID**: Get a unique machine identifier

## Notes

Ensure Node.js v18+ is installed.
The local SQLite database is stored at ./server/db/localdb.sqlite. Make sure it is writable by the server process.