create type "public"."app_role" as enum ('admin', 'moderator', 'community_manager', 'event_organizer', 'user');

create type "public"."flag_status" as enum ('open', 'resolved', 'urgent');

drop policy "Users can view community members" on "public"."community_members";

drop policy "Anyone can view comments on visible discussions" on "public"."discussion_comments";

drop policy "Anyone can view visible discussions" on "public"."discussions";

drop policy "Users can register for events" on "public"."event_registrations";

drop policy "Users can update own profile and admins can update all" on "public"."users";

drop policy "Users can update own whatsapp_number" on "public"."users";

drop policy "Service can insert email logs" on "public"."email_logs";

drop policy "Service can update email logs" on "public"."email_logs";

drop policy "Service can insert preferences" on "public"."notification_preferences";

drop policy "Service can insert payment logs" on "public"."payment_logs";

drop policy "Service can update payment sessions" on "public"."payment_sessions";

drop policy "Service can create referrals" on "public"."referrals";

drop policy "Service can log activity" on "public"."user_activity_log";

revoke delete on table "public"."communities" from "anon";

revoke insert on table "public"."communities" from "anon";

revoke references on table "public"."communities" from "anon";

revoke select on table "public"."communities" from "anon";

revoke trigger on table "public"."communities" from "anon";

revoke truncate on table "public"."communities" from "anon";

revoke update on table "public"."communities" from "anon";

revoke delete on table "public"."communities" from "authenticated";

revoke insert on table "public"."communities" from "authenticated";

revoke references on table "public"."communities" from "authenticated";

revoke select on table "public"."communities" from "authenticated";

revoke trigger on table "public"."communities" from "authenticated";

revoke truncate on table "public"."communities" from "authenticated";

revoke update on table "public"."communities" from "authenticated";

revoke delete on table "public"."communities" from "service_role";

revoke insert on table "public"."communities" from "service_role";

revoke references on table "public"."communities" from "service_role";

revoke select on table "public"."communities" from "service_role";

revoke trigger on table "public"."communities" from "service_role";

revoke truncate on table "public"."communities" from "service_role";

revoke update on table "public"."communities" from "service_role";

revoke delete on table "public"."community_members" from "anon";

revoke insert on table "public"."community_members" from "anon";

revoke references on table "public"."community_members" from "anon";

revoke select on table "public"."community_members" from "anon";

revoke trigger on table "public"."community_members" from "anon";

revoke truncate on table "public"."community_members" from "anon";

revoke update on table "public"."community_members" from "anon";

revoke delete on table "public"."community_members" from "authenticated";

revoke insert on table "public"."community_members" from "authenticated";

revoke references on table "public"."community_members" from "authenticated";

revoke select on table "public"."community_members" from "authenticated";

revoke trigger on table "public"."community_members" from "authenticated";

revoke truncate on table "public"."community_members" from "authenticated";

revoke update on table "public"."community_members" from "authenticated";

revoke delete on table "public"."community_members" from "service_role";

revoke insert on table "public"."community_members" from "service_role";

revoke references on table "public"."community_members" from "service_role";

revoke select on table "public"."community_members" from "service_role";

revoke trigger on table "public"."community_members" from "service_role";

revoke truncate on table "public"."community_members" from "service_role";

revoke update on table "public"."community_members" from "service_role";

revoke delete on table "public"."discussion_comments" from "anon";

revoke insert on table "public"."discussion_comments" from "anon";

revoke references on table "public"."discussion_comments" from "anon";

revoke select on table "public"."discussion_comments" from "anon";

revoke trigger on table "public"."discussion_comments" from "anon";

revoke truncate on table "public"."discussion_comments" from "anon";

revoke update on table "public"."discussion_comments" from "anon";

revoke delete on table "public"."discussion_comments" from "authenticated";

revoke insert on table "public"."discussion_comments" from "authenticated";

revoke references on table "public"."discussion_comments" from "authenticated";

revoke select on table "public"."discussion_comments" from "authenticated";

revoke trigger on table "public"."discussion_comments" from "authenticated";

revoke truncate on table "public"."discussion_comments" from "authenticated";

revoke update on table "public"."discussion_comments" from "authenticated";

revoke delete on table "public"."discussion_comments" from "service_role";

revoke insert on table "public"."discussion_comments" from "service_role";

revoke references on table "public"."discussion_comments" from "service_role";

revoke select on table "public"."discussion_comments" from "service_role";

revoke trigger on table "public"."discussion_comments" from "service_role";

revoke truncate on table "public"."discussion_comments" from "service_role";

revoke update on table "public"."discussion_comments" from "service_role";

revoke delete on table "public"."discussions" from "anon";

revoke insert on table "public"."discussions" from "anon";

