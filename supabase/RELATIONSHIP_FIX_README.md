# Database Relationship Fix - Instructions

## Problem

Error: "Could not find a relationship between 'company_info' and 'profiles' in the schema cache"

## Solution

A comprehensive SQL script has been created to fix this issue.

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project: <https://app.supabase.com>
   - Navigate to your Isotek project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run the Script**
   - Open the file: `supabase/fix_company_profiles_relationship.sql`
   - Copy the entire contents
   - Paste it into the SQL Editor
   - Click "Run" button

4. **Review the Output**
   - You should see success messages with ✓ checkmarks
   - The verification queries at the end will show:
     - The foreign key constraint details
     - Statistics about companies with/without owners
     - Sample join results

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
cd /home/evanildobarros/Projetos/isotek---sistema-de-gestão-da-qualidade
supabase db reset  # Warning: This resets the database!
# OR
supabase db push   # This applies migrations
```

### Option 3: Manual Application

Run this command directly:

```bash
psql <your-database-connection-string> -f supabase/fix_company_profiles_relationship.sql
```

## What the Script Does

1. ✓ Verifies both tables exist
2. ✓ Adds `owner_id` column if missing
3. ✓ Cleans up invalid references
4. ✓ Creates the foreign key constraint
5. ✓ Creates an index for better performance
6. ✓ Adds helpful documentation

## After Running the Script

1. **Test the Super Admin Page**
   - Navigate to `/super-admin` in your application
   - The page should load without errors
   - Owner names should be displayed correctly

2. **Verify the Fix**
   - The error should be gone
   - Companies should display with their owner information

## Need Help?

If you encounter any issues:

- Check the Supabase logs for detailed error messages
- Verify that your database user has the necessary permissions
- Make sure both `company_info` and `profiles` tables exist

## Rollback (If Needed)

If you need to remove the constraint:

```sql
ALTER TABLE company_info DROP CONSTRAINT IF EXISTS company_info_owner_id_fkey;
DROP INDEX IF EXISTS idx_company_info_owner_id;
```
