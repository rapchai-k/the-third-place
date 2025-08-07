import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useReferrals } from '@/hooks/useReferrals';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Gift, 
  Users, 
  TrendingUp, 
  Copy, 
  Share2, 
  MessageCircle,
  Mail,
  Calendar,
  Award
} from 'lucide-react';
import { format } from 'date-fns';

interface ReferralDashboardProps {
  userProfile?: {
    id: string;
    name: string;
    referral_code?: string;
    photo_url?: string;
  };
}

export const ReferralDashboard = ({ userProfile }: ReferralDashboardProps) => {
  const { user } = useAuth();
  const { 
    stats, 
    activity, 
    loading, 
    generateCode, 
    generateCodeLoading, 
    shareReferralCode 
  } = useReferrals(user?.id);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Section */}
      {userProfile?.referral_code ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Your Referral Code
            </CardTitle>
            <CardDescription>
              Share this code with friends to invite them to our community
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Referral Code</Label>
              <div className="flex gap-2">
                <Input
                  value={userProfile.referral_code}
                  readOnly
                  className="bg-muted font-mono text-lg font-bold tracking-wider"
                />
                <Button
                  variant="outline"
                  onClick={() => shareReferralCode(userProfile.referral_code!, 'copy')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareReferralCode(userProfile.referral_code!, 'whatsapp')}
                className="flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => shareReferralCode(userProfile.referral_code!, 'email')}
                className="flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Get Your Referral Code
            </CardTitle>
            <CardDescription>
              Generate a referral code to start inviting friends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => generateCode()} 
              disabled={generateCodeLoading}
              className="w-full"
            >
              {generateCodeLoading ? "Generating..." : "Generate Referral Code"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.total_referrals || 0}</p>
                <p className="text-sm text-muted-foreground">Total Referrals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Award className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.successful_referrals || 0}</p>
                <p className="text-sm text-muted-foreground">Successful</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.conversion_rate || 0}%</p>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Referral Activity
          </CardTitle>
          <CardDescription>
            Track your referred users and their activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activity && activity.length > 0 ? (
            <div className="space-y-4">
              {activity.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback>
                        {item.referred_user_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{item.referred_user_name}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Joined {format(new Date(item.joined_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No referrals yet</h3>
              <p className="text-muted-foreground mb-4">
                Start sharing your referral code to see your referred users here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How the Referral Program Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Share2 className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-medium">1. Share Your Code</h4>
              <p className="text-sm text-muted-foreground">
                Share your unique referral code with friends and family
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-medium">2. Friends Join</h4>
              <p className="text-sm text-muted-foreground">
                Your friends sign up using your referral code
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Gift className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-medium">3. Earn Rewards</h4>
              <p className="text-sm text-muted-foreground">
                Both you and your friends get special community benefits
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};