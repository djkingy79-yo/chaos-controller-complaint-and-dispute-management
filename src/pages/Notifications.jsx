import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Bell, Check, Trash2, AlertTriangle, Calendar, FileUp, MessageSquare, ArrowUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const URGENCY_COLORS = {
  low: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  critical: "bg-red-500/10 text-red-600 border-red-500/20",
};

const TYPE_ICONS = {
  deadline: Calendar,
  missing_evidence: FileUp,
  document_uploaded: FileUp,
  action_required: AlertTriangle,
  response_received: MessageSquare,
  escalation_ready: ArrowUp,
};

export default function Notifications() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedUrgency, setSelectedUrgency] = useState("all");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const all = await base44.entities.Notification.filter({ user_id: user?.id });
      return all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.id,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.is_read);
      await Promise.all(unread.map((n) => base44.entities.Notification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const filtered = selectedUrgency === "all" ? notifications : notifications.filter((n) => n.urgency === selectedUrgency);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">Notifications</h1>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllAsReadMutation.mutate()} className="gap-1.5">
              <Check className="w-3.5 h-3.5" /> Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Urgency Filter */}
      <div className="flex gap-2 flex-wrap">
        {["all", "critical", "high", "medium", "low"].map((urgency) => (
          <Button
            key={urgency}
            variant={selectedUrgency === urgency ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedUrgency(urgency)}
            className="text-xs"
          >
            {urgency === "all" ? "All" : urgency.charAt(0).toUpperCase() + urgency.slice(1)}
          </Button>
        ))}
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-muted/20 border border-dashed border-border rounded-xl p-10 text-center">
          <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">No notifications</p>
          <p className="text-xs text-muted-foreground">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] || Bell;
            return (
              <div
                key={notification.id}
                className={`bg-card border rounded-xl p-4 transition-all ${
                  !notification.is_read ? "border-primary/30 shadow-md" : "border-border opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${URGENCY_COLORS[notification.urgency]}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-sm text-foreground">{notification.title}</h3>
                        {!notification.is_read && (
                          <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                            New
                          </Badge>
                        )}
                        <Badge variant="outline" className={`text-xs ${URGENCY_COLORS[notification.urgency]}`}>
                          {notification.urgency}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(notification.created_date), "d MMM yyyy, h:mm a")}
                        </span>
                        {notification.case_id && (
                          <span>Case: {notification.case_id.slice(0, 8).toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(notification.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}