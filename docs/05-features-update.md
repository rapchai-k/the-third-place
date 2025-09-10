# Features Update Documentation

## Recent Changes (Latest)

### Dark Mode Default
- **Change**: Made dark mode the default theme
- **File Modified**: `src/contexts/ThemeProvider.tsx`
- **Details**: Changed `defaultTheme` from "light" to "dark"

### Community Cards Enhancement
- **Change**: Added community icons to dashboard community cards
- **File Modified**: `src/pages/Dashboard.tsx`
- **Details**: Added Building2 icon from Lucide to each community card in the dashboard

### User Request System
- **New Feature**: Users can now request to create discussions, events, or communities
- **Database**: Created `user_requests` table with RLS policies
- **Components Created**:
  - `src/components/RequestForm.tsx` - Form component for submissions
  - `src/pages/Request.tsx` - Request page wrapper
- **Route Added**: `/request` (protected route)
- **Features**:
  - Form validation with Zod
  - Support for discussion, event, and community requests
  - Contact information collection
  - Admin review system (status tracking)

### Footer and Social Integration
- **New Component**: `src/components/layout/Footer.tsx`
- **Features**:
  - Social media icons (Twitter, Instagram, LinkedIn, GitHub)
  - Backlink to rapchai.com
  - Quick navigation links
  - Contact information
- **Integration**: Added to AppLayout

### Navigation Updates
- **Change**: Added "Make Request" to user navigation
- **Icon**: Plus icon for request feature
- **Accessibility**: Proper ARIA labels for social links

## Database Schema Updates

### user_requests Table
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key to auth.users)
- request_type: TEXT ('discussion', 'event', 'community')
- title: TEXT (Required, min 5 chars)
- description: TEXT (Required, min 20 chars)
- contact_email: TEXT (Required, valid email)
- contact_phone: TEXT (Optional)
- additional_details: JSONB (Optional)
- status: TEXT ('pending', 'reviewing', 'approved', 'rejected')
- created_at, updated_at: TIMESTAMP
- reviewed_by, reviewed_at: For admin use
- admin_notes: TEXT (For admin use)
```

### RLS Policies
- Users can create and view their own requests
- Admins can manage all requests
- Proper data isolation maintained

## SEO and Accessibility
- All new components follow semantic HTML structure
- Proper ARIA labels on interactive elements
- Social links open in new tabs with security attributes
- Responsive design maintained across all components

## Future Considerations
- Admin panel for managing user requests
- Email notifications for request status changes
- Request analytics and reporting
- Bulk request operations for admins