revoke references on table "public"."discussions" from "anon";

revoke select on table "public"."discussions" from "anon";

revoke trigger on table "public"."discussions" from "anon";

revoke truncate on table "public"."discussions" from "anon";

revoke update on table "public"."discussions" from "anon";

revoke delete on table "public"."discussions" from "authenticated";

revoke insert on table "public"."discussions" from "authenticated";

revoke references on table "public"."discussions" from "authenticated";

revoke select on table "public"."discussions" from "authenticated";

revoke trigger on table "public"."discussions" from "authenticated";

revoke truncate on table "public"."discussions" from "authenticated";

revoke update on table "public"."discussions" from "authenticated";

revoke delete on table "public"."discussions" from "service_role";

revoke insert on table "public"."discussions" from "service_role";

revoke references on table "public"."discussions" from "service_role";

revoke select on table "public"."discussions" from "service_role";

revoke trigger on table "public"."discussions" from "service_role";

revoke truncate on table "public"."discussions" from "service_role";

revoke update on table "public"."discussions" from "service_role";

revoke delete on table "public"."email_logs" from "anon";

revoke insert on table "public"."email_logs" from "anon";

revoke references on table "public"."email_logs" from "anon";

revoke select on table "public"."email_logs" from "anon";

revoke trigger on table "public"."email_logs" from "anon";

revoke truncate on table "public"."email_logs" from "anon";

revoke update on table "public"."email_logs" from "anon";

revoke delete on table "public"."email_logs" from "authenticated";

revoke insert on table "public"."email_logs" from "authenticated";

revoke references on table "public"."email_logs" from "authenticated";

revoke select on table "public"."email_logs" from "authenticated";

revoke trigger on table "public"."email_logs" from "authenticated";

revoke truncate on table "public"."email_logs" from "authenticated";

revoke update on table "public"."email_logs" from "authenticated";

revoke delete on table "public"."email_logs" from "service_role";

revoke insert on table "public"."email_logs" from "service_role";

revoke references on table "public"."email_logs" from "service_role";

revoke select on table "public"."email_logs" from "service_role";

revoke trigger on table "public"."email_logs" from "service_role";

revoke truncate on table "public"."email_logs" from "service_role";

revoke update on table "public"."email_logs" from "service_role";

revoke delete on table "public"."email_templates" from "anon";

revoke insert on table "public"."email_templates" from "anon";

revoke references on table "public"."email_templates" from "anon";

revoke select on table "public"."email_templates" from "anon";

revoke trigger on table "public"."email_templates" from "anon";

revoke truncate on table "public"."email_templates" from "anon";

revoke update on table "public"."email_templates" from "anon";

revoke delete on table "public"."email_templates" from "authenticated";

revoke insert on table "public"."email_templates" from "authenticated";

revoke references on table "public"."email_templates" from "authenticated";

revoke select on table "public"."email_templates" from "authenticated";

revoke trigger on table "public"."email_templates" from "authenticated";

revoke truncate on table "public"."email_templates" from "authenticated";

revoke update on table "public"."email_templates" from "authenticated";

revoke delete on table "public"."email_templates" from "service_role";

revoke insert on table "public"."email_templates" from "service_role";

revoke references on table "public"."email_templates" from "service_role";

revoke select on table "public"."email_templates" from "service_role";

revoke trigger on table "public"."email_templates" from "service_role";

revoke truncate on table "public"."email_templates" from "service_role";

revoke update on table "public"."email_templates" from "service_role";

revoke delete on table "public"."event_registrations" from "anon";

revoke insert on table "public"."event_registrations" from "anon";

revoke references on table "public"."event_registrations" from "anon";

revoke select on table "public"."event_registrations" from "anon";

revoke trigger on table "public"."event_registrations" from "anon";

revoke truncate on table "public"."event_registrations" from "anon";

revoke update on table "public"."event_registrations" from "anon";

revoke delete on table "public"."event_registrations" from "authenticated";

revoke insert on table "public"."event_registrations" from "authenticated";

revoke references on table "public"."event_registrations" from "authenticated";

revoke select on table "public"."event_registrations" from "authenticated";

revoke trigger on table "public"."event_registrations" from "authenticated";

revoke truncate on table "public"."event_registrations" from "authenticated";

revoke update on table "public"."event_registrations" from "authenticated";

revoke delete on table "public"."event_registrations" from "service_role";

revoke insert on table "public"."event_registrations" from "service_role";

revoke references on table "public"."event_registrations" from "service_role";

revoke select on table "public"."event_registrations" from "service_role";

revoke trigger on table "public"."event_registrations" from "service_role";

revoke truncate on table "public"."event_registrations" from "service_role";

revoke update on table "public"."event_registrations" from "service_role";

revoke delete on table "public"."event_tags" from "anon";

