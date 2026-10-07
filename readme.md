# Inventory Tracker
An asset tracker for Weber State University.

## Repository at a Glance
- `web/`: Frontend (React + TypeScript + Vite)
- `api/`: Backend (Express + TypeScript)
- `@types/`: Shared schemas/types used by frontend and backend
- `Documents/`: Project requirements, references, and walkthroughs
- `Documents/FRONTEND_GUIDE.md`: Comprehensive onboarding guide for frontend routing.
- `Documents/FINAL_HANDOFF.md`: Full handoff documentation including architecture.

## Prerequisites
Before cloning this repository, you **must** meet these requirements:
1. **Node.js v22:** Newer versions (v23+) will crash the API due to dependency conflicts.
2. **MySQL Server:** You must manually create an empty database (e.g., `CREATE DATABASE tech_inventory;`).
## Automated Setup
Run the initialization script for your OS from the root of the repository:
- **Windows:** `.\setup.ps1`
- **Mac/Linux:** `./setup.sh`

## Environment Configuration
You must manually configure your `api/.env` file with your local MySQL credentials. 
```env
PORT=8080
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=[YOUR_LOCAL_MYSQL_PASSWORD]
DB_PORT=3306
JWT_SECRET=local_dev_secret_key
DB_NAME=tech_inventory
Database Initialization
Run these from the api/ directory:
npm run dbinit
npm run dbseed

Running the Project
You can launch both servers simultaneously using the start scripts:

Windows: .\start_dev.ps1

Mac/Linux: ./start_dev.sh
