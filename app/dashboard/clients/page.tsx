'use client';

import { useState, useEffect } from 'react';
import ClientForm from '@/components/customers/CustomerForm';
import ClientList from '@/components/customers/CustomerList';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
  id: string;
  name: string;
  phone: string;
  address?: string;
  clientType: 'FARMER' | 'GOVT_ORG' | 'PRIVATE';
  createdAt: Date;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch clients');
      }
      
      const data = await response.json();
      // Convert string dates to Date objects
      const clientsWithDates = data.map((client: any) => ({
        ...client,
        createdAt: new Date(client.createdAt)
      }));
      setClients(clientsWithDates);
      setFilteredClients(clientsWithDates);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredClients(filtered);
  }, [searchQuery, clients]);

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteClient = async (id: string) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      setClientToDelete(client);
    }
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/clients/${clientToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 204) {
        setClients(clients.filter(client => client.id !== clientToDelete.id));
        setFilteredClients(prev => prev.filter(client => client.id !== clientToDelete.id));
        toast.success('Client and all related records deleted successfully');
      } else {
        const errorData = await response.json();
        if (response.status === 404) {
          toast.error('Client not found');
        } else {
          throw new Error(errorData.message || 'Failed to delete client');
        }
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete client. Please try again.');
    } finally {
      setClientToDelete(null);
      setIsDeleting(false);
    }
  };

  const handleFormSubmit = async (formData: Omit<Client, 'id' | 'createdAt'>) => {
    try {
      const url = selectedClient 
        ? `/api/clients/${selectedClient.id}`
        : '/api/clients';
      
      const method = selectedClient ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save client');
      }

      await fetchClients();
      setIsFormOpen(false);
      setSelectedClient(null);
      toast.success(selectedClient ? 'Client updated successfully' : 'Client added successfully');
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save client. Please try again.');
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClients(prev => {
      if (prev.includes(clientId)) {
        return prev.filter(id => id !== clientId);
      }
      return [...prev, clientId];
    });
  };

  const handleBulkDelete = async () => {
    if (selectedClients.length === 0) return;
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedClients.length === 0) return;
    setIsDeleting(true);

    try {
      const results = await Promise.allSettled(
        selectedClients.map(async (clientId) => {
          const response = await fetch(`/api/clients/${clientId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.status === 204) {
            return { id: clientId, success: true };
          } else {
            const errorData = await response.json();
            return { 
              id: clientId, 
              success: false, 
              error: errorData.message || 'Failed to delete client'
            };
          }
        })
      );

      // Process results
      const successfulDeletes = results
        .filter((result): result is PromiseFulfilledResult<{ id: string, success: true }> => 
          result.status === 'fulfilled' && result.value.success
        )
        .map(result => result.value.id);

      const failedDeletes = results
        .filter((result): result is PromiseFulfilledResult<{ id: string, success: false, error: string }> => 
          result.status === 'fulfilled' && !result.value.success
        )
        .map(result => result.value);

      // Update the clients list for successful deletes
      if (successfulDeletes.length > 0) {
        setClients(clients.filter(client => !successfulDeletes.includes(client.id)));
        setFilteredClients(prev => prev.filter(client => !successfulDeletes.includes(client.id)));
        toast.success(`Successfully deleted ${successfulDeletes.length} client(s)`);
      }

      // Show errors for failed deletes
      if (failedDeletes.length > 0) {
        failedDeletes.forEach(({ id, error }) => {
          const client = clients.find(c => c.id === id);
          toast.error(`Failed to delete ${client?.name || 'client'}: ${error}`);
        });
      }

      setSelectedClients([]);
    } catch (error) {
      console.error('Error deleting clients:', error);
      toast.error('An unexpected error occurred while deleting clients');
    } finally {
      setIsDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">

      {isLoading ? (
        <div className="rounded-md border">
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[100px]" />
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ClientList
          clients={filteredClients}
          onEdit={handleEditClient}
          onDelete={handleDeleteClient}
          onSelectionChange={setSelectedClients}
          onAddClient={handleAddClient}
          onBulkDelete={handleBulkDelete}
        />
      )}

      <ClientForm
        client={selectedClient}
        onSubmit={handleFormSubmit}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedClient(null);
        }}
        open={isFormOpen}
      />

      <AlertDialog open={!!clientToDelete} onOpenChange={() => !isDeleting && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This action cannot be undone. This will permanently delete:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                  <li>The client: <span className="font-semibold">{clientToDelete?.name}</span></li>
                  <li>All invoices associated with this client</li>
                  <li>All samples associated with this client</li>
                  <li>All other related records</li>
                </ul>
                <p className="text-sm text-red-500 font-medium">
                  This action is irreversible!
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Deleting...' : 'Delete Client'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={() => !isDeleting && setShowBulkDeleteConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Clients</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete {selectedClients.length} selected client(s)? This action cannot be undone and will permanently delete:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-sm text-muted-foreground">
                  <li>All selected clients</li>
                  <li>All invoices associated with these clients</li>
                  <li>All samples associated with these clients</li>
                  <li>All other related records</li>
                </ul>
                <p className="text-sm text-red-500 font-medium">
                  This action is irreversible!
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? 'Deleting...' : `Delete ${selectedClients.length} Client(s)`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 