revoke insert on table "public"."event_tags" from "anon";

revoke references on table "public"."event_tags" from "anon";

revoke select on table "public"."event_tags" from "anon";

revoke trigger on table "public"."event_tags" from "anon";

revoke truncate on table "public"."event_tags" from "anon";

revoke update on table "public"."event_tags" from "anon";

revoke delete on table "public"."event_tags" from "authenticated";

revoke insert on table "public"."event_tags" from "authenticated";

revoke references on table "public"."event_tags" from "authenticated";

revoke select on table "public"."event_tags" from "authenticated";

revoke trigger on table "public"."event_tags" from "authenticated";

revoke truncate on table "public"."event_tags" from "authenticated";

revoke update on table "public"."event_tags" from "authenticated";

revoke delete on table "public"."event_tags" from "service_role";

revoke insert on table "public"."event_tags" from "service_role";

revoke references on table "public"."event_tags" from "service_role";

revoke select on table "public"."event_tags" from "service_role";

revoke trigger on table "public"."event_tags" from "service_role";

revoke truncate on table "public"."event_tags" from "service_role";

revoke update on table "public"."event_tags" from "service_role";

revoke delete on table "public"."events" from "anon";

revoke insert on table "public"."events" from "anon";

revoke references on table "public"."events" from "anon";

revoke select on table "public"."events" from "anon";

revoke trigger on table "public"."events" from "anon";

revoke truncate on table "public"."events" from "anon";

revoke update on table "public"."events" from "anon";

revoke delete on table "public"."events" from "authenticated";

revoke insert on table "public"."events" from "authenticated";

revoke references on table "public"."events" from "authenticated";

revoke select on table "public"."events" from "authenticated";

revoke trigger on table "public"."events" from "authenticated";

revoke truncate on table "public"."events" from "authenticated";

revoke update on table "public"."events" from "authenticated";

revoke delete on table "public"."events" from "service_role";

revoke insert on table "public"."events" from "service_role";

revoke references on table "public"."events" from "service_role";

revoke select on table "public"."events" from "service_role";

revoke trigger on table "public"."events" from "service_role";

revoke truncate on table "public"."events" from "service_role";

revoke update on table "public"."events" from "service_role";

revoke delete on table "public"."flags" from "anon";

revoke insert on table "public"."flags" from "anon";

revoke references on table "public"."flags" from "anon";

revoke select on table "public"."flags" from "anon";

revoke trigger on table "public"."flags" from "anon";

revoke truncate on table "public"."flags" from "anon";

revoke update on table "public"."flags" from "anon";

revoke delete on table "public"."flags" from "authenticated";

revoke insert on table "public"."flags" from "authenticated";

revoke references on table "public"."flags" from "authenticated";

revoke select on table "public"."flags" from "authenticated";

revoke trigger on table "public"."flags" from "authenticated";

revoke truncate on table "public"."flags" from "authenticated";

revoke update on table "public"."flags" from "authenticated";

revoke delete on table "public"."flags" from "service_role";

revoke insert on table "public"."flags" from "service_role";

revoke references on table "public"."flags" from "service_role";

revoke select on table "public"."flags" from "service_role";

revoke trigger on table "public"."flags" from "service_role";

revoke truncate on table "public"."flags" from "service_role";

revoke update on table "public"."flags" from "service_role";

revoke delete on table "public"."notification_preferences" from "anon";

revoke insert on table "public"."notification_preferences" from "anon";

revoke references on table "public"."notification_preferences" from "anon";

revoke select on table "public"."notification_preferences" from "anon";

revoke trigger on table "public"."notification_preferences" from "anon";

revoke truncate on table "public"."notification_preferences" from "anon";

revoke update on table "public"."notification_preferences" from "anon";

revoke delete on table "public"."notification_preferences" from "authenticated";

revoke insert on table "public"."notification_preferences" from "authenticated";

revoke references on table "public"."notification_preferences" from "authenticated";

revoke select on table "public"."notification_preferences" from "authenticated";

revoke trigger on table "public"."notification_preferences" from "authenticated";

revoke truncate on table "public"."notification_preferences" from "authenticated";

revoke update on table "public"."notification_preferences" from "authenticated";

revoke delete on table "public"."notification_preferences" from "service_role";

revoke insert on table "public"."notification_preferences" from "service_role";

revoke references on table "public"."notification_preferences" from "service_role";

revoke select on table "public"."notification_preferences" from "service_role";

revoke trigger on table "public"."notification_preferences" from "service_role";

revoke truncate on table "public"."notification_preferences" from "service_role";

revoke update on table "public"."notification_preferences" from "service_role";

revoke delete on table "public"."payment_logs" from "anon";

revoke insert on table "public"."payment_logs" from "anon";

