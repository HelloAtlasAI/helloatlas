import { useState, useEffect } from "react";
import { UserProfile } from "@/hooks/useUserProfile";
import { AIState } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Check, X } from "lucide-react";

interface PersonalGreetingProps {
  profile: UserProfile | null;
  aiState: AIState;
  onUpdateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const PersonalGreeting = ({ profile, aiState, onUpdateProfile }: PersonalGreetingProps) => {
  const [greeting, setGreeting] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const hour = new Date().getHours();
    let timeGreeting = "Hello";
    
    if (hour >= 5 && hour < 12) {
      timeGreeting = "Good morning";
    } else if (hour >= 12 && hour < 17) {
      timeGreeting = "Good afternoon";
    } else if (hour >= 17 && hour < 21) {
      timeGreeting = "Good evening";
    } else {
      timeGreeting = "Good night";
    }

    const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const isWeekend = dayOfWeek === "Saturday" || dayOfWeek === "Sunday";
    
    let suffix = "";
    if (isWeekend) {
      suffix = "Happy " + dayOfWeek + "! 🌟";
    } else if (dayOfWeek === "Friday") {
      suffix = "Happy Friday! Almost weekend! 🎉";
    } else if (dayOfWeek === "Monday") {
      suffix = "Hope you had a great weekend!";
    }

    setGreeting(`${timeGreeting}${suffix ? ` - ${suffix}` : ""}`);
  }, []);

  const displayName = profile?.nickname || profile?.first_name || profile?.display_name || "there";

  const handleSaveName = async () => {
    if (editName.trim()) {
      await onUpdateProfile({ first_name: editName.trim() });
    }
    setIsEditingName(false);
  };

  const statusMessage = () => {
    switch (aiState) {
      case "listening":
        return "I'm listening...";
      case "thinking":
        return "Let me think about that...";
      case "speaking":
        return "Here's what I found...";
      default:
        return "How can I help you today?";
    }
  };

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        {isEditingName ? (
          <div className="flex items-center gap-2">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Your name"
              className="w-40 h-8 bg-dashboard-muted/30 border-dashboard-border text-dashboard-foreground"
              autoFocus
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-dashboard-success hover:bg-dashboard-success/20"
              onClick={handleSaveName}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-dashboard-muted hover:bg-dashboard-muted/20"
              onClick={() => setIsEditingName(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-dashboard-foreground">
              {greeting}, <span className="text-dashboard-primary">{displayName}</span>!
            </h1>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-dashboard-muted hover:text-dashboard-foreground hover:bg-dashboard-muted/20"
              onClick={() => {
                setEditName(profile?.first_name || "");
                setIsEditingName(true);
              }}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
      
      <p className="text-sm text-dashboard-muted animate-pulse">
        {statusMessage()}
      </p>
    </div>
  );
};
