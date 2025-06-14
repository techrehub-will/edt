# Profile Management System

A comprehensive user profile management system for the Engineering Development Tracker that allows users to maintain their personal and professional information.

## Features

### 🧑‍💼 **Personal Information Management**

- **Full Name & Contact Details**: Name, email, phone, location
- **Professional Info**: Job title, company, experience level
- **Bio & Specializations**: Personal bio and technical specializations
- **Social Links**: LinkedIn and GitHub profile links

### ⚙️ **Account Settings**

- **Notification Preferences**: Push notifications, email notifications, weekly digest
- **AI Features**: Enable/disable AI insights and recommendations
- **Localization**: Timezone and language preferences
- **Theme**: Dark/light mode preferences

### 🔐 **Security & Privacy**

- **User Authentication**: Secure user authentication via Supabase
- **Row Level Security**: Database-level security policies
- **Data Validation**: Client and server-side validation
- **Demo Mode Support**: Works with both authenticated and demo users

## Database Schema

### User Profiles Table

```sql
user_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  bio TEXT,
  title TEXT,
  company TEXT,
  location TEXT,
  experience_level TEXT,
  specializations TEXT[],
  linkedin_url TEXT,
  github_url TEXT,
  phone TEXT,
  timezone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### User Settings Table

```sql
user_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  notifications_enabled BOOLEAN,
  email_notifications BOOLEAN,
  dark_mode BOOLEAN,
  timezone TEXT,
  language TEXT,
  weekly_digest BOOLEAN,
  ai_insights_enabled BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

## API Endpoints

### Profile Management

- `GET /api/profile` - Fetch user profile
- `PUT /api/profile` - Update user profile

### Settings Management

- Database operations handled directly through Supabase client

## Components

### Profile Components

- **ProfileForm** (`/components/profile/profile-form.tsx`)
  - Personal information form
  - Professional details
  - Specializations management
  - Social links

### Settings Components

- **SettingsForm** (`/components/settings/settings-form.tsx`)
  - Notification preferences
  - AI feature toggles
  - Localization settings
  - Theme preferences

### Navigation Integration

- **UserNav** (`/components/user-nav.tsx`)

  - Profile and settings links in user dropdown
  - Demo mode indicators

- **Sidebar** (`/components/sidebar.tsx`)
  - Profile and settings navigation items
  - Active state management

## Pages

### Profile Page (`/dashboard/profile`)

- Complete profile management interface
- Personal and professional information
- Specializations and social links
- Real-time validation and saving

### Settings Page (`/dashboard/settings`)

- Account preferences and settings
- Notification management
- AI feature configuration
- Localization options

## Key Features

### 💾 **Data Persistence**

- **Automatic Saving**: Real-time profile updates
- **Optimistic Updates**: Immediate UI feedback
- **Error Handling**: Comprehensive error management
- **Validation**: Client and server-side validation

### 🎨 **User Experience**

- **Responsive Design**: Mobile-friendly interface
- **Loading States**: Visual feedback during operations
- **Toast Notifications**: Success and error messages
- **Demo Mode**: Functional preview without authentication

### 🛡️ **Security**

- **Authentication Required**: Secure access control
- **Data Sanitization**: Input validation and sanitization
- **Row Level Security**: Database-level security policies
- **CORS Protection**: API endpoint security

## Usage

### Accessing Profile Management

1. Sign in to the application
2. Click on your avatar in the top-right corner
3. Select "Profile" or "Settings" from the dropdown
4. Or use the sidebar navigation

### Managing Profile Information

1. Navigate to `/dashboard/profile`
2. Update personal information (name, title, company, etc.)
3. Add specializations by typing and clicking "Add"
4. Remove specializations by clicking the × on badges
5. Click "Save Profile" to persist changes

### Configuring Settings

1. Navigate to `/dashboard/settings`
2. Toggle notification preferences
3. Enable/disable AI features
4. Set timezone and language preferences
5. Click "Save Settings" to apply changes

## Demo Mode

The profile management system fully supports demo mode:

- **Profile**: Shows sample engineer profile data
- **Settings**: Displays default preferences
- **Saving**: Simulates save operations with toast notifications
- **Navigation**: Full navigation functionality

## Technical Implementation

### State Management

- React hooks for local state management
- Supabase real-time subscriptions for data sync
- Optimistic updates for better UX

### Validation

- Client-side validation using form validation
- Server-side validation in API routes
- Database constraints for data integrity

### Error Handling

- Try-catch blocks in all async operations
- User-friendly error messages
- Fallback to demo mode when appropriate

## Installation & Setup

1. **Database Setup**: Run the user profiles schema

   ```bash
   psql -f scripts/user-profiles-schema.sql
   ```

2. **Environment Variables**: No additional variables required

3. **Dependencies**: All dependencies included in existing package.json

## Future Enhancements

- **Avatar Upload**: Profile picture management
- **Export Data**: Profile data export functionality
- **Privacy Controls**: Advanced privacy settings
- **Team Profiles**: Company/team profile management
- **Integration Settings**: Third-party service configurations