revoke references on table "public"."payment_logs" from "anon";

revoke select on table "public"."payment_logs" from "anon";

revoke trigger on table "public"."payment_logs" from "anon";

revoke truncate on table "public"."payment_logs" from "anon";

revoke update on table "public"."payment_logs" from "anon";

revoke delete on table "public"."payment_logs" from "authenticated";

revoke insert on table "public"."payment_logs" from "authenticated";

revoke references on table "public"."payment_logs" from "authenticated";

revoke select on table "public"."payment_logs" from "authenticated";

revoke trigger on table "public"."payment_logs" from "authenticated";

revoke truncate on table "public"."payment_logs" from "authenticated";

revoke update on table "public"."payment_logs" from "authenticated";

revoke delete on table "public"."payment_logs" from "service_role";

revoke insert on table "public"."payment_logs" from "service_role";

revoke references on table "public"."payment_logs" from "service_role";

revoke select on table "public"."payment_logs" from "service_role";

revoke trigger on table "public"."payment_logs" from "service_role";

revoke truncate on table "public"."payment_logs" from "service_role";

revoke update on table "public"."payment_logs" from "service_role";

revoke delete on table "public"."payment_sessions" from "anon";

revoke insert on table "public"."payment_sessions" from "anon";

revoke references on table "public"."payment_sessions" from "anon";

revoke select on table "public"."payment_sessions" from "anon";

revoke trigger on table "public"."payment_sessions" from "anon";

revoke truncate on table "public"."payment_sessions" from "anon";

revoke update on table "public"."payment_sessions" from "anon";

revoke delete on table "public"."payment_sessions" from "authenticated";

revoke insert on table "public"."payment_sessions" from "authenticated";

revoke references on table "public"."payment_sessions" from "authenticated";

revoke select on table "public"."payment_sessions" from "authenticated";

revoke trigger on table "public"."payment_sessions" from "authenticated";

revoke truncate on table "public"."payment_sessions" from "authenticated";

revoke update on table "public"."payment_sessions" from "authenticated";

revoke delete on table "public"."payment_sessions" from "service_role";

revoke insert on table "public"."payment_sessions" from "service_role";

revoke references on table "public"."payment_sessions" from "service_role";

revoke select on table "public"."payment_sessions" from "service_role";

revoke trigger on table "public"."payment_sessions" from "service_role";

revoke truncate on table "public"."payment_sessions" from "service_role";

revoke update on table "public"."payment_sessions" from "service_role";

revoke delete on table "public"."referrals" from "anon";

revoke insert on table "public"."referrals" from "anon";

revoke references on table "public"."referrals" from "anon";

revoke select on table "public"."referrals" from "anon";

revoke trigger on table "public"."referrals" from "anon";

revoke truncate on table "public"."referrals" from "anon";

revoke update on table "public"."referrals" from "anon";

revoke delete on table "public"."referrals" from "authenticated";

revoke insert on table "public"."referrals" from "authenticated";

revoke references on table "public"."referrals" from "authenticated";

revoke select on table "public"."referrals" from "authenticated";

revoke trigger on table "public"."referrals" from "authenticated";

revoke truncate on table "public"."referrals" from "authenticated";

revoke update on table "public"."referrals" from "authenticated";

revoke delete on table "public"."referrals" from "service_role";

revoke insert on table "public"."referrals" from "service_role";

revoke references on table "public"."referrals" from "service_role";

revoke select on table "public"."referrals" from "service_role";

revoke trigger on table "public"."referrals" from "service_role";

revoke truncate on table "public"."referrals" from "service_role";

revoke update on table "public"."referrals" from "service_role";

revoke delete on table "public"."tags" from "anon";

revoke insert on table "public"."tags" from "anon";

revoke references on table "public"."tags" from "anon";

revoke select on table "public"."tags" from "anon";

revoke trigger on table "public"."tags" from "anon";

revoke truncate on table "public"."tags" from "anon";

revoke update on table "public"."tags" from "anon";

revoke delete on table "public"."tags" from "authenticated";

revoke insert on table "public"."tags" from "authenticated";

revoke references on table "public"."tags" from "authenticated";

revoke select on table "public"."tags" from "authenticated";

revoke trigger on table "public"."tags" from "authenticated";

revoke truncate on table "public"."tags" from "authenticated";

revoke update on table "public"."tags" from "authenticated";

revoke delete on table "public"."tags" from "service_role";

revoke insert on table "public"."tags" from "service_role";

revoke references on table "public"."tags" from "service_role";

revoke select on table "public"."tags" from "service_role";

revoke trigger on table "public"."tags" from "service_role";

revoke truncate on table "public"."tags" from "service_role";

revoke update on table "public"."tags" from "service_role";

