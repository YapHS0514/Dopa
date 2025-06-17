# MicroLearn - Fullstack Application

A modern microlearning platform with React Native Expo frontend and FastAPI backend.

## Project Structure

```
├── frontend/          # React Native Expo app
├── backend/           # FastAPI server
├── supabase/         # Database migrations
└── package.json      # Root package.json for scripts
```

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd microlearn-fullstack

# Install all dependencies
npm run install-all
```

### 2. Environment Variables

#### Frontend (.env in frontend/)

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://localhost:8000
```

#### Backend (.env in backend/)

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Database Setup

Make sure you have Supabase CLI installed:

```bash
npm install -g @supabase/cli
```

Run the migration to create tables:

```bash
npm run migrate
```

### 4. Development

Start both frontend and backend:

```bash
npm install concurrently --save-dev
npm run dev
```

Or run them separately:

```bash
# Backend only
npm run backend

# Frontend only
npm run frontend
```

### 5. Setting up SDK for development

Download and install an Android SDK here: https://developer.android.com/studio

Set up your environment variables as follows:

- Under User Variables, add:

  - Name: ANDROID_HOME
  - Value: C:\Users\<your_user_name>\AppData\Local\Android\SDK

- Edit the Path Variable under User Variables and add:
  - C:\Users\<your_user_name>\AppData\Local\Android\SDK\platform-tools
  - C:\Users\<your_user_name>\AppData\Local\Android\SDK\emulator

Boot up Android Studio
Create a new device
Finish the set up and run the emulator

### 6. Running the app on SDK

After performing npm run frontend, press 'a' once in your IDE terminal, it will open Android and automatically connect to your active Android SDK

## API Endpoints

### Authentication

- All endpoints require Bearer token authentication
- Use Supabase auth tokens

### Content

- `GET /api/contents` - Get paginated content
- `POST /api/contents` - Create new content
- `GET /api/recommendations` - Get personalized recommendations

### Interactions

- `POST /api/interactions` - Record user interaction
- `GET /api/interactions/stats` - Get user statistics

### Topics

- `GET /api/topics` - Get all topics
- `GET /api/user/preferences` - Get user preferences
- `POST /api/user/preferences` - Update preferences

### Saved Content

- `GET /api/saved` - Get saved content
- `POST /api/saved` - Save content
- `DELETE /api/saved/{id}` - Remove saved content

## Development Workflow

### Local Development

1. Make sure both frontend and backend are running
2. Frontend runs on Expo (check terminal for URL/QR code)
3. Backend runs on http://localhost:8000
4. API documentation available at http://localhost:8000/docs

### Database Changes

1. Create new migration files in `supabase/migrations/`
2. Run `npm run migrate` to apply changes
3. Test changes in your application

### Adding New Features

1. Update backend API endpoints in `backend/main.py`
2. Update frontend API client in `frontend/lib/api.ts`
3. Create/update React Native components as needed

## Features

- 🔐 Supabase Authentication
- 📱 React Native Expo Frontend
- 🚀 FastAPI Backend
- 🗄️ PostgreSQL Database
- 🎯 Personalized Recommendations
- 💾 Content Saving
- 📊 User Analytics
- 🎨 Beautiful UI/UX

## Tech Stack

### Frontend

- React Native with Expo
- Expo Router for navigation
- Supabase for authentication
- React Native Reanimated for animations
- Lucide React Native for icons

### Backend

- FastAPI
- Supabase Python client
- Pydantic for data validation
- Uvicorn ASGI server

### Database

- PostgreSQL (via Supabase)
- Row Level Security (RLS)
- Real-time subscriptions

## Deployment

### Frontend (Expo)

```bash
cd frontend
expo build:web
```

### Backend (FastAPI)

Deploy to platforms like Railway, Render, or Heroku:

```bash
cd backend
# Follow your deployment platform's instructions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
