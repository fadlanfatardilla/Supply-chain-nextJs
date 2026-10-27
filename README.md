# 📦 Supply Chain Warehouse Management System (WMS)

A modern **role-based Warehouse Management System** built with **Next.js 15**, **TypeScript**, **Prisma**, and **PostgreSQL**. This application helps supply chain teams manage suppliers, products, warehouses, and racks, while tracking every goods movement through inbound, outbound, transfers, and barcode-based stock audits.

The system provides two user roles, **Manager** and **Staff**, each with a dedicated dashboard experience, so daily warehouse operations and management oversight can be handled in one place.

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

---

## ✨ Key Features

- **Role-Based Access Control**: Separate Manager and Staff roles with protected routes and dedicated dashboards, powered by NextAuth.js and middleware.
- **Supplier Management**: Create, update, and maintain supplier records.
- **Product Management**: Manage the product catalog and its stock information.
- **Warehouse & Rack Management**: Organize storage locations across multiple warehouses and racks, with a detail view for each warehouse.
- **Inbound Receiving**: Record incoming goods from suppliers and review the full inbound history.
- **Outbound Shipping**: Record outgoing goods and keep stock levels accurate.
- **Stock Transfers**: Move stock between racks or between warehouses.
- **Stock Movements**: Track every stock change in a complete movement log.
- **Barcode Scan & Audit Scan**: Scan items and perform stock audits to verify physical stock against system records.
- **Notifications**: In-app notification bell to keep users informed about important events.
- **Light & Dark Theme**: Theme switching with a responsive, accessible interface.

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui, Lucide React
- **Animation:** Framer Motion
- **State Management:** Zustand
- **Validation:** Zod
- **Code Quality:** ESLint

---

## 👥 User Roles

| Role        | Description                                                                                         |
| ----------- | --------------------------------------------------------------------------------------------------- |
| **Manager** | Oversees the whole operation: dashboard overview, master data, and monitoring of all stock activity. |
| **Staff**   | Handles day-to-day warehouse tasks such as receiving, shipping, scanning, and auditing stock.        |

---

## 📁 Project Structure

```text
.
├── app/
│   ├── actions/              # Server actions (auth, audit, inbound, outbound, products, suppliers, warehouses)
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth route handler
│   │   └── notifications/        # Notifications endpoint
│   ├── dashboard/
│   │   ├── audit-scan/       # Stock audit by scanning
│   │   ├── inbound/          # Inbound form and history
│   │   ├── outbound/         # Outbound form
│   │   ├── movements/        # Stock movements log
│   │   ├── products/         # Product management
│   │   ├── racks/            # Rack management
│   │   ├── scan/             # Barcode scan
│   │   ├── settings/         # User settings
│   │   ├── staff/            # Staff dashboard
│   │   ├── suppliers/        # Supplier management
│   │   └── warehouses/       # Warehouse list and detail
│   └── login/                # Login page
├── components/
│   ├── auth/                 # Login form
│   └── ui/                   # shadcn/ui components
├── hooks/                    # Custom React hooks
├── lib/                      # Prisma client and utilities
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Database seeder
├── auth.ts                   # NextAuth configuration
└── middleware.ts             # Route protection
```

---

## 🚀 Getting Started

### Prerequisites

Ensure the following tools are installed on your machine:

- [Node.js](https://nodejs.org/) 18.18 or later
- [PostgreSQL](https://www.postgresql.org/download/)
- [Git](https://git-scm.com/downloads)

### Installation & Local Setup

**1. Clone the repository**

```bash
git clone https://github.com/<your-username>/<your-repository-name>.git
cd <your-repository-name>
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

Create a `.env` file in the project root:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"

# NextAuth secret (generate one with: npx auth secret)
AUTH_SECRET="your-secret-here"
```

**4. Set up the database**

```bash
npx prisma generate
npx prisma migrate dev
```

**5. Seed the database (optional)**

```bash
npx prisma db seed
```

See `prisma/seed.ts` for the sample data and default accounts that will be created.

**6. Run the development server**

```bash
npm run dev
```

**7. Open the application**

Navigate to the following address in your browser:

```text
http://localhost:3000
```

---

## 📜 Available Scripts

| Command                  | Description                          |
| ------------------------ | ------------------------------------ |
| `npm run dev`            | Start the development server         |
| `npm run build`          | Build the application for production |
| `npm run start`          | Start the production server          |
| `npm run lint`           | Run ESLint                           |
| `npx prisma studio`      | Open Prisma Studio to browse data    |
| `npx prisma migrate dev` | Create and apply database migrations |
| `npx prisma db seed`     | Seed the database                    |

---

## 🎯 Project Objectives

- Build a web-based system that streamlines warehouse and supply chain operations.
- Provide accurate, traceable stock records through a complete movement history.
- Reduce stock discrepancies with barcode scanning and audit workflows.
- Separate responsibilities between managers and staff through role-based access.
- Demonstrate a modern full-stack architecture with Next.js, Prisma, and PostgreSQL.

---

## ⚠️ Notes

- Never commit your `.env` file. It contains sensitive credentials.
- Change all default seeded credentials before deploying to production.
- Make sure `AUTH_SECRET` is set to a strong, unique value in every environment.

---

_Built as a full-stack supply chain project focused on warehouse operations, inventory accuracy, and role-based workflows._