revoke delete on table "public"."user_activity_log" from "anon";

revoke insert on table "public"."user_activity_log" from "anon";

revoke references on table "public"."user_activity_log" from "anon";

revoke select on table "public"."user_activity_log" from "anon";

revoke trigger on table "public"."user_activity_log" from "anon";

revoke truncate on table "public"."user_activity_log" from "anon";

revoke update on table "public"."user_activity_log" from "anon";

revoke delete on table "public"."user_activity_log" from "authenticated";

revoke insert on table "public"."user_activity_log" from "authenticated";

revoke references on table "public"."user_activity_log" from "authenticated";

revoke select on table "public"."user_activity_log" from "authenticated";

revoke trigger on table "public"."user_activity_log" from "authenticated";

revoke truncate on table "public"."user_activity_log" from "authenticated";

revoke update on table "public"."user_activity_log" from "authenticated";

revoke delete on table "public"."user_activity_log" from "service_role";

revoke insert on table "public"."user_activity_log" from "service_role";

revoke references on table "public"."user_activity_log" from "service_role";

revoke select on table "public"."user_activity_log" from "service_role";

revoke trigger on table "public"."user_activity_log" from "service_role";

revoke truncate on table "public"."user_activity_log" from "service_role";

revoke update on table "public"."user_activity_log" from "service_role";

revoke delete on table "public"."user_badges" from "anon";

revoke insert on table "public"."user_badges" from "anon";

revoke references on table "public"."user_badges" from "anon";

revoke select on table "public"."user_badges" from "anon";

revoke trigger on table "public"."user_badges" from "anon";

revoke truncate on table "public"."user_badges" from "anon";

revoke update on table "public"."user_badges" from "anon";

revoke delete on table "public"."user_badges" from "authenticated";

revoke insert on table "public"."user_badges" from "authenticated";

revoke references on table "public"."user_badges" from "authenticated";

revoke select on table "public"."user_badges" from "authenticated";

revoke trigger on table "public"."user_badges" from "authenticated";

revoke truncate on table "public"."user_badges" from "authenticated";

revoke update on table "public"."user_badges" from "authenticated";

revoke delete on table "public"."user_badges" from "service_role";

revoke insert on table "public"."user_badges" from "service_role";

revoke references on table "public"."user_badges" from "service_role";

revoke select on table "public"."user_badges" from "service_role";

revoke trigger on table "public"."user_badges" from "service_role";

revoke truncate on table "public"."user_badges" from "service_role";

revoke update on table "public"."user_badges" from "service_role";

revoke delete on table "public"."users" from "anon";

revoke insert on table "public"."users" from "anon";

revoke references on table "public"."users" from "anon";

revoke select on table "public"."users" from "anon";

revoke trigger on table "public"."users" from "anon";

revoke truncate on table "public"."users" from "anon";

revoke update on table "public"."users" from "anon";

revoke delete on table "public"."users" from "authenticated";

revoke insert on table "public"."users" from "authenticated";

revoke references on table "public"."users" from "authenticated";

revoke select on table "public"."users" from "authenticated";

revoke trigger on table "public"."users" from "authenticated";

revoke truncate on table "public"."users" from "authenticated";

revoke update on table "public"."users" from "authenticated";

revoke delete on table "public"."users" from "service_role";

revoke insert on table "public"."users" from "service_role";

revoke references on table "public"."users" from "service_role";

revoke select on table "public"."users" from "service_role";

revoke trigger on table "public"."users" from "service_role";

revoke truncate on table "public"."users" from "service_role";

revoke update on table "public"."users" from "service_role";

revoke delete on table "public"."webhook_configurations" from "anon";

revoke insert on table "public"."webhook_configurations" from "anon";

revoke references on table "public"."webhook_configurations" from "anon";

revoke select on table "public"."webhook_configurations" from "anon";

revoke trigger on table "public"."webhook_configurations" from "anon";

revoke truncate on table "public"."webhook_configurations" from "anon";

revoke update on table "public"."webhook_configurations" from "anon";

revoke delete on table "public"."webhook_configurations" from "authenticated";

revoke insert on table "public"."webhook_configurations" from "authenticated";

revoke references on table "public"."webhook_configurations" from "authenticated";

revoke select on table "public"."webhook_configurations" from "authenticated";

revoke trigger on table "public"."webhook_configurations" from "authenticated";

revoke truncate on table "public"."webhook_configurations" from "authenticated";

revoke update on table "public"."webhook_configurations" from "authenticated";

revoke delete on table "public"."webhook_configurations" from "service_role";

revoke insert on table "public"."webhook_configurations" from "service_role";

revoke references on table "public"."webhook_configurations" from "service_role";

revoke select on table "public"."webhook_configurations" from "service_role";

