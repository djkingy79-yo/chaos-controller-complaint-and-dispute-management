import React from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function GoogleTasksSync({ user }) {
  const [syncing, setSyncing] = React.useState(false);
  const [lastSync, setLastSync] = React.useState(null);
  const { toast } = useToast();

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await base44.functions.invoke('syncDeadlinesToGoogleTasks', {});
      setLastSync(new Date());
      toast({
        title: "Google Tasks Synced",
        description: `${response.data.tasksCreated} tasks created, ${response.data.tasksRemoved} removed`,
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: error.message || "Could not sync to Google Tasks",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setSyncing(false);
    }
  };

  const openGoogleTasks = () => {
    window.open('https://tasks.google.com', '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-blue-500/10 via-card to-green-500/10 border border-blue-500/30 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/15 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="font-heading font-black text-foreground text-lg">Google Tasks Integration</h2>
            <p className="text-xs text-foreground font-bold">
              {lastSync 
                ? `Last synced: ${lastSync.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`
                : 'Sync your deadlines to Google Tasks'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={openGoogleTasks}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Open Tasks
          </Button>
          <Button
            onClick={handleSync}
            disabled={syncing}
            className="gap-2"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="text-xs text-foreground font-bold space-y-1">
        <p>✓ Active deadlines automatically appear in your "Chaos Controller Deadlines" task list</p>
        <p>✓ Completed or missed deadlines are automatically removed</p>
        <p>✓ Each task includes the case name and deadline date</p>
      </div>
    </div>
  );
}