import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Banknote, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Calendar,
  Percent
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChamaLoansTabProps {
  chamaId: string;
  userRole: string;
}

export const ChamaLoansTab: React.FC<ChamaLoansTabProps> = ({
  chamaId,
  userRole
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { toast } = useToast();

  // Fetch loan requests
  const { data: loanRequests, isLoading, refetch } = useQuery({
    queryKey: ['chama-loan-requests', chamaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chama_loan_requests')
        .select(`
          *,
          chama_members(
            user_profiles(display_name)
          )
        `)
        .eq('chama_id', chamaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const handleLoanAction = async (loanId: string, action: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('chama_loan_requests')
        .update({ 
          status: action,
          approved_at: action === 'approved' ? new Date().toISOString() : null
        })
        .eq('id', loanId);

      if (error) throw error;

      toast({
        title: `Loan ${action === 'approved' ? 'Approved' : 'Rejected'}! ✅`,
        description: `The loan request has been ${action}`
      });

      refetch();
    } catch (error: any) {
      toast({
        title: "Action Failed",
        description: error.message || "Failed to update loan status",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
      disbursed: 'bg-blue-100 text-blue-800 border-blue-300'
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

  const calculateMonthlyPayment = (amount: number, rate: number, months: number) => {
    // Simple interest calculation
    const totalAmount = amount * (1 + (rate / 100));
    return totalAmount / months;
  };

  const filteredLoans = loanRequests?.filter(loan => {
    const matchesSearch = !searchQuery || 
      loan.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.chama_members?.user_profiles?.display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = selectedStatus === 'all' || loan.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
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
      <div>
        <h3 className="text-lg font-semibold">Loan Requests</h3>
        <p className="text-sm text-muted-foreground">
          Manage loan applications and approvals
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search loans..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="disbursed">Disbursed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loan Requests List */}
      <div className="space-y-4">
        {filteredLoans.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No loan requests</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || selectedStatus !== 'all' 
                  ? 'No loan requests match your filters.' 
                  : 'No loan requests have been made yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLoans.map((loan) => (
            <Card key={loan.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      {getStatusIcon(loan.status)}
                      <h4 className="font-semibold text-foreground">
                        Loan Request - {formatCurrency(loan.amount)}
                      </h4>
                      {getStatusBadge(loan.status)}
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>Requested by: {loan.chama_members?.user_profiles?.display_name || 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>Applied: {new Date(loan.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Percent className="h-3 w-3" />
                        <span>{loan.interest_rate}% interest • {loan.duration_months} months</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-1">Purpose:</p>
                      <p className="text-sm text-foreground">{loan.purpose}</p>
                    </div>
                  </div>

                  <div className="lg:text-right lg:min-w-[200px]">
                    <div className="space-y-2 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Loan Amount</p>
                        <p className="font-semibold text-lg">{formatCurrency(loan.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Payment</p>
                        <p className="font-medium">
                          {formatCurrency(calculateMonthlyPayment(loan.amount, loan.interest_rate || 5, loan.duration_months))}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Repayment</p>
                        <p className="font-medium">
                          {formatCurrency(loan.total_repayment || (loan.amount * (1 + (loan.interest_rate || 5) / 100)))}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons for Admins/Treasurers */}
                    {(userRole === 'admin' || userRole === 'treasurer') && loan.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleLoanAction(loan.id, 'approved')}
                          className="flex-1"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoanAction(loan.id, 'rejected')}
                          className="flex-1"
                        >
                          Reject
                        </Button>
                      </div>
                    )}

                    {loan.approved_at && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {loan.status === 'approved' ? 'Approved' : 'Updated'}: {new Date(loan.approved_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};