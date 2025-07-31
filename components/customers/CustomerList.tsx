'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreVertical, Pencil, Trash2, Search, Users, Phone, MapPin, Building2, Plus, Filter } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string;
  clientType: 'FARMER' | 'GOVT_ORG' | 'PRIVATE';
  createdAt: Date;
}

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  loading?: boolean;
  onAddClient?: () => void;
  onBulkDelete?: (ids: string[]) => void;
}

const getClientTypeColor = (type: string) => {
  switch (type) {
    case 'FARMER':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'GOVT_ORG':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'PRIVATE':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

export default function ClientList({ 
  clients = [], 
  onEdit, 
  onDelete, 
  onSelectionChange,
  loading = false,
  onAddClient,
  onBulkDelete
}: ClientListProps) {
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState<string>('ALL');

  const handleSelectClient = (clientId: string) => {
    const newSelection = selectedClients.includes(clientId)
      ? selectedClients.filter(id => id !== clientId)
      : [...selectedClients, clientId];
    
    setSelectedClients(newSelection);
    onSelectionChange?.(newSelection);
  };

  const handleSelectAll = () => {
    const newSelection = selectedClients.length === clients.length
      ? []
      : clients.map(client => client.id);
    
    setSelectedClients(newSelection);
    onSelectionChange?.(newSelection);
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' || 
      client.name.toLowerCase().includes(searchLower) ||
      client.phone.toLowerCase().includes(searchLower) ||
      (client.address?.toLowerCase().includes(searchLower) ?? false);
    
    const matchesFilter = clientTypeFilter === 'ALL' || client.clientType === clientTypeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: clients.length,
    farmers: clients.filter(c => c.clientType === 'FARMER').length,
    govt: clients.filter(c => c.clientType === 'GOVT_ORG').length,
    private: clients.filter(c => c.clientType === 'PRIVATE').length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-12 w-[250px]" />
          <Skeleton className="h-12 w-[250px]" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Clients</p>
                <h3 className="text-2xl font-bold tracking-tight">{stats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Farmers</p>
                <h3 className="text-2xl font-bold tracking-tight">{stats.farmers}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <Building2 className="h-6 w-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Government</p>
                <h3 className="text-2xl font-bold tracking-tight">{stats.govt}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-lg transition-shadow duration-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Building2 className="h-6 w-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">Private</p>
                <h3 className="text-2xl font-bold tracking-tight">{stats.private}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full">
        <CardHeader className="flex flex-col gap-4">
          <div>
            <CardTitle>Client Management</CardTitle>
            <CardDescription>
              View and manage all your clients in one place
            </CardDescription>
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="relative w-[300px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              {selectedClients.length > 0 && onBulkDelete && (
                <Button 
                  onClick={() => {
                    onBulkDelete(selectedClients);
                    setSelectedClients([]);
                  }}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  Delete Selected ({selectedClients.length})
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                    {clientTypeFilter !== 'ALL' && (
                      <Badge variant="secondary" className="ml-1">
                        {clientTypeFilter.replace('_', ' ')}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => setClientTypeFilter('ALL')}
                    className={clientTypeFilter === 'ALL' ? 'bg-accent' : ''}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    All Clients
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setClientTypeFilter('FARMER')}
                    className={clientTypeFilter === 'FARMER' ? 'bg-accent' : ''}
                  >
                    <Users className="mr-2 h-4 w-4 text-green-500" />
                    Farmers
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setClientTypeFilter('GOVT_ORG')}
                    className={clientTypeFilter === 'GOVT_ORG' ? 'bg-accent' : ''}
                  >
                    <Building2 className="mr-2 h-4 w-4 text-blue-500" />
                    Government
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setClientTypeFilter('PRIVATE')}
                    className={clientTypeFilter === 'PRIVATE' ? 'bg-accent' : ''}
                  >
                    <Building2 className="mr-2 h-4 w-4 text-purple-500" />
                    Private
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {onAddClient && (
                <Button onClick={onAddClient} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Client
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="relative">
              <div className="overflow-x-auto">
                <div className="max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[50px] bg-background">
                          <Checkbox
                            checked={selectedClients.length > 0 && selectedClients.length === filteredClients.length}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all clients"
                          />
                        </TableHead>
                        <TableHead className="bg-background">Name</TableHead>
                        <TableHead className="bg-background">Phone</TableHead>
                        <TableHead className="bg-background">Address</TableHead>
                        <TableHead className="bg-background">Type</TableHead>
                        <TableHead className="bg-background">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-[400px]">
                            <div className="flex flex-col items-center justify-center h-full text-center">
                              <div className="p-4 bg-muted/50 rounded-full mb-4">
                                <Search className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <h3 className="text-lg font-semibold mb-2">
                                {searchQuery ? 'No matching clients found' : 'No clients available'}
                              </h3>
                              <p className="text-sm text-muted-foreground max-w-sm">
                                {searchQuery 
                                  ? 'Try adjusting your search to find what you\'re looking for.'
                                  : 'Add your first client to get started.'}
                              </p>
                              {searchQuery && (
                                <button
                                  onClick={() => setSearchQuery('')}
                                  className="mt-4 text-sm text-primary hover:text-primary/80 transition-colors"
                                >
                                  Clear search
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredClients.map((client) => (
                          <TableRow key={client.id} className="hover:bg-muted/50">
                            <TableCell>
                              <Checkbox
                                checked={selectedClients.includes(client.id)}
                                onCheckedChange={() => handleSelectClient(client.id)}
                                aria-label={`Select ${client.name}`}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {client.phone}
                              </div>
                            </TableCell>
                            <TableCell>
                              {client.address ? (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  {client.address}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={getClientTypeColor(client.clientType)}
                              >
                                {client.clientType.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => onEdit(client)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => {
                                      onDelete(client.id);
                                      setSelectedClients(prev => prev.filter(id => id !== client.id));
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
} 