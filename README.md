# Produce Hub - Inventory & Recipe Management

Full-stack Next.js 14 application for fruits & vegetables inventory management and collaborative recipe management. Built with Prisma + SQLite, NextAuth (Google SSO), TailwindCSS, role-based access control, and OpenAI-powered insights.

## Project Overview

Produce Hub is a production-ready inventory and recipe system with:

- Inventory module with low-stock automation, supplier tracking, and AI suggestions
- Recipe module with sharing, tagging, and AI meal planning
- Role-based access control for ADMIN, MANAGER, and STAFF
- Secure authentication via Google SSO
- Responsive dashboard UI with dark mode

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- Prisma ORM + SQLite
- NextAuth.js (Google Provider)
- TailwindCSS
- OpenAI API

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` from the sample:
   ```bash
   copy env.sample .env
   ```

3. Run database migrations and seed:
   ```bash
   npx prisma migrate dev --name init
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Required in `.env`:

- `DATABASE_URL="file:./dev.db"`
- `NEXTAUTH_URL="http://localhost:3000"`
- `NEXTAUTH_SECRET="your-secret"`
- `GOOGLE_CLIENT_ID="your-google-client-id"`
- `GOOGLE_CLIENT_SECRET="your-google-client-secret"`
- `OPENAI_API_KEY="your-openai-api-key"`

## How to Run Locally

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Open `http://localhost:3000`.

## Deployment Instructions

1. Provision a database (SQLite can be used for small deployments; for production scale, switch to PostgreSQL).
2. Set environment variables in your host (Vercel, Railway, Render, etc.).
3. Build and start:
   ```bash
   npm run build
   npm run start
   ```

> If deploying to Vercel, set `NEXTAUTH_URL` to your production domain.

## AI Features

Inventory module:
- Smart Reorder Suggestions: generates reorder quantities for low-stock items.
- Spoilage Risk Detection: highlights items expiring soon with discount actions.
- Demand Prediction: creates a short demand insight paragraph.

Recipe module:
- Generate Recipe from Ingredients
- Improve Recipe
- 7-Day Meal Plan Generator
- Auto-generate Grocery List from selected recipes

## Seed Data

`npx prisma migrate dev` runs the seed script which creates:
- Admin, manager, and staff sample users
- Sample inventory items and recipes

Update the seeded user emails to match Google SSO accounts if desired.
