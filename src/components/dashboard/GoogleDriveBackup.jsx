import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Cloud, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";

export default function GoogleDriveBackup() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      await base44.asServiceRole.connectors.getConnection('googledrive');
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleConnect = async () => {
    try {
      const url = await base44.connectors.connectAppUser('googledrive');
      const popup = window.open(url, '_blank');
      const timer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(timer);
          checkConnection();
        }
      }, 500);
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to Google Drive",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500/10 via-card to-green-500/10 border border-blue-500/30 rounded-xl p-5">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="bg-gradient-to-r from-green-500/10 via-card to-blue-500/10 border border-green-500/30 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/15 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h2 className="font-heading font-black text-foreground text-lg">Google Drive Backup Active</h2>
              <p className="text-xs text-foreground font-bold">All evidence automatically backed up</p>
            </div>
          </div>
        </div>
        <div className="text-xs text-foreground font-bold space-y-1">
          <p>✓ Secure backup of all uploaded evidence</p>
          <p>✓ Organised by case in dedicated folders</p>
          <p>✓ Access your files anytime from Google Drive</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500/10 via-card to-green-500/10 border border-blue-500/30 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/15 rounded-lg">
            <Cloud className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="font-heading font-black text-foreground text-lg">Google Drive Backup</h2>
            <p className="text-xs text-foreground font-bold">
              Automatically backup all evidence files to your Google Drive
            </p>
          </div>
        </div>
        <Button onClick={handleConnect} className="gap-2">
          <Cloud className="w-4 h-4" />
          Connect Drive
        </Button>
      </div>
      <div className="text-xs text-foreground font-bold space-y-1">
        <p>✓ Secure backup of all uploaded evidence</p>
        <p>✓ Organised by case in dedicated folders</p>
        <p>✓ Access your files anytime from Google Drive</p>
      </div>
    </div>
  );
}