revoke trigger on table "public"."webhook_configurations" from "service_role";

revoke truncate on table "public"."webhook_configurations" from "service_role";

revoke update on table "public"."webhook_configurations" from "service_role";

revoke delete on table "public"."webhook_deliveries" from "anon";

revoke insert on table "public"."webhook_deliveries" from "anon";

revoke references on table "public"."webhook_deliveries" from "anon";

revoke select on table "public"."webhook_deliveries" from "anon";

revoke trigger on table "public"."webhook_deliveries" from "anon";

revoke truncate on table "public"."webhook_deliveries" from "anon";

revoke update on table "public"."webhook_deliveries" from "anon";

revoke delete on table "public"."webhook_deliveries" from "authenticated";

revoke insert on table "public"."webhook_deliveries" from "authenticated";

revoke references on table "public"."webhook_deliveries" from "authenticated";

revoke select on table "public"."webhook_deliveries" from "authenticated";

revoke trigger on table "public"."webhook_deliveries" from "authenticated";

revoke truncate on table "public"."webhook_deliveries" from "authenticated";

revoke update on table "public"."webhook_deliveries" from "authenticated";

revoke delete on table "public"."webhook_deliveries" from "service_role";

revoke insert on table "public"."webhook_deliveries" from "service_role";

revoke references on table "public"."webhook_deliveries" from "service_role";

revoke select on table "public"."webhook_deliveries" from "service_role";

revoke trigger on table "public"."webhook_deliveries" from "service_role";

revoke truncate on table "public"."webhook_deliveries" from "service_role";

revoke update on table "public"."webhook_deliveries" from "service_role";

alter table "public"."discussions" drop constraint "discussions_created_by_fkey";

alter table "public"."events" drop constraint "events_host_id_fkey";

drop function if exists "public"."trigger_welcome_email"(user_id uuid);

create table "public"."bulk_operations" (
    "id" uuid not null default gen_random_uuid(),
    "operation_type" text not null,
    "initiated_by" uuid not null,
    "target_count" integer not null default 0,
    "success_count" integer not null default 0,
    "error_count" integer not null default 0,
    "operation_data" jsonb,
    "status" text not null default 'pending'::text,
    "started_at" timestamp with time zone not null default now(),
    "completed_at" timestamp with time zone,
    "error_details" jsonb,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."bulk_operations" enable row level security;

create table "public"."user_permissions" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "permission_type" text not null,
    "resource_type" text,
    "resource_id" uuid,
    "granted_by" uuid,
    "granted_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone,
    "is_active" boolean not null default true
);


alter table "public"."user_permissions" enable row level security;

create table "public"."user_requests" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "request_type" text not null,
    "title" text not null,
    "description" text not null,
    "contact_email" text not null,
    "contact_phone" text,
    "additional_details" jsonb default '{}'::jsonb,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "reviewed_by" uuid,
    "reviewed_at" timestamp with time zone,
    "admin_notes" text
);


alter table "public"."user_requests" enable row level security;

create table "public"."user_roles" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "role" app_role not null,
    "granted_by" uuid,
    "granted_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone,
    "is_active" boolean not null default true
);


alter table "public"."user_roles" enable row level security;

alter table "public"."events" add column "external_link" text;

alter table "public"."events" add column "image_url" text;

alter table "public"."events" alter column "date_time" drop not null;

alter table "public"."flags" add column "resolved_at" timestamp with time zone;

alter table "public"."flags" add column "resolved_by" uuid;

alter table "public"."flags" add column "status" flag_status not null default 'open'::flag_status;

alter table "public"."users" add column "welcome_email_sent" timestamp with time zone;

CREATE UNIQUE INDEX bulk_operations_pkey ON public.bulk_operations USING btree (id);

CREATE INDEX idx_bulk_operations_initiated_by ON public.bulk_operations USING btree (initiated_by);

CREATE INDEX idx_bulk_operations_status ON public.bulk_operations USING btree (status);

CREATE INDEX idx_flags_created_at ON public.flags USING btree (created_at);

CREATE INDEX idx_flags_status ON public.flags USING btree (status);

CREATE INDEX idx_user_permissions_type ON public.user_permissions USING btree (permission_type);

CREATE INDEX idx_user_permissions_user_id ON public.user_permissions USING btree (user_id);

CREATE INDEX idx_user_roles_active ON public.user_roles USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

CREATE INDEX idx_webhook_configurations_active ON public.webhook_configurations USING btree (is_active) WHERE (is_active = true);

CREATE INDEX idx_webhook_configurations_events ON public.webhook_configurations USING gin (events);

CREATE INDEX idx_webhook_deliveries_config_id ON public.webhook_deliveries USING btree (webhook_config_id);

