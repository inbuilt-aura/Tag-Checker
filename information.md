# 📄 Documentation: Perplexity Promo Code Validator Platform

## 🧩 Overview

This platform allows users to validate multiple Perplexity Pro promo codes in bulk. It checks the validity of each code by redirecting to a unique Perplexity URL and interpreting the result programmatically.

---

## 🎯 Key Features

- Login authentication (basic for now)
- Dashboard for code input and validation
- Batch name support (optional)
- Code validation against Perplexity’s system
- Real-time status updates
- Filter by status: All, Valid, Invalid, Pending
- Export results as CSV

---

## 🖥️ Frontend

**Tech Stack:**

- React.js
- TailwindCSS
- Axios (for API calls)
- Zustand (for state management)
- shadcn/ui (for reusable components)

**Pages & Components:**

1. **Login Page**

   - Basic login via Supabase Auth

2. **Dashboard**

   - Promo code input field (multi-line or comma-separated)
   - Optional batch name input
   - Add Codes button
   - Start Validation button
   - Validation Results table
   - Filters: All / Valid / Invalid / Pending
   - Export to CSV

3. **Reusable Components**

   - CodeInput
   - ValidationControls
   - ResultTable
   - FilterDropdown

---

## 🛠️ Backend

**Powered by Supabase** (PostgreSQL + Auth + Edge Functions)

### 📦 Supabase Features Used:

- **Auth:** Email-based login (can later expand to OAuth)
- **Database:** Store users, promo code batches, and validation results
- **Edge Functions / API routes:** Custom validation logic

### 🗃️ Database Schema

#### `users`

| id  | email | created_at |
| --- | ----- | ---------- |

#### `promo_batches`

| id  | user_id | name | created_at |
| --- | ------- | ---- | ---------- |

#### `promo_codes`

| id  | batch_id | code | status (valid/invalid/pending) | message | timestamp |
| --- | -------- | ---- | ------------------------------ | ------- | --------- |

### 🔍 Validation Logic

- Edge function simulates visit to:
  `https://www.perplexity.ai/join/p/priority/{PROMO_CODE}`
- Parses returned HTML for:

  - "An error occurred…" → `invalid`(need clear message will be provided from perplexity.)
  - Promo entry form → `pending`
  - Confirmation text → `valid`

- Stores result in `promo_codes` table with status and message

---

## 📤 CSV Export

- Client-side generation using collected results
- Includes: Code, Status, Message, Timestamp

---

## 🔐 Authentication Flow

1. User logs in via Supabase Auth
2. JWT token stored in local storage
3. Used to fetch and post user-specific promo code batches

---

## 📊 Filtering and UI States

- Filters handled client-side using Zustand state
- Default view: All codes
- Toggle buttons update view instantly

---

## ✅ Future Improvements

- Rate-limiting validation jobs
- Add webhook for Perplexity code response if available
- Scheduling for re-validation of pending codes
- Analytics on promo code usage across batches

---

## 🌐 URL Format Reference

```
https://www.perplexity.ai/join/p/priority/{PROMO_CODE}
```

---

## 📌 Notes

- This is a helper tool. It does not expose or store any private Perplexity data.
- Ensure Perplexity terms are not violated (i.e. scraping restrictions).
- Supabase limits and quotas need monitoring on free tier.
