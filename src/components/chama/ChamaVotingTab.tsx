import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Vote, 
  Search, 
  Plus, 
  ThumbsUp, 
  ThumbsDown,
  Clock,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChamaVotingTabProps {
  chamaId: string;
  userRole: string;
}

export const ChamaVotingTab: React.FC<ChamaVotingTabProps> = ({
  chamaId,
  userRole
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Fetch votes
  const { data: votes, isLoading, refetch } = useQuery({
    queryKey: ['chama-votes', chamaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chama_votes')
        .select(`
          *,
          chama_members!chama_votes_initiated_by_fkey(
            user_profiles(display_name)
          )
        `)
        .eq('chama_id', chamaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  // Fetch user's vote responses
  const { data: userVotes } = useQuery({
    queryKey: ['user-vote-responses', chamaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vote_responses')
        .select(`
          vote_id,
          response
        `)
        .eq('voter_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      return data;
    }
  });

  const handleVote = async (voteId: string, response: boolean) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Insert vote response
      const { error } = await supabase
        .from('vote_responses')
        .upsert({
          vote_id: voteId,
          voter_id: user.user.id,
          response
        }, {
          onConflict: 'vote_id,voter_id'
        });

      if (error) throw error;

      // Update vote counts
      const { error: updateError } = await supabase.rpc('update_vote_counts', {
        p_vote_id: voteId
      });

      if (updateError) throw updateError;

      toast({
        title: "Vote Recorded! 🗳️",
        description: `Your vote has been recorded successfully`
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Vote Failed",
        description: error.message || "Failed to record vote",
        variant: "destructive"
      });
    }
  };

  const getVoteStatus = (vote: any) => {
    if (vote.status === 'completed') {
      return vote.yes_votes > vote.no_votes ? 'passed' : 'failed';
    }
    if (new Date(vote.deadline) < new Date()) {
      return 'expired';
    }
    return 'active';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Vote className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-blue-100 text-blue-800 border-blue-300',
      passed: 'bg-green-100 text-green-800 border-green-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
      expired: 'bg-gray-100 text-gray-800 border-gray-300'
    };

    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-300'}`}
      >
        {status}
      </Badge>
    );
  };

  const hasUserVoted = (voteId: string) => {
    return userVotes?.some(userVote => userVote.vote_id === voteId);
  };

  const getUserVoteResponse = (voteId: string) => {
    return userVotes?.find(userVote => userVote.vote_id === voteId)?.response;
  };

  const calculateVoteProgress = (yesVotes: number, noVotes: number) => {
    const totalVotes = yesVotes + noVotes;
    if (totalVotes === 0) return 0;
    return (yesVotes / totalVotes) * 100;
  };

  const filteredVotes = votes?.filter(vote => {
    return !searchQuery || 
      vote.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vote.description?.toLowerCase().includes(searchQuery.toLowerCase());
  }) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Voting & Decisions</h3>
          <p className="text-sm text-muted-foreground">
            Participate in chama decision making
          </p>
        </div>
        
        {(userRole === 'admin' || userRole === 'treasurer') && (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Vote
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search votes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Votes List */}
      <div className="space-y-4">
        {filteredVotes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No votes found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? 'No votes match your search criteria.' 
                  : 'No voting items have been created yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredVotes.map((vote) => {
            const status = getVoteStatus(vote);
            const userVoted = hasUserVoted(vote.id);
            const userResponse = getUserVoteResponse(vote.id);
            const voteProgress = calculateVoteProgress(vote.yes_votes || 0, vote.no_votes || 0);
            const isActive = status === 'active';

            return (
              <Card key={vote.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <CardTitle className="text-lg">{vote.title}</CardTitle>
                      {getStatusBadge(status)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {vote.vote_type}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Description */}
                  {vote.description && (
                    <p className="text-sm text-muted-foreground">
                      {vote.description}
                    </p>
                  )}

                  {/* Vote Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Initiated by</p>
                      <p className="font-medium">
                        {vote.chama_members?.user_profiles?.display_name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Deadline</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {vote.deadline ? new Date(vote.deadline).toLocaleDateString() : 'No deadline'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Eligible Voters</p>
                      <p className="font-medium">{vote.total_eligible_voters || 0} members</p>
                    </div>
                  </div>

                  {/* Vote Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Yes: {vote.yes_votes || 0}</span>
                      <span>No: {vote.no_votes || 0}</span>
                    </div>
                    <Progress value={voteProgress} className="h-2" />
                    <div className="text-xs text-muted-foreground text-center">
                      {vote.yes_votes + vote.no_votes} of {vote.total_eligible_voters} votes cast
                    </div>
                  </div>

                  {/* Voting Buttons */}
                  {isActive && !userVoted && (
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleVote(vote.id, true)}
                        className="flex-1 flex items-center gap-2"
                        variant="outline"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        Vote Yes
                      </Button>
                      <Button 
                        onClick={() => handleVote(vote.id, false)}
                        className="flex-1 flex items-center gap-2"
                        variant="outline"
                      >
                        <ThumbsDown className="h-4 w-4" />
                        Vote No
                      </Button>
                    </div>
                  )}

                  {/* User Vote Status */}
                  {userVoted && (
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-sm">
                        {userResponse ? <ThumbsUp className="h-4 w-4 text-green-600" /> : <ThumbsDown className="h-4 w-4 text-red-600" />}
                        <span>
                          You voted: <strong>{userResponse ? 'Yes' : 'No'}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};