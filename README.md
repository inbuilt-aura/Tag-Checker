# Perplexity Promo Code Validator

A full-stack application for validating Perplexity Pro promo codes in bulk. Built with Next.js, React, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 **Secure Authentication** - Email-based login with Supabase Auth
- 📦 **Batch Management** - Organize promo codes into named batches
- ⚡ **Bulk Validation** - Validate multiple codes simultaneously
- 🔍 **Real-time Status** - Live updates on validation progress
- 📊 **Filtering & Export** - Filter by status and export results to CSV
- 🎨 **Modern UI** - Clean, responsive interface with shadcn/ui components

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Deployment**: Vercel-ready

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd perplexity-promo-validator
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials

### 3. Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create promo_batches table
CREATE TABLE promo_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create promo_codes table
CREATE TABLE promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID REFERENCES promo_batches(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT CHECK (status IN ('valid', 'invalid', 'pending')) DEFAULT 'pending',
  message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE promo_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- Create policies for promo_batches
CREATE POLICY "Users can view their own batches" ON promo_batches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own batches" ON promo_batches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batches" ON promo_batches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own batches" ON promo_batches
  FOR DELETE USING (auth.uid() = user_id);

-- Create policies for promo_codes
CREATE POLICY "Users can view codes from their batches" ON promo_codes
  FOR SELECT USING (
    batch_id IN (
      SELECT id FROM promo_batches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert codes to their batches" ON promo_codes
  FOR INSERT WITH CHECK (
    batch_id IN (
      SELECT id FROM promo_batches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update codes in their batches" ON promo_codes
  FOR UPDATE USING (
    batch_id IN (
      SELECT id FROM promo_batches WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete codes from their batches" ON promo_codes
  FOR DELETE USING (
    batch_id IN (
      SELECT id FROM promo_batches WHERE user_id = auth.uid()
    )
  );
```

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. **Sign Up/Login** - Create an account or sign in
2. **Create a Batch** - Click "Create New Batch" to start organizing your codes
3. **Add Codes** - Paste your promo codes (comma or line separated)
4. **Validate** - Click "Start Validation" to check all pending codes
5. **Filter & Export** - Use filters to view specific statuses and export to CSV

## Validation Logic

The app validates codes by:
1. Making requests to `https://www.perplexity.ai/join/p/priority/{CODE}`
2. Parsing the HTML response for specific indicators:
   - **Valid**: Shows promo entry form or subscription confirmation
   - **Invalid**: Shows "An error occurred" message
   - **Pending**: Unable to determine status

## Security Features

- Row Level Security (RLS) ensures users only see their own data
- JWT-based authentication with Supabase
- Input sanitization and validation
- Rate limiting on validation requests

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Production

```
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues or questions, please open a GitHub issue or contact the development team.

---

**Note**: This tool is for legitimate promo code validation only. Please ensure compliance with Perplexity's terms of service and avoid excessive requests that could be considered abuse.