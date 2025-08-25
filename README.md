# The Third Place

A community-driven platform for discovering and connecting with local third places - those essential social spaces beyond home and work where communities thrive.

## Features

- 🏘️ **Community Discovery** - Find and join local communities
- 📅 **Event Management** - Create and participate in community events  
- 💬 **Discussions** - Engage in meaningful conversations
- 🔐 **Authentication** - Secure user accounts with Google OAuth
- 🌙 **Dark/Light Mode** - Responsive theme switching
- 📱 **Mobile-First Design** - Optimized for all devices

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Testing**: Vitest, React Testing Library
- **Build**: Vite
- **Deployment**: Vercel

## Development Setup

1. **Clone and install dependencies**
   ```bash
   git clone <repo-url>
   cd the-third-place
   npm install
   ```

2. **Environment Setup**
   - Supabase project is pre-configured
   - Google OAuth requires setup in Supabase dashboard

3. **Start development server**
   ```bash
   npm run dev
   ```

## Testing

This project follows a comprehensive testing strategy with **mandatory test validation before commits**.

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode  
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Comprehensive pre-commit test
node src/scripts/test.js
```

### Test Requirements

**🚨 ALL CHANGES MUST PASS TESTS BEFORE COMMIT:**

1. ✅ TypeScript compilation (`npx tsc --noEmit`)
2. ✅ ESLint checks (`npm run lint`)
3. ✅ Unit test suite (`npx vitest run`)
4. ✅ Build verification (`npm run build`)

Run `node src/scripts/test.js` before every commit to ensure all validations pass.

### Test Types

- **Unit Tests**: Component logic, auth context, protected routes
- **Integration Tests**: Component interactions, API calls
- **E2E Tests**: Critical user flows (planned)

### Writing Tests

Create tests in `__tests__` folders next to components:

```
src/
  components/
    MyComponent.tsx
    __tests__/
      MyComponent.test.tsx
```

## Database Schema

The app uses Supabase with comprehensive Row Level Security (RLS) policies:

- **users** - User profiles and roles
- **communities** - Community information  
- **events** - Community events
- **discussions** - Forum-style discussions
- **user_activity_log** - Activity tracking

## Authentication

- Email/password authentication
- Google OAuth (requires configuration)
- Protected routes with automatic redirects
- Role-based access control

## Google OAuth Setup

To enable Google authentication:

1. Go to [Supabase Dashboard > Authentication > Providers](https://supabase.com/dashboard/project/ggochdssgkfnvcrrmtlp/auth/providers)
2. Enable Google provider
3. Configure Google Cloud Console OAuth credentials
4. Set Site URL and Redirect URLs in Authentication > URL Configuration

## Contributing

1. Create feature branch
2. Write tests for new functionality
3. **REQUIRED**: Ensure all tests pass with `node src/scripts/test.js`
4. Submit pull request

## Architecture Principles

- **Security First**: RLS policies on all tables
- **Type Safety**: Full TypeScript coverage
- **Test-Driven**: Tests required for all features
- **Mobile-First**: Responsive design patterns
- **Accessibility**: WCAG 2.1 AA compliance

## Deployment

The app is deployed on Vercel with automatic deployments from the main branch.

## Email System

Automated welcome emails are sent to new users on signup.
- Flow: Auth user created -> DB trigger -> welcome-email-trigger -> send-email (Resend)
- Template: supabase/functions/shared/email-templates.ts (generateWelcomeEmailTemplate)
- Sender: onboarding@rapchai.com (verified in Resend)

Monitoring:
- Supabase Functions Dashboard: https://supabase.com/dashboard/project/ggochdssgkfnvcrrmtlp/functions
- Check email_logs table for delivery status and message IDs

Troubleshooting:
- Resend API errors: ensure verified sender domain and valid RESEND_API_KEY
- Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY must be set in Supabase
- Delivery failures: inspect email_logs.error_message and provider dashboard (Resend Activity)

## Project URL

**Lovable Project**: https://lovable.dev/projects/99bdd782-1d5e-4414-8dcc-7b9b24d22ad7

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review the testing documentation
3. Create a new issue with reproduction steps
