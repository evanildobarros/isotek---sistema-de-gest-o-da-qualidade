# Quick Reference: Applying the Database Fix

## Current Status

✅ SQL fix script created: `fix_company_profiles_relationship.sql`  
✅ Verification script created: `verify_relationship.sql`  
✅ Documentation created: `RELATIONSHIP_FIX_README.md`  
⏳ **Next:** Apply the fix to your Supabase database

## Quick Steps

### 1. Copy the Fix Script

The file `fix_company_profiles_relationship.sql` is currently open in your editor.

- Press **Ctrl+A** (or **Cmd+A** on Mac) to select all
- Press **Ctrl+C** (or **Cmd+C** on Mac) to copy

### 2. Open Supabase Dashboard

- Navigate to: <https://app.supabase.com>
- Select your **Isotek** project
- Click **SQL Editor** in the left sidebar
- Click **New Query** button

### 3. Run the Script

- Paste the copied script (Ctrl+V or Cmd+V)
- Click the **Run** button
- Wait for completion (~2-5 seconds)

### 4. Expected Output

You should see messages like:

```
NOTICE: Both tables exist ✓
NOTICE: owner_id column already exists ✓
NOTICE: ========================================
NOTICE: Foreign key relationship created successfully!
NOTICE: company_info.owner_id -> profiles.id
NOTICE: ========================================
```

Plus results from verification queries showing:

- Foreign key constraint details
- Company statistics
- Sample join results

### 5. Verify the Fix

Run the `verify_relationship.sql` script the same way to confirm everything is working.

### 6. Test Your App

- Open your application
- Navigate to `/super-admin`
- Verify the page loads without errors
- Check that owner names are displayed

## Troubleshooting

**If you get permission errors:**

- Make sure you're logged in as a Supabase admin
- Check you selected the correct project

**If you get constraint errors:**

- The script will handle this - it cleans up invalid data first

**If the error persists after applying:**

- Run the verification script to diagnose
- Check browser console for specific errors
- Share the error message with me

## Need Help?

Just let me know if you encounter any issues or have questions!
