import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Calendar, FileText, Settings } from "lucide-react";

interface UserNavProps {
  activeTab: string;
  setActiveTab: (tab: "doctors" | "appointments" | "profile" | "history") => void;
}

export const UserNav = ({ activeTab, setActiveTab }: UserNavProps) => {
  const navItems = [
    { id: "doctors", label: "Doctor List", icon: User },
    { id: "appointments", label: "Appointments List", icon: Calendar },
    { id: "profile", label: "Profile Management", icon: Settings },
    { id: "history", label: "Medical History", icon: FileText }
  ];

  return (
    <Card>
      <CardContent className="p-4">
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab(item.id as any)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
};