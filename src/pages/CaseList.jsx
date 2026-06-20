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
    queryFn: () => base44.entities.Case.filter({ created_by_id: user?.id }, "-created_date", 100),
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
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-2 border-primary/30 rounded-2xl p-6 sm:p-8">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-black text-primary mb-1 uppercase tracking-wider">Case Management</p>
            <h1 className="text-3xl sm:text-4xl font-display font-black text-foreground leading-tight">My Cases</h1>
            <p className="text-base text-foreground font-bold mt-1">{cases.length} total cases</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-card border-2 border-border rounded-xl p-1.5 gap-1 shadow-lg">
              <button
                onClick={() => setViewMode("list")}
                className={`p-3 rounded-lg transition-all ${viewMode === "list" ? "bg-primary text-white shadow-md" : "text-foreground hover:bg-secondary/50"}`}
                title="List view"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-3 rounded-lg transition-all ${viewMode === "kanban" ? "bg-primary text-white shadow-md" : "text-foreground hover:bg-secondary/50"}`}
                title="Kanban view"
              >
                <Kanban className="w-5 h-5" />
              </button>
            </div>
            <Link to="/new-case">
              <Button size="lg" className="gap-2 font-bold text-lg px-6 h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90 shadow-lg shadow-primary/30">
                <Plus className="w-5 h-5" />
                New Case
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Resolution Metrics */}
      {!isLoading && cases.length > 0 && <ResolutionMetrics cases={cases} />}

      {/* Category Metrics */}
      {!isLoading && cases.length > 0 && <CategoryMetrics cases={cases} />}

      {/* Filters */}
      <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search cases..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 h-14 text-lg font-bold border-2"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48 h-14 text-lg font-bold border-2">
              <SelectValue placeholder="Filter by Status" />
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
            <SelectTrigger className="w-full sm:w-44 h-14 text-lg font-bold border-2">
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