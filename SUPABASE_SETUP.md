# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: SDDC Proposal Manager
   - **Database Password**: (choose a strong password and save it)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free tier is sufficient to start

## 2. Get Your API Credentials

Once your project is created:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the left menu
3. Copy the following values:
   - **Project URL** → Use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → Use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → Use for `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep this secret!)

## 3. Update Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Anthropic API
ANTHROPIC_API_KEY=your-anthropic-api-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Create Database Schema

1. In your Supabase project, go to **SQL Editor** (in the left sidebar)
2. Click **New Query**
3. Copy the entire content of `supabase-schema.sql` and paste it
4. Click **Run** or press `Ctrl+Enter`

This will create:
- All database tables (profiles, projects, documents, proposals, etc.)
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for automatic updates
- Automatic profile creation on user signup

## 5. Seed Initial Data

1. Still in the **SQL Editor**, create a new query
2. Copy the entire content of `supabase-seed.sql` and paste it
3. Click **Run**

This will populate the `resources` table with initial San Diego resources (governmental, academic, nonprofit, cultural).

## 6. Configure Storage for Documents

1. Go to **Storage** in the left sidebar
2. Click **New Bucket**
3. Create a bucket named: `documents`
4. Make it **Private** (not public)
5. Click **Create bucket**

### Set Storage Policies

1. Click on the `documents` bucket
2. Go to **Policies** tab
3. Add these policies:

**Policy 1 - Allow authenticated users to upload:**
```sql
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');
```

**Policy 2 - Allow authenticated users to read:**
```sql
CREATE POLICY "Authenticated users can read documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');
```

**Policy 3 - Allow authenticated users to delete:**
```sql
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');
```

## 7. Configure Authentication

1. Go to **Authentication** → **Providers** in the left sidebar
2. Make sure **Email** is enabled
3. Configure email settings:
   - Enable **Confirm email** (recommended)
   - Customize email templates if desired

### (Optional) Configure Custom SMTP

For production, configure custom SMTP:
1. Go to **Authentication** → **Email Templates**
2. Click **SMTP Settings**
3. Add your SMTP credentials

## 8. Test the Setup

1. Start your Next.js development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:3000/register`
3. Create a test account
4. Check that:
   - User is created in **Authentication** → **Users**
   - Profile is automatically created in the `profiles` table
   - You can log in successfully

## 9. Verify Database Tables

Go to **Table Editor** and verify all tables exist:
- ✓ profiles
- ✓ projects
- ✓ documents
- ✓ proposals
- ✓ proposal_history
- ✓ proposal_comments
- ✓ conversations
- ✓ resources

## 10. Common Issues

### Issue: "Invalid API key"
- Double-check your `.env.local` file
- Make sure you're using the correct project URL and keys
- Restart your development server after updating `.env.local`

### Issue: "relation does not exist"
- Make sure you ran the `supabase-schema.sql` script completely
- Check for any errors in the SQL Editor output

### Issue: "Row Level Security policy violation"
- Ensure RLS policies were created correctly
- Check that you're logged in when accessing protected resources

## Next Steps

Once Supabase is configured:
1. ✓ Authentication is working
2. ✓ Database tables are created
3. ✓ Storage bucket is configured
4. ✓ Initial resources are seeded

You can now proceed to:
- Create projects
- Upload documents
- Generate proposals with AI
- Manage resources

## Support

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
