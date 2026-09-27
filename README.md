# FurniCore

FurniCore is a full-stack furniture showroom management system built as my final project for the Digital Hub program.

The system is designed around the daily operations of a furniture business, combining point-of-sale, inventory, customers, suppliers, purchases, expenses, reporting, and business management in one application.

## Features

- Secure authentication using Supabase Auth
- Role-based access for Admin and Cashier users
- Dashboard with business statistics and recent activity
- Product and category management
- Multiple product images
- Furniture customization support
- Inventory management and low-stock alerts
- Manual stock adjustments
- Customer management and purchase history
- Point-of-sale (POS) system
- Discounts and partial payments
- Sales and payment tracking
- Printable invoices and receipts
- Sale cancellation
- Returns and refunds
- Supplier management
- Supplier purchases with automatic inventory updates
- Expense tracking
- Business reports and analytics
- Staff/user management
- Audit logs
- Business settings and branding
- AI-powered product description generator
- AI business assistant

## Tech Stack

### Frontend
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts

### Backend
- FastAPI
- Python
- REST API

### Database & Authentication
- PostgreSQL
- Supabase Database
- Supabase Auth
- Supabase Storage

### AI
- OpenAI API

## Project Structure

```text
FurniCore/
├── frontend/       # Next.js application
├── backend/        # FastAPI application
└── README.md
```

The frontend communicates with the FastAPI backend through REST API endpoints. Supabase provides PostgreSQL database services, authentication, and file storage.

## Authentication & Authorization

Authentication is handled using Supabase Auth.

After login, the frontend maintains the Supabase session and sends the user's access token to the FastAPI backend using a Bearer token.

The backend validates the token and retrieves the user's profile and role from the database before allowing access to protected operations.

Two application roles are supported:

- **Admin** — Full access to management, financial, reporting, settings, and staff features.
- **Cashier** — Access to daily operational features such as POS, customers, sales, payments, and invoices.

Sensitive operations are protected by backend authorization rather than relying only on frontend visibility.

## AI Features

### Product Description Generator

Admins can generate product descriptions based on existing product information.

The AI is instructed to use only the provided product data and avoid inventing unsupported specifications.

### Business Assistant

The Business Assistant allows admins to ask questions about recent business activity, including sales, expenses, inventory, and low-stock products.

Relevant business data is collected by the backend and provided to the AI as context. Customer and staff personal information is not sent to the AI.

The assistant does not use RAG or maintain conversation memory.

## Database

The main database entities include:

- Users
- Categories
- Products
- Product Images
- Customers
- Sales
- Sale Items
- Payments
- Returns
- Return Items
- Suppliers
- Purchases
- Purchase Items
- Expenses
- Audit Logs
- Business Settings

Database relationships and constraints are implemented using PostgreSQL through Supabase.

## Environment Variables

Create a `.env` file inside the `backend` directory:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

Create `.env.local` inside the `frontend` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

> Secret keys such as the Supabase Service Role Key and OpenAI API Key must only be stored on the backend and should never be committed to Git.

## Running the Project Locally

### Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

FastAPI API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

### Frontend

Open another terminal and navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

## Production Build

To verify the frontend production build:

```bash
cd frontend
npm run build
```

## Security

FurniCore includes several security measures:

- Supabase-based authentication
- Bearer-token validation on protected backend endpoints
- Backend role-based authorization
- Server-side storage of secret API keys
- Input validation using FastAPI/Pydantic
- File type and file size validation for uploads
- Restricted administrative operations
- Safe API error handling
- Audit logging for important operations
- Database constraints and parameterized Supabase queries

Environment files and secret credentials are excluded from version control.

## Business Logic

Important operations are connected across the system:

- Completing a sale reduces product inventory.
- Cancelling an eligible sale restores inventory.
- Returns can restore returned quantities to inventory.
- Payments update the remaining sale balance.
- Supplier purchases increase inventory.
- Inventory levels are compared with minimum-stock values to generate low-stock alerts.
- Sales, returns, and expenses contribute to business reports.
- Customer profiles display their related purchase history.

## Reports

The reporting module provides information such as:

- Gross sales
- Refunds
- Net sales
- Expenses
- Net revenue
- Outstanding balances
- Sales count
- Average sale value
- Sales trends
- Top-selling products
- Expense breakdown
- Low-stock products

Net revenue in FurniCore represents net sales after refunds minus recorded expenses. It is not intended to represent full accounting profit or include complete cost-of-goods-sold accounting.

## Current Scope

FurniCore focuses on the core workflow of a single furniture showroom.

Features intentionally outside the current scope include:

- Multi-branch management
- E-commerce storefront
- Online payments
- Delivery management
- Barcode scanning
- Full procurement workflows
- VAT/tax management
- Advanced accounting
- Advanced AI forecasting
- Multilingual interface

These can be considered as future improvements.

## Author

**Youssef Al Issa**

Final Project — Digital Hub
