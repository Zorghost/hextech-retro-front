# Password Reset Feature Setup

This guide explains how to set up and configure the password reset feature for your application.

## Overview

Users can now request a password reset via email if they forget their password. The system uses:
- Secure token-based reset links (valid for 1 hour)
- NodeMailer for email delivery
- Database storage of reset tokens

## Setup Steps

### 1. Install Dependencies

The dependencies have been updated in `package.json`. Run:

```bash
npm install
# or
yarn install
```

This installs the upgraded NextAuth (v5.0.0 stable) and nodemailer.

### 2. Database Migration

Run the Prisma migration to create the `PasswordResetToken` table:

```bash
npx prisma migrate deploy
```

This creates the new table that stores password reset tokens temporarily.

### 3. Environment Configuration

Copy `.env.example` to `.env.local` and configure email settings:

```bash
cp .env.example .env.local
```

#### Development Mode

In development, emails are logged to the console automatically. No SMTP configuration needed.

#### Production Mode

You must configure SMTP credentials:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="noreply@yourdomain.com"
NEXTAUTH_URL="https://yourdomain.com"
```

**Gmail Users:**
1. Enable 2-Factor Authentication on your Google Account
2. Generate an [App Password](https://myaccount.google.com/apppasswords)
3. Use the 16-character app password in `SMTP_PASS`

**Other Email Providers:**
- SendGrid: Use `smtp.sendgrid.net` port 587
- AWS SES: Use your SES SMTP endpoint
- Custom SMTP: Configure your provider's SMTP settings

### 4. Customize Email Template

Edit `src/lib/mail.js` to customize the password reset email:

```javascript
const mailOptions = {
  from: process.env.SMTP_FROM || "noreply@retrogames.local",
  to: email,
  subject: "Reset Your Password", // Customize subject
  html: `...` // Customize HTML template
};
```

## How It Works

### User Flow

1. User clicks "Forgot password?" on login page
2. User enters email address
3. System sends reset link to email
4. User clicks link (valid for 1 hour)
5. User sets new password
6. Token is deleted and user can log in with new password

### Technical Flow

1. **Request Reset** (`requestPasswordReset()`)
   - Validates user exists (without revealing it)
   - Generates secure random token
   - Stores token with 1-hour expiry in database
   - Sends email with reset link

2. **Reset Password** (`resetPassword()`)
   - Verifies token exists and hasn't expired
   - Validates password requirements (8+ characters)
   - Hashes new password with bcryptjs
   - Updates user record
   - Deletes token from database

3. **Verify Token** (`verifyResetToken()`)
   - Checks token validity
   - Returns token status (valid/expired/invalid)

## Pages

### `/auth/forgot-password`
- Server-rendered page for requesting password reset
- Shows success/error messages
- Accepts email input

### `/auth/reset-password?token=<token>`
- Client-rendered page for setting new password
- Validates token on component mount
- Real-time password matching validation
- Shows loading state during submission

### `/auth/login`
- Updated with "Forgot password?" link

## Security Features

✅ **Token Security**
- Cryptographically random 64-character hex tokens
- Tokens expire after 1 hour
- Tokens are single-use (deleted after use)
- Tokens stored in database, not in client

✅ **Password Security**
- Minimum 8 characters required
- Hashed with bcryptjs (12 rounds)
- No plain-text storage

✅ **Privacy**
- System doesn't reveal if email exists
- Reset links are unique per request
- Old tokens deleted when new one requested

✅ **Email Security**
- SMTP credentials stored in environment variables
- Email addresses not exposed in URLs
- Reset links include full URL with token

## Troubleshooting

### Emails not sending in production

1. Check SMTP credentials are correct
2. Verify NEXTAUTH_URL is set to your domain
3. Check server logs for nodemailer errors
4. Test SMTP settings with:
   ```javascript
   const transporter = nodemailer.createTransport({...});
   await transporter.verify();
   ```

### Email sending works but link doesn't work

1. Ensure NEXTAUTH_URL matches your actual domain
2. Check database connection (PasswordResetToken table)
3. Verify token hasn't expired (1 hour window)
4. Check browser console for redirect errors

### Users receiving duplicate emails

1. Implement rate limiting on `/auth/forgot-password`
2. Add form submission debouncing on frontend
3. Store last request time per email

## Future Improvements

- [ ] Rate limiting on password reset endpoint (prevent spam)
- [ ] Email verification for account recovery
- [ ] Admin dashboard to manage user accounts
- [ ] Password reset via SMS (twilio integration)
- [ ] OAuth providers (Google, GitHub sign-in)

## Files Changed

- `package.json` - Updated NextAuth to v5.0.0, added nodemailer
- `prisma/schema.prisma` - Added PasswordResetToken model
- `prisma/migrations/20260829_add_password_reset/migration.sql` - New migration
- `src/lib/mail.js` - Email sending utility (NEW)
- `src/features/auth/passwordReset.js` - Password reset logic (NEW)
- `src/app/(admin)/auth/forgot-password/page.jsx` - Forgot password page (NEW)
- `src/app/(admin)/auth/reset-password/page.jsx` - Reset password page (NEW)
- `src/app/(admin)/login/page.jsx` - Added forgot password link
- `.env.example` - Email configuration documentation (NEW)
