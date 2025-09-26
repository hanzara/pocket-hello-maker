import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ArrowUpRight, 
  ArrowDownLeft, 
  Search, 
  Filter,
  DollarSign,
  Calendar
} from 'lucide-react';
import { useTransactionHistory } from '@/hooks/useChamaWallet';

interface ChamaTransactionsTabProps {
  chamaId: string;
}

export const ChamaTransactionsTab: React.FC<ChamaTransactionsTabProps> = ({
  chamaId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  const { data: transactions, isLoading } = useTransactionHistory(chamaId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES'
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'contribution':
      case 'deposit':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'loan':
      case 'withdrawal':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'contribution':
      case 'deposit':
        return 'text-green-600';
      case 'loan':
      case 'withdrawal':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      completed: 'bg-green-100 text-green-800 border-green-300',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      failed: 'bg-red-100 text-red-800 border-red-300',
      processing: 'bg-blue-100 text-blue-800 border-blue-300'
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

  const filterTransactions = () => {
    if (!transactions) return [];

    return transactions.filter(transaction => {
      const matchesSearch = !searchQuery || 
        transaction.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.memberName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === 'all' || transaction.type === selectedType;
      
      let matchesPeriod = true;
      if (selectedPeriod !== 'all') {
        const transactionDate = new Date(transaction.created_at);
        const now = new Date();
        
        switch (selectedPeriod) {
          case 'today':
            matchesPeriod = transactionDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesPeriod = transactionDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesPeriod = transactionDate >= monthAgo;
            break;
        }
      }
      
      return matchesSearch && matchesType && matchesPeriod;
    });
  };

  const filteredTransactions = filterTransactions();

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
        <h3 className="text-lg font-semibold">Transaction History</h3>
        <p className="text-sm text-muted-foreground">
          All chama financial transactions and activities
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Transaction type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="contribution">Contributions</SelectItem>
            <SelectItem value="loan">Loans</SelectItem>
            <SelectItem value="withdrawal">Withdrawals</SelectItem>
            <SelectItem value="deposit">Deposits</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-medium text-foreground mb-2">No transactions found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || selectedType !== 'all' || selectedPeriod !== 'all' 
                  ? 'No transactions match your filters.' 
                  : 'No transactions recorded yet.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => (
            <Card key={transaction.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-muted">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-foreground">
                          {transaction.description || 'Transaction'}
                        </h4>
                        {getStatusBadge(transaction.status)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                        {transaction.memberName && (
                          <span>By {transaction.memberName}</span>
                        )}
                        {transaction.payment_method && (
                          <Badge variant="outline" className="text-xs">
                            {transaction.payment_method}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type === 'contribution' || transaction.type === 'deposit' ? '+' : '-'}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">
                      {transaction.type}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {filteredTransactions.length > 0 && filteredTransactions.length % 20 === 0 && (
        <div className="text-center">
          <Button variant="outline">
            Load More Transactions
          </Button>
        </div>
      )}
    </div>
  );
};