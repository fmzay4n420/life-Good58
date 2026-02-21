# Life Good - Student Earning Platform

Life Good is a mobile-first digital platform designed to help students earn money through referrals and activities. It features a secure user system, an automated referral tracking system, and a robust admin panel for total control.

## Features

### User Side
- **Mobile-First Design**: Optimized for mobile screens with a clean, modern UI.
- **Registration & Login**: Secure authentication with phone number and password.
- **Referral System**: Automatic 6-digit refer code generation. Earn ৳100 for every successful referral.
- **ID Activation**: Manual activation system via Admin for transparency.
- **Dashboard**: Real-time balance, referral count, and status tracking.
- **Withdrawals**: Easy withdrawal requests via Bkash or Nagad.
- **Profile Management**: Upload profile pictures and update personal info.

### Admin Side
- **Secure Admin Portal**: Separate login for administrators.
- **Statistics**: Overview of total users, active IDs, and pending withdrawals.
- **User Management**: Full control over user data, status, and balances.
- **Withdrawal Management**: Process or reject withdrawal requests with history tracking.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS 4, Lucide Icons, Motion.
- **Backend**: Express.js (Node.js).
- **Database**: SQLite (better-sqlite3) for reliable data storage.

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`.
4. Start the development server:
   ```bash
   npm run dev
   ```

## Admin Credentials
- **Username**: `ayan@123`
- **Password**: `admin@123`

## License
Apache-2.0
