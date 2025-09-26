import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  UserPlus, 
  Search, 
  Crown, 
  Shield, 
  User,
  MoreHorizontal,
  Mail,
  Calendar
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemberManagement } from '@/hooks/useMemberManagement';

interface ChamaMembersTabProps {
  chamaId: string;
  userRole: string;
}

export const ChamaMembersTab: React.FC<ChamaMembersTabProps> = ({
  chamaId,
  userRole
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Fetch chama members
  const { data: members, isLoading } = useQuery({
    queryKey: ['chama-members', chamaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chama_members')
        .select(`
          *,
          user_profiles(display_name, avatar_url)
        `)
        .eq('chama_id', chamaId)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    }
  });

  const { updateMemberRole, isUpdatingRole } = useMemberManagement(chamaId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case 'treasurer':
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <User className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'treasurer':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredMembers = members?.filter(member => {
    const matchesSearch = !searchQuery || 
      member.user_profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || member.role === selectedRole;
    return matchesSearch && matchesRole;
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
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Members ({filteredMembers.length})</h3>
          <p className="text-sm text-muted-foreground">
            Manage chama members and their roles
          </p>
        </div>
        
        {(userRole === 'admin' || userRole === 'treasurer') && (
          <Button className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Members
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="treasurer">Treasurer</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Members List */}
      <div className="grid gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {member.user_profiles?.display_name?.charAt(0)?.toUpperCase() || 'M'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Member Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-foreground">
                        {member.user_profiles?.display_name || 'Unknown Member'}
                      </h4>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getRoleBadgeColor(member.role)}`}
                        >
                          {member.role}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </div>
                      <div>
                        Total: {formatCurrency(member.total_contributed || 0)}
                      </div>
                      <div>
                        Last: {member.last_contribution_date ? 
                          new Date(member.last_contribution_date).toLocaleDateString() : 
                          'None'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {(userRole === 'admin' && member.role !== 'admin') && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => updateMemberRole({ 
                          memberId: member.id, 
                          newRole: 'treasurer' 
                        })}
                        disabled={member.role === 'treasurer' || isUpdatingRole}
                      >
                        Make Treasurer
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => updateMemberRole({ 
                          memberId: member.id, 
                          newRole: 'member' 
                        })}
                        disabled={member.role === 'member' || isUpdatingRole}
                      >
                        Make Member
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium text-foreground mb-2">No members found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No members match your search criteria.' : 'This chama has no members yet.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};