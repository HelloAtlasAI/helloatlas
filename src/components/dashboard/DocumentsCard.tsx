import { FileText, FolderOpen, Clock } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { cn } from "@/lib/utils";

interface DocumentsCardProps {
  isFocused?: boolean;
  streamingData?: any[];
}

// Mock documents data
const recentDocs = [
  {
    id: "1",
    name: "Q4 Report.docx",
    type: "document",
    modified: "2 hours ago",
  },
  {
    id: "2",
    name: "Budget 2025.xlsx",
    type: "spreadsheet",
    modified: "Yesterday",
  },
  {
    id: "3",
    name: "Presentation.pptx",
    type: "presentation",
    modified: "3 days ago",
  },
];

export const DocumentsCard = ({ isFocused, streamingData }: DocumentsCardProps) => {
  return (
    <DashboardCard
      glowing={isFocused}
      header={
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-dashboard-warning" />
          <span className="font-medium text-dashboard-foreground">Recent Files</span>
        </div>
      }
      className={cn("h-full", isFocused && "animate-pulse")}
    >
      <div className="space-y-2">
        {recentDocs.map((doc, index) => (
          <div
            key={doc.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-dashboard-muted/20 cursor-pointer transition-all"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-8 h-8 rounded-lg bg-dashboard-muted/30 flex items-center justify-center">
              <FileText className="w-4 h-4 text-dashboard-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-dashboard-foreground truncate">
                {doc.name}
              </p>
              <div className="flex items-center gap-1 text-xs text-dashboard-muted">
                <Clock className="w-3 h-3" />
                {doc.modified}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
};
