# RiderFlow - Equipment Training & Installation Management System

## 🚨 Crash Prevention Features

This application includes comprehensive crash prevention measures to ensure stability and prevent context-related errors.

### Built-in Safety Features

1. **Error Boundaries**: Every component is wrapped in error boundaries that catch and handle crashes gracefully
2. **Context Validation**: Automatic validation of required context providers with detailed error messages
3. **Safe Components**: Individual component isolation to prevent cascading failures
4. **Detailed Error Reporting**: Developer-friendly error messages with fix suggestions

### Context Provider Dependencies

**AuthProvider** is required by:
- Sidebar (for user role filtering)
- Header (for user info, signOut)
- QuickActions (for role-based actions)
- LoginForm (for signIn)
- Dashboard, Users, Reports, Equipment, Training, Installation

**ProjectProvider** is required by:
- Header (for project selector)
- DynamicRiders, Upload, Training, Installation, Equipment
- ProjectSelector

### Error Prevention Guidelines

1. **Never remove context providers** without checking all dependent components
2. **Always test the app** after modifying provider structure
3. **Check console logs** for dependency warnings in development mode
4. **Use SafeComponent wrapper** for new components that might crash

### Development Mode Features

- Automatic dependency logging on app start
- Enhanced error messages with fix suggestions
- Component crash isolation
- Detailed error stack traces

### If You Encounter Crashes

1. **Check the error boundary message** - it will tell you exactly what's wrong
2. **Look for missing context providers** in the error details
3. **Use the "Reload Application" button** to recover from crashes
4. **Check the console** for detailed debugging information

## Quick Start

1. Add your Supabase credentials to `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. The app will automatically validate all context providers and show any issues

## Architecture

The app uses a layered architecture with crash prevention at every level:

```
ErrorBoundary (Global)
├── SafeComponent (AuthProvider)
│   ├── SafeComponent (ProjectProvider)
│   │   ├── SafeComponent (Router)
│   │   │   └── SafeComponent (Layout)
│   │   │       └── SafeComponent (Routes)
│   │   │           └── SafeComponent (Individual Pages)
```

This ensures that if any component crashes, it's isolated and doesn't bring down the entire application.

## Features

- **Dynamic Rider Management**: Upload and manage rider data with flexible schemas
- **Training Scheduling**: Schedule and track training sessions
- **Box Installation**: Manage installation appointments
- **Equipment Distribution**: Track equipment allocation
- **User Management**: Role-based access control
- **Reports & Analytics**: Comprehensive reporting system
- **Audit Logging**: Track all system changes

## Safety First

This application prioritizes stability and user experience. Every component is designed to fail gracefully and provide clear recovery options.