import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { User, Settings, Bell, Gift } from "lucide-react";
import { ReferralDashboard } from "@/components/referrals/ReferralDashboard";

interface UserProfile {
  id: string;
  name: string;
  photo_url?: string;
  referral_code?: string;
  created_at: string;
}

interface NotificationPreferences {
  user_id: string;
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

export const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { logProfileView, logProfileEdit } = useActivityLogger();

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as UserProfile;
    },
    enabled: !!user?.id
  });

  // Log profile view when profile loads
  useEffect(() => {
    if (user?.id && profile) {
      logProfileView(user.id, {
        profile_name: profile.name,
        account_created: profile.created_at
      });
    }
  }, [user?.id, profile, logProfileView]);

  // Fetch notification preferences
  const { data: preferences } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // PGRST116 means no rows found, which is expected when preferences haven't been created yet
      if (error && error.code !== 'PGRST116') throw error;
      return data as NotificationPreferences | null;
    },
    enabled: !!user?.id
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user?.id) throw new Error('No user ID');
      
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      // Log profile edit
      if (user?.id) {
        logProfileEdit(user.id, {
          updated_fields: ['name'],
          new_name: name
        });
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
    }
  });

  // Update notification preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user?.id) throw new Error('No user ID');
      
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
      
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Changes reverted. Please try again.",
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['notification-preferences', user?.id] });
    }
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    await updateProfileMutation.mutateAsync({ name });
    setLoading(false);
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    // Optimistic update - immediately reflect the change in UI
    queryClient.setQueryData(['notification-preferences', user?.id], (old: any) => 
      old ? { ...old, [key]: value } : { user_id: user?.id, [key]: value }
    );
    
    // Show immediate feedback
    toast({
      title: "Preference updated",
      description: `${key} notifications ${value ? 'enabled' : 'disabled'}`,
    });
    
    updatePreferencesMutation.mutate({ [key]: value });
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: error.message,
      });
    }
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Referrals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Manage your profile information and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={profile?.photo_url} />
                    <AvatarFallback className="text-lg">
                      {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Profile Photo</p>
                    <Button variant="outline" size="sm">
                      Change Photo
                    </Button>
                  </div>
                </div>

                <Separator />

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-sm text-muted-foreground">
                      Email cannot be changed from here
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <Badge variant="secondary" className="w-fit">
                      Community Member
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label>Member Since</Label>
                    <p className="text-sm text-muted-foreground">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>

                  <Button type="submit" disabled={loading || updateProfileMutation.isPending}>
                    {loading || updateProfileMutation.isPending ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified about community activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about events and discussions via email
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={preferences?.email || false}
                      onCheckedChange={(checked) => handlePreferenceChange('email', checked)}
                      disabled={updatePreferencesMutation.isPending}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get important alerts via text message
                      </p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={preferences?.sms || false}
                      onCheckedChange={(checked) => handlePreferenceChange('sms', checked)}
                      disabled={updatePreferencesMutation.isPending}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="whatsapp-notifications">WhatsApp Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive community updates on WhatsApp
                      </p>
                    </div>
                    <Switch
                      id="whatsapp-notifications"
                      checked={preferences?.whatsapp || false}
                      onCheckedChange={(checked) => handlePreferenceChange('whatsapp', checked)}
                      disabled={updatePreferencesMutation.isPending}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="referrals">
            <ReferralDashboard userProfile={profile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;