CREATE INDEX idx_webhook_deliveries_created_at ON public.webhook_deliveries USING btree (created_at DESC);

CREATE INDEX idx_webhook_deliveries_status ON public.webhook_deliveries USING btree (status);

CREATE UNIQUE INDEX user_permissions_pkey ON public.user_permissions USING btree (id);

CREATE UNIQUE INDEX user_permissions_user_id_permission_type_resource_type_reso_key ON public.user_permissions USING btree (user_id, permission_type, resource_type, resource_id);

CREATE UNIQUE INDEX user_requests_pkey ON public.user_requests USING btree (id);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);

alter table "public"."bulk_operations" add constraint "bulk_operations_pkey" PRIMARY KEY using index "bulk_operations_pkey";

alter table "public"."user_permissions" add constraint "user_permissions_pkey" PRIMARY KEY using index "user_permissions_pkey";

alter table "public"."user_requests" add constraint "user_requests_pkey" PRIMARY KEY using index "user_requests_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."bulk_operations" add constraint "bulk_operations_initiated_by_fkey" FOREIGN KEY (initiated_by) REFERENCES users(id) not valid;

alter table "public"."bulk_operations" validate constraint "bulk_operations_initiated_by_fkey";

alter table "public"."bulk_operations" add constraint "bulk_operations_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))) not valid;

alter table "public"."bulk_operations" validate constraint "bulk_operations_status_check";

alter table "public"."flags" add constraint "flags_resolved_by_fkey" FOREIGN KEY (resolved_by) REFERENCES auth.users(id) not valid;

alter table "public"."flags" validate constraint "flags_resolved_by_fkey";

alter table "public"."user_permissions" add constraint "user_permissions_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES users(id) not valid;

alter table "public"."user_permissions" validate constraint "user_permissions_granted_by_fkey";

alter table "public"."user_permissions" add constraint "user_permissions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."user_permissions" validate constraint "user_permissions_user_id_fkey";

alter table "public"."user_permissions" add constraint "user_permissions_user_id_permission_type_resource_type_reso_key" UNIQUE using index "user_permissions_user_id_permission_type_resource_type_reso_key";

alter table "public"."user_requests" add constraint "user_requests_request_type_check" CHECK ((request_type = ANY (ARRAY['discussion'::text, 'event'::text, 'community'::text]))) not valid;

alter table "public"."user_requests" validate constraint "user_requests_request_type_check";

alter table "public"."user_requests" add constraint "user_requests_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) not valid;

alter table "public"."user_requests" validate constraint "user_requests_reviewed_by_fkey";

alter table "public"."user_requests" add constraint "user_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'approved'::text, 'rejected'::text]))) not valid;

alter table "public"."user_requests" validate constraint "user_requests_status_check";

alter table "public"."user_requests" add constraint "user_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_requests" validate constraint "user_requests_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES users(id) not valid;

alter table "public"."user_roles" validate constraint "user_roles_granted_by_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_role_key" UNIQUE using index "user_roles_user_id_role_key";

alter table "public"."webhook_configurations" add constraint "webhook_configurations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."webhook_configurations" validate constraint "webhook_configurations_created_by_fkey";

alter table "public"."webhook_deliveries" add constraint "webhook_deliveries_webhook_config_id_fkey" FOREIGN KEY (webhook_config_id) REFERENCES webhook_configurations(id) ON DELETE CASCADE not valid;

alter table "public"."webhook_deliveries" validate constraint "webhook_deliveries_webhook_config_id_fkey";

alter table "public"."discussions" add constraint "discussions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."discussions" validate constraint "discussions_created_by_fkey";

alter table "public"."events" add constraint "events_host_id_fkey" FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."events" validate constraint "events_host_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  SELECT email
  FROM auth.users
  WHERE id = _user_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_highest_role(_user_id uuid DEFAULT auth.uid())
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY 
    CASE role
      WHEN 'admin' THEN 1
      WHEN 'moderator' THEN 2
      WHEN 'community_manager' THEN 3
      WHEN 'event_organizer' THEN 4
      WHEN 'user' THEN 5
    END
  LIMIT 1
$function$
;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission_type text, _resource_type text DEFAULT NULL::text, _resource_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_permissions
    WHERE user_id = _user_id
      AND permission_type = _permission_type
      AND (resource_type IS NULL OR resource_type = _resource_type)
      AND (resource_id IS NULL OR resource_id = _resource_id)
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  )
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  )
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT public.has_role(_user_id, 'admin')
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = _user_id 
    AND role = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_community_member(_user_id uuid, _community_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.community_members
    WHERE user_id = _user_id 
    AND community_id = _community_id
  );
$function$
;

