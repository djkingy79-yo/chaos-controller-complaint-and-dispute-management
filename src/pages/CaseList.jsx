import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, List, Kanban } from "lucide-react";
import CaseCard from "@/components/dashboard/CaseCard";
import KanbanBoard from "@/components/cases/KanbanBoard";
import ResolutionMetrics from "@/components/cases/ResolutionMetrics";
import CategoryMetrics from "@/components/cases/CategoryMetrics";

export default function CaseList() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState("list");

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ["cases"],
    queryFn: () => base44.entities.Case.filter({ created_by_id: user?.id }, "-created_date"),
  });

  const filtered = cases.filter((c) => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.organisation_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    const matchCategory = categoryFilter === "all" || c.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-black text-foreground">My Cases</h1>
          <p className="text-sm text-muted-foreground mt-0.5 font-bold">{cases.length} total cases</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "kanban" ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Kanban view"
            >
              <Kanban className="w-4 h-4" />
            </button>
          </div>
          <Link to="/new-case">
            <Button className="gap-2 font-medium">
              <Plus className="w-4 h-4" />
              New Case
            </Button>
          </Link>
        </div>
      </div>

      {/* Resolution Metrics */}
      {!isLoading && cases.length > 0 && <ResolutionMetrics cases={cases} />}

      {/* Category Metrics */}
      {!isLoading && cases.length > 0 && <CategoryMetrics cases={cases} />}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="complaint_sent">Complaint Sent</SelectItem>
            <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
            <SelectItem value="response_received">Response Received</SelectItem>
            <SelectItem value="escalation_ready">Escalation Ready</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="banking">Banking</SelectItem>
            <SelectItem value="insurance">Insurance</SelectItem>
            <SelectItem value="tenancy">Tenancy</SelectItem>
            <SelectItem value="telco">Telco</SelectItem>
            <SelectItem value="utilities">Utilities</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      {viewMode === "kanban" && !isLoading && (
        <KanbanBoard cases={filtered} />
      )}

      {/* Case List */}
      {viewMode === "list" && isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-5 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-3" />
              <div className="h-5 bg-muted rounded w-2/3 mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : viewMode === "list" && filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <p className="text-muted-foreground text-sm">
            {cases.length === 0 ? "No cases yet. Create your first one." : "No cases match your filters."}
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {filtered.map((c, i) => (
            <CaseCard key={c.id} caseItem={c} index={i} />
          ))}
        </div>
      ) : null}
    </div>
  );
}