import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Clock, Users, Filter } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useStructuredData, createCollectionSchema, createBreadcrumbSchema } from '@/utils/schema';

export default function Discussions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const communityFilter = searchParams.get('community');
  const statusFilter = searchParams.get('status') || 'all';

  // Add structured data for SEO
  useStructuredData([
    createBreadcrumbSchema([
      { name: "Home", url: window.location.origin },
      { name: "Discussions", url: window.location.href }
    ])
  ]);

  // Fetch discussions with filters
  const { data: discussions, isLoading } = useQuery({
    queryKey: ['discussions', communityFilter, statusFilter, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('discussions')
        .select(`
          *,
          communities (name, id),
          users (name, photo_url),
          discussion_comments (count)
        `)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      // Apply community filter
      if (communityFilter) {
        query = query.eq('community_id', communityFilter);
      }

      // Apply status filter
      if (statusFilter === 'active') {
        query = query.gt('expires_at', new Date().toISOString());
      } else if (statusFilter === 'expired') {
        query = query.lt('expires_at', new Date().toISOString());
      }

      // Apply search filter
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%, prompt.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch communities for filter dropdown
  const { data: communities } = useQuery({
    queryKey: ['communities-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('communities')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchTerm) {
      newParams.set('search', searchTerm);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Community Discussions</h1>
            <p className="text-muted-foreground">
              Join conversations happening in communities across the platform
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search discussions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <Select
                value={communityFilter || 'all'}
                onValueChange={(value) => handleFilterChange('community', value)}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Communities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Communities</SelectItem>
                  {communities?.map((community) => (
                    <SelectItem key={community.id} value={community.id}>
                      {community.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={statusFilter}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button type="submit">Search</Button>
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {discussions && discussions.length > 0 ? (
          <div className="space-y-4">
            {discussions.map((discussion) => {
              const isExpired = new Date(discussion.expires_at) < new Date();
              const commentCount = discussion.discussion_comments?.length || 0;

              return (
                <Link 
                  key={discussion.id}
                  to={`/discussions/${discussion.id}`}
                  className="block"
                >
                  <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                    <CardContent className="pt-4 pb-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4 mb-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <h3 className="text-lg font-semibold hover:text-primary transition-colors flex-1 truncate cursor-help">
                                      {discussion.title}
                                    </h3>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs">{discussion.title}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <Badge variant={isExpired ? "secondary" : "default"} className="shrink-0">
                                {isExpired ? "Expired" : "Active"}
                              </Badge>
                            </div>
                            
                            {discussion.prompt && (
                              <p className="text-muted-foreground text-sm mb-2" style={{ height: '48px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {discussion.prompt}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <div className="flex items-center gap-1">
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={discussion.users?.photo_url || ''} />
                              <AvatarFallback className="text-xs">
                                {discussion.users?.name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate max-w-24">{discussion.users?.name}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span className="truncate max-w-24">{discussion.communities?.name}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            <span>{commentCount}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="truncate">
                              {isExpired 
                                ? `Expired ${new Date(discussion.expires_at).toLocaleDateString()}`
                                : `Expires ${new Date(discussion.expires_at).toLocaleDateString()}`
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No discussions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || communityFilter || statusFilter !== 'all'
                  ? "Try adjusting your search criteria or filters"
                  : "No discussions are available at the moment"
                }
              </p>
              {(searchTerm || communityFilter || statusFilter !== 'all') && (
                <Button onClick={clearFilters} variant="outline">
                  Clear all filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}