CREATE OR REPLACE FUNCTION public.update_role_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.granted_at = now();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.dispatch_webhook(event_type text, event_data jsonb, actor_user_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  webhook_config RECORD;
  payload JSONB;
BEGIN
  -- Create the webhook payload
  payload := jsonb_build_object(
    'event', event_type,
    'timestamp', now(),
    'actor_user_id', actor_user_id,
    'data', event_data,
    'request_id', gen_random_uuid()
  );

  -- Insert webhook deliveries for all active configurations that subscribe to this event
  FOR webhook_config IN 
    SELECT id, url, secret_key 
    FROM public.webhook_configurations 
    WHERE is_active = true 
    AND event_type = ANY(events)
  LOOP
    INSERT INTO public.webhook_deliveries (
      webhook_config_id,
      event_type,
      payload,
      status
    ) VALUES (
      webhook_config.id,
      event_type,
      payload,
      'pending'
    );
  END LOOP;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_referral_code()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  code TEXT;
  exists_check INTEGER;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT COUNT(*) INTO exists_check FROM public.users WHERE referral_code = code;
    
    IF exists_check = 0 THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid DEFAULT auth.uid())
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.users WHERE id = user_id;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert user data
  INSERT INTO public.users (id, name, photo_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', 'User'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  
  -- Insert notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id);
  
  -- Send welcome email asynchronously using the correct HTTP function signature
  PERFORM 
    extensions.http_post(
      'https://ggochdssgkfnvcrrmtlp.supabase.co/functions/v1/send-welcome-email',
      jsonb_build_object(
        'userId', NEW.id,
        'userEmail', NEW.email,
        'userName', COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.raw_user_meta_data ->> 'full_name', 'User')
      )::text,
      'application/json'
    );
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

create policy "Admins can manage bulk operations"
on "public"."bulk_operations"
as permissive
for all
to authenticated
using (is_admin());


create policy "Members can view community members or admins can view all"
on "public"."community_members"
as permissive
for select
to public
using ((is_admin_user() OR is_community_member(auth.uid(), community_id)));


create policy "Community members can view comments or admins can view all"
on "public"."discussion_comments"
as permissive
for select
to public
using ((is_admin_user() OR (EXISTS ( SELECT 1
   FROM discussions d
  WHERE ((d.id = discussion_comments.discussion_id) AND is_community_member(auth.uid(), d.community_id))))));


create policy "Community members can view discussions or admins can view all"
on "public"."discussions"
as permissive
for select
to public
using ((is_admin_user() OR is_community_member(auth.uid(), community_id)));


create policy "Community members can register for events"
on "public"."event_registrations"
as permissive
for insert
to public
with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM events e
  WHERE ((e.id = event_registrations.event_id) AND is_community_member(auth.uid(), e.community_id))))));


create policy "Admins can manage all user permissions"
on "public"."user_permissions"
as permissive
for all
to authenticated
using (is_admin());


create policy "Users can view their own permissions"
on "public"."user_permissions"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "Admins can manage all requests"
on "public"."user_requests"
as permissive
for all
to public
using ((get_user_role() = 'admin'::user_role));


create policy "Users can create their own requests"
on "public"."user_requests"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own requests"
on "public"."user_requests"
as permissive
for select
to public
using (((auth.uid() = user_id) OR (get_user_role() = 'admin'::user_role)));


create policy "Admins can manage all user roles"
on "public"."user_roles"
as permissive
for all
to authenticated
using (is_admin());


create policy "Users can view their own roles"
on "public"."user_roles"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "Admins can update any user"
on "public"."users"
as permissive
for update
to authenticated
using ((get_user_role() = 'admin'::user_role))
with check ((get_user_role() = 'admin'::user_role));


create policy "Users can update own profile (no role change)"
on "public"."users"
as permissive
for update
to authenticated
using ((id = auth.uid()))
with check (((id = auth.uid()) AND (role = get_user_role(auth.uid()))));


create policy "Service can insert email logs"
on "public"."email_logs"
as permissive
for insert
to service_role
with check (true);


create policy "Service can update email logs"
on "public"."email_logs"
as permissive
for update
to service_role
using (true);


create policy "Service can insert preferences"
on "public"."notification_preferences"
as permissive
for insert
to service_role
with check (true);


create policy "Service can insert payment logs"
on "public"."payment_logs"
as permissive
for insert
to service_role
with check (true);


create policy "Service can update payment sessions"
on "public"."payment_sessions"
as permissive
for update
to service_role
using (true);


create policy "Service can create referrals"
on "public"."referrals"
as permissive
for insert
to service_role
with check (true);


create policy "Service can log activity"
on "public"."user_activity_log"
as permissive
for insert
to service_role
with check (true);


CREATE TRIGGER update_user_requests_updated_at BEFORE UPDATE ON public.user_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_timestamp BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION update_role_timestamp();


