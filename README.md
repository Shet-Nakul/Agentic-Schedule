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
---
# **API - Endpoints**

## **Contracts**
- **POST** `/contracts` → Create one or multiple contracts  
- **GET** `/contracts` → Get all contracts  
- **DELETE** `/contracts` → Delete contracts by list of ContractID  

## **Staff**
- **POST** `/staff` → Create one or multiple staff members  
- **GET** `/staff` → Get all staff  
- **DELETE** `/staff` → Delete staff by list of StaffID  
- **GET** `/staff/{id}` → Get staff by ID  

## **Skills**
- **POST** `/skills` → Create one or multiple skills  
- **GET** `/skills` → Get all skills  
- **DELETE** `/skills` → Delete skills by list of SkillID  

## **Day Off Requests**
- **POST** `/dayoffrequests` → Create one or multiple day off requests  
- **GET** `/dayoffrequests` → Get all day off requests  
- **DELETE** `/dayoffrequests` → Delete day off requests by list of RequestID  


## **Shift Off Requests**
- **POST** `/shiftoffrequests` → Create one or multiple shift off requests  
- **GET** `/shiftoffrequests` → Get all shift off requests  
- **DELETE** `/shiftoffrequests` → Delete shift off requests by list of RequestID  


## **Request Types**
- **POST** `/requesttype` → Create one or multiple request types  
- **GET** `/requesttype` → Get all request types  
- **DELETE** `/requesttype` → Delete request types by list of RequestTypeID  
- **GET** `/requesttype/{id}` → Get request type by ID  


## **Licenses**
- **POST** `/licenses` → Verify license and extract details from uploaded files  
- **GET** `/licenses` → Get all licenses  
- **DELETE** `/licenses/{id}` → Delete license by ID  

## **Machine Identifier**
- **GET** `/machine-id` → Get unique machine identifier  
---

## Notes

Ensure Node.js v18+ is installed.
The local SQLite database is stored at ./server/db/localdb.sqlite. Make sure it is writable by the server process.
