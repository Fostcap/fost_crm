# Fost CRM — Vercel Deployment

## Quick Start

### 1. Prepare App.jsx
The main CRM code needs 4 small patches to run outside Claude's sandbox.
A script is included to do this automatically:

```bash
# Save your artifact code to a file (Copy contents from Claude artifact)
# Then run:
bash convert.sh artifact-code.txt
```

This applies:
- `import storage` (abstraction layer)
- `window.storage.get/set` → `storage.get/set`
- `copyToClipboard` → `downloadCSV` (Blob download)

### 2. Set Up Supabase (free)
1. Go to https://supabase.com and create a project
2. In SQL Editor, run:
```sql
create table if not exists kv_store (
  key   text primary key,
  value text not null,
  updated_at timestamptz default now()
);
alter table kv_store enable row level security;
create policy "allow all" on kv_store for all using (true) with check (true);
```
3. Go to Settings → API, copy your **Project URL** and **anon key**
4. Create `.env` from `.env.example`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Deploy to Vercel
1. Push this folder to a GitHub repo
2. Go to https://vercel.com → New Project → Import your repo
3. Add the 2 environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
4. Deploy

### 4. Import Your Data
On first load, the app will show "Storage empty - use Import DATA".
Click **Import DATA** and paste your JSON export from the Claude version.
Then click **SAVE NOW**.

## Updating
When Claude produces a new version:
1. Copy the artifact code
2. Run `bash convert.sh new-code.txt`
3. Commit and push to GitHub
4. Vercel redeploys automatically (~30 seconds)

## File Structure
```
├── package.json          # Dependencies
├── vite.config.js        # Vite build config
├── index.html            # Entry HTML
├── convert.sh            # Patches artifact code for Vercel
├── .env.example          # Supabase credentials template
├── .gitignore
└── src/
    ├── main.jsx          # React entry point
    ├── storage.js        # Storage abstraction (Claude ↔ Supabase)
    └── App.jsx           # CRM code (patched from artifact)
```

## Dependencies
- react, react-dom
- recharts (charts)
- @supabase/supabase-js (storage backend)
- vite, @vitejs/plugin-react (build)
