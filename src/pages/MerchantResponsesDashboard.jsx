import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  DollarSign,
  FileText,
  Loader2,
  Mail,
  Building2
} from "lucide-react";
import { format } from "date-fns";

const responseTypeConfig = {
  general_response: { icon: MessageSquare, label: "General Response", color: "bg-blue-500/10 text-blue-500" },
  offer_settlement: { icon: DollarSign, label: "Settlement Offer", color: "bg-green-500/10 text-green-500" },
  deny_claim: { icon: AlertCircle, label: "Claim Denied", color: "bg-red-500/10 text-red-500" },
  request_more_info: { icon: FileText, label: "More Info Requested", color: "bg-orange-500/10 text-orange-500" },
  escalation_response: { icon: Building2, label: "Escalation Response", color: "bg-purple-500/10 text-purple-500" },
};

export default function MerchantResponsesDashboard() {
  const { user } = useAuth();

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ["merchant-responses", user?.id],
    queryFn: async () => {
      // Get all cases for this user
      const cases = await base44.entities.Case.filter({ created_by_id: user?.id });
      const caseIds = cases.map(c => c.id);
      if (caseIds.length === 0) return [];
      const caseMap = Object.fromEntries(cases.map(c => [c.id, c]));

      // Get merchant responses scoped to user's cases
      const filteredResponses = await base44.entities.MerchantResponse.filter({ case_id: { $in: caseIds } });

      // Enrich with case data from local map (no extra fetches)
      const enriched = filteredResponses.map(response => ({
        ...response,
        case: caseMap[response.case_id] || null,
      }));
      
      // Sort by most recent first
      return enriched.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      );
    },
    enabled: !!user?.id,
  });

  const unreadCount = responses.filter(r => !r.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-display font-black text-foreground">
              Merchant Responses
            </h1>
            <p className="text-sm text-muted-foreground font-bold mt-1">
              All responses from organisations across your cases
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-primary text-primary-foreground px-3 py-1">
            {unreadCount} Unread
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <MessageSquare className="w-4 h-4" /> Total
          </div>
          <div className="text-2xl font-bold text-foreground">{responses.length}</div>
          <div className="text-xs text-muted-foreground">responses received</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <AlertCircle className="w-4 h-4" /> Unread
          </div>
          <div className="text-2xl font-bold text-primary">{unreadCount}</div>
          <div className="text-xs text-muted-foreground">awaiting review</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <DollarSign className="w-4 h-4" /> Offers
          </div>
          <div className="text-2xl font-bold text-success">
            {responses.filter(r => r.response_type === "offer_settlement").length}
          </div>
          <div className="text-xs text-muted-foreground">settlement offers</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
            <Clock className="w-4 h-4" /> Recent
          </div>
          <div className="text-2xl font-bold text-foreground">
            {responses.filter(r => {
              const daysDiff = (Date.now() - new Date(r.created_date).getTime()) / (1000 * 60 * 60 * 24);
              return daysDiff <= 7;
            }).length}
          </div>
          <div className="text-xs text-muted-foreground">last 7 days</div>
        </div>
      </div>

      {/* Responses List */}
      {responses.length === 0 ? (
        <div className="bg-secondary/30 rounded-lg border-2 border-dashed border-border p-12 text-center">
          <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm font-semibold text-foreground mb-1">
            No Responses Yet
          </p>
          <p className="text-xs text-muted-foreground">
            When merchants respond to your cases, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {responses.map((response) => {
            const TypeIcon = responseTypeConfig[response.response_type]?.icon || MessageSquare;
            const colorConfig = responseTypeConfig[response.response_type] || responseTypeConfig.general_response;
            
            return (
              <div 
                key={response.id} 
                className={`bg-card border-2 rounded-xl p-5 transition-all ${
                  !response.is_read 
                    ? "border-primary/40 shadow-md" 
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2.5 rounded-lg ${colorConfig.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {colorConfig.label}
                        </Badge>
                        {!response.is_read && (
                          <Badge className="bg-primary text-primary-foreground text-[10px]">
                            New
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-heading font-bold text-foreground text-base truncate">
                        {response.case?.title || "Case"}
                      </h3>
                      <p className="text-xs text-muted-foreground font-bold">
                        From: {response.merchant_name || response.merchant_email}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground font-bold">
                      {format(new Date(response.created_date), "d MMM yyyy")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(response.created_date), "h:mm a")}
                    </p>
                  </div>
                </div>

                {/* Case Info */}
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <div className="grid sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground font-bold mb-1">Organisation</p>
                      <p className="text-foreground font-semibold">
                        {response.case?.organisation_name || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-bold mb-1">Category</p>
                      <p className="text-foreground font-semibold capitalize">
                        {response.case?.category || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground font-bold mb-1">Status</p>
                      <p className="text-foreground font-semibold">
                        {response.case?.status?.replace(/_/g, " ") || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Response Text Preview */}
                <div className="mb-4">
                  <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                    {response.response_text}
                  </p>
                </div>

                {/* Offer Amount */}
                {response.offer_amount && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4">
                    <p className="text-xs text-green-600 dark:text-green-400 font-bold mb-1">
                      Settlement Offer
                    </p>
                    <p className="text-lg font-bold text-green-700 dark:text-green-300">
                      {response.offer_amount}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <Link to={`/case/${response.case_id}`}>
                    <Button size="sm" className="gap-2">
                      <FileText className="w-4 h-4" />
                      View Case
                    </Button>
                  </Link>
                  {!response.is_read && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={async () => {
                        await base44.entities.MerchantResponse.update(response.id, { is_read: true });
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Mark as Read
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}