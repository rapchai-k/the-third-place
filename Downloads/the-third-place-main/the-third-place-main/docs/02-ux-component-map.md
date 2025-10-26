# UX / Component Map

## User App (mobile-first)
- `/` ExploreLayout → TagFilterBar, city filter, Events/Communities tabs
- `/events/[id]` EventDetailPage → EventHero, HostChip, CommunityInlineCard, EventActions (Register/Status/Cancel)
- `/communities` CommunitiesIndexPage
- `/communities/[id]` CommunityDetailPage → Join, UpcomingEventsList, PastEventGallery, ActiveDiscussionsList
- `/discussions/[id]` DiscussionThreadPage → Header, CommentComposer (members only), CommentList (paginated)
- `/profile` UserProfilePage → ProfileCard, BadgesGrid, MyCommunitiesList, MyEventsList, NotificationPrefsForm

## Admin (`admin.mythirdplace`)
- `/admin` Dashboard → KPIStats, TrendChart, RecentRegistrationsTable
- `/admin/communities` → CommunityTable, CommunityFormDrawer (create/edit), Delete
- `/admin/events` → EventTable, EventFormDrawer (date/venue/tags/img), HostAssignSelect (members only), Cancel/Delete
- `/admin/discussions` → DiscussionTable, DiscussionFormDrawer, ExtendExpiryAction, VisibilityToggle, CommentsModerationPanel
- `/admin/registrations` → RegistrationsTable, AdminCancelRegistrationAction, ExportCSV
- `/admin/users` → UsersTable, BanUnbanUserAction, UserActivityDrawer
- `/admin/moderation` → FlagsTable, ModerationActions

## API Bindings (examples)
- Register: `POST /user/events/:id/register` → poll `GET /user/events/:id/status`
- Cancel: `DELETE /user/events/:id/registration`
- Comments: `GET /discussions/:id/comments?limit&offset`, `POST /user/discussions/:id/comment`
- Flags: `POST /user/comments/:id/flag`
