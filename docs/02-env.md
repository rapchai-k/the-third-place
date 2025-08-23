Set in Supabase/Lovable env, not in repo:
- SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY
- GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET (Supabase Auth → Google provider)
- CASHFREE_APP_ID, CASHFREE_SECRET_KEY (sandbox/prod)
- RESEND_API_KEY (for automated email notifications)
- EMAIL/WA/SMS provider keys (when enabled)

## Email Service Configuration

### Resend API Setup
The application uses Resend for automated email delivery. To enable email functionality:

1. **Create Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Generate API Key**: Create an API key in your Resend dashboard
3. **Set Environment Variable**: Add `RESEND_API_KEY` to your Supabase environment variables
4. **Domain Configuration**: Configure your sending domain in Resend (optional, defaults to resend.dev)

### Email Features
- **Welcome Emails**: Automatically sent to new users upon signup
- **Event Reminders**: Sent to registered users before events (future feature)
- **Notification Emails**: For community updates and discussions (future feature)

### Email Delivery Tracking
All emails are logged in the `email_logs` table with:
- Delivery status (sent, failed, pending)
- Message IDs for tracking
- Error messages for debugging
- Timestamps for analytics

### Testing Email Delivery
1. Ensure `RESEND_API_KEY` is set in Supabase environment
2. Create a new user account
3. Check the `email_logs` table for delivery status
4. Verify email receipt in the user's inbox

### Troubleshooting
- Check Supabase function logs for email service errors
- Verify Resend API key is valid and has sending permissions
- Ensure email templates render correctly across email clients
- Monitor `email_logs` table for failed deliveries

