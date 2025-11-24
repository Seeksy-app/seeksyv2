import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Mail, Phone, Globe } from "lucide-react";
import { useState } from "react";
import { CreateClientDialog } from "./CreateClientDialog";

interface ClientsTabProps {
  userId: string;
}

export const ClientsTab = ({ userId }: ClientsTabProps) => {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: clients, refetch } = useQuery({
    queryKey: ["clients", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Clients & Customers</h2>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {clients?.map((client) => (
          <Card key={client.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">
                    {client.company_name || client.contact_name}
                  </CardTitle>
                  {client.company_name && (
                    <p className="text-sm text-muted-foreground mt-1">{client.contact_name}</p>
                  )}
                </div>
                <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                  {client.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{client.contact_email}</span>
              </div>
              {client.contact_phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{client.contact_phone}</span>
                </div>
              )}
              {client.website && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                    {client.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {clients?.length === 0 && (
          <Card className="md:col-span-2">
            <CardContent className="py-12 text-center text-muted-foreground">
              No clients yet. Add your first client to get started.
            </CardContent>
          </Card>
        )}
      </div>

      <CreateClientDialog 
        open={createOpen} 
        onOpenChange={setCreateOpen}
        onSuccess={refetch}
        userId={userId}
      />
    </div>
  );
};
