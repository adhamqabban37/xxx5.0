# Firebase Setup Instructions

## 🔥 Firebase Project Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or use existing project
3. Project name: `xenlix-aeo-platform` (or your preference)
4. Enable Google Analytics (optional)
5. Create project

### 2. Enable Firestore Database
1. In Firebase Console → Build → Firestore Database
2. Click "Create database"
3. Choose "Start in production mode" (we'll set custom rules)
4. Select location closest to your users (e.g., us-central1)

### 3. Generate Service Account Key
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. **IMPORTANT**: Keep this file secure - never commit to version control

### 4. Environment Variables Setup

The following environment variables need to be configured in `.env.local`:

```bash
# Firebase Configuration (REQUIRED)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
FIREBASE_DATABASE_URL="https://your-project-id-default-rtdb.firebaseio.com/"  # Optional for Firestore-only

# Firebase Storage (Optional - for PDF storage)
FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"

# Firebase Collection Names (Configurable)
FIREBASE_COLLECTION_CRAWL_RESULTS="crawl_results"
FIREBASE_COLLECTION_EMBEDDINGS="embedding_scores"
FIREBASE_COLLECTION_LIGHTHOUSE_AUDITS="lighthouse_audits" 
FIREBASE_COLLECTION_PDF_METADATA="pdf_exports"
FIREBASE_COLLECTION_ANALYSIS_JOBS="analysis_jobs"
```

### 5. Security Notes
- Store private key as single-line string with `\n` for newlines
- Use environment variables - never hardcode credentials
- Enable Firebase Authentication for production security
- Set up proper Firestore security rules

### 6. Firestore Collections Structure

Our platform will use these collections:
- `crawl_results` - Web crawling data and content analysis
- `embedding_scores` - Semantic analysis and AEO scores  
- `lighthouse_audits` - Performance and technical audits
- `pdf_exports` - Generated report metadata
- `analysis_jobs` - Job tracking and status
- `user_sessions` - User data and preferences

Next steps: Configure environment variables and run the setup script.