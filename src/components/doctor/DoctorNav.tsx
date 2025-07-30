import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, Calendar, FileText, Settings } from "lucide-react";

interface DoctorNavProps {
  activeTab: string;
  setActiveTab: (tab: "profile" | "schedule" | "appointments" | "consultations") => void;
}

export const DoctorNav = ({ activeTab, setActiveTab }: DoctorNavProps) => {
  const navItems = [
    { id: "profile", label: "Profile Management", icon: Settings },
    { id: "schedule", label: "Schedule Viewing", icon: Calendar },
    { id: "appointments", label: "Appointment Management", icon: User },
    { id: "consultations", label: "Consultation Management", icon: FileText }
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