# 🔗 Frontend-Backend Integration Guide

Your Nexora frontend and backend are now connected! Here's everything you need to know:

## ✅ What's Done

✅ API client created at `src/lib/api.ts`
✅ Login page updated to use backend authentication
✅ App.tsx uses backend JWT tokens instead of mock auth
✅ All API requests automatically include auth token
✅ Database layer implemented with PostgreSQL + Drizzle ORM
✅ Shared database library at `lib/db`

## 📋 Quick Setup Checklist

### 1. Create `.env` in Frontend

```bash
cd artifacts/fintech-dashboard
cp .env.example .env
```

Add these environment variables:
```
VITE_API_URL=http://localhost:3000/api/v1
VITE_API_BASE_URL=http://localhost:3000
VITE_GEMINI_API_KEY=  # Leave empty for now
```

### 2. Start Backend

```bash
cd backends/api-server

# Configure .env (if not already done)
cp .env.example .env
# Edit with your PostgreSQL and Redis URLs

# Start server
npm run dev
```

### 3. Setup Database

The project uses Drizzle ORM. To push the schema to your Supabase instance:

```bash
cd lib/db
pnpm install
# Ensure DATABASE_URL is in your .env or environment
pnpm run push
```

### 4. Start Frontend  

```bash
cd artifacts/fintech-dashboard

# Install if needed
npm install

# Start dev server
npm run dev
```

Frontend runs on: `http://localhost:5173`

## 🧪 Test the Connection

### 1. Register a New User

1. Go to `http://localhost:5173/login`
2. Click "Sign Up" (add this button if not present)
3. Enter:
   - Email: `test@example.com`
   - Password: `password123` (min 8 chars)
4. Click "Sign In"

### 2. Create Test User (Backend)

If sign-up UI isn't ready, test via curl:

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Response:
```json
{
  "message": "User created successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User"
  }
}
```

### 3. Login

```bash
curl -X POST http://localhost:3000/api/v1/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🤖 About Gemini API Key

### Do You Need It?

**Optional for now** - The AI Assistant page won't work without it, but:
- You can build other features first
- Add Gemini integration later
- Frontend works perfectly without it

### When to Add It

If you want the AI Assistant to work:

1. Get Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env`:
   ```
   VITE_GEMINI_API_KEY=your-api-key-here
   ```
3. Update AI Assistant component to call Gemini

### Recommended: Backend Integration

Better approach - call Gemini from backend:

1. Add to backend `.env`:
   ```
   GEMINI_API_KEY=your-key-here
   ```

2. Create backend endpoint:
   ```bash
   POST /api/v1/ai/chat
   ```

3. Frontend calls backend, backend calls Gemini
   - More secure (no API key in frontend)
   - Can add rate limiting
   - Can log conversations

## 📡 How API Client Works

The API client in `src/lib/api.ts` automatically:
- Stores JWT token in localStorage
- Adds auth token to every request header
- Handles login/signup
- Manages authentication state

### Using API Client

```typescript
import { api } from "@/lib/api";

// Login
await api.login({ email, password });

// Make authenticated requests
const data = await api.get("/transactions");

// Sign out
api.logout();

// Check if authenticated
if (api.isAuthenticated()) {
  // User is logged in
}
```

## 🔄 Complete Flow

```
1. User enters email/password in Login
   ↓
2. Frontend sends to /auth/login
   ↓
3. Backend validates & returns JWT token
   ↓
4. Frontend stores token in localStorage
   ↓
5. API client adds token to all future requests
   ↓
6. Backend validates token for protected routes
   ↓
7. User accesses dashboard
```

## 📝 Next Steps

### Build Sign-Up UI
Create a signup page that calls:
```typescript
const response = await api.signup({
  email,
  password,
  firstName,
  lastName,
});
```

### Connect Dashboard Data
Replace mock data with real backend calls:
```typescript
// In Dashboard.tsx
const { data: transactions } = useQuery({
  queryKey: ["transactions"],
  queryFn: () => api.get("/transactions"),
});
```

### Add Transaction Management
Create routes for:
- `GET /transactions` - List user's transactions
- `POST /transactions` - Create new transaction
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

### Implement File Uploads
```typescript
const formData = new FormData();
formData.append("file", file);
await fetch(`${API_URL}/uploads`, {
  method: "POST",
  headers: { "Authorization": `Bearer ${token}` },
  body: formData,
});
```

## 🐛 Troubleshooting

### "Connection refused"
```bash
# Check backend is running
curl http://localhost:3000/health
# Should respond: {"status":"ok",...}
```

### "Invalid token"
```bash
# Clear browser storage
localStorage.removeItem("nexora.token");
# Then login again
```

### CORS errors
Backend already has CORS configured for `http://localhost:5173`. Check:
```
CORS_ORIGIN=http://localhost:5173
```

### 404 on API calls
- Verify backend URL in `.env`: `VITE_API_URL=http://localhost:3000/api/v1`
- Check route exists in backend
- Verify endpoint path is correct

## 📚 API Endpoints Ready

### Current
- `POST /auth/signup` - Register
- `POST /auth/login` - Login
- `GET /health` - Health check

### To Implement
- Transactions CRUD
- Goals CRUD
- Accounts CRUD
- Payments CRUD
- File uploads

## 🚀 Deployment

When ready to deploy:

1. **Backend** (Vercel)
   ```bash
   cd backends/api-server
   npm run build
   vercel deploy
   ```

2. **Frontend** (Vercel)
   ```bash
   cd artifacts/fintech-dashboard
   # Update .env with production backend URL
   npm run build
   vercel deploy
   ```

3. **Update `.env` variables**
   - Set backend URL to production
   - Add Gemini key if needed
   - Update CORS_ORIGIN in backend

## ✨ You're All Set!

Your frontend and backend are now talking to each other. Start building! 🚀

Need help? Check the backend README or frontend components.
