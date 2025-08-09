import { Card, CardContent } from "@/components/ui/card";

export const ConsultationManagement = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Consultation Management</h2>

      {/* Coming Soon Banner */}
      <Card>
        <CardContent className="py-16">
          <div className="text-center space-y-4">
            <div className="text-6xl">🚧</div>
            <h3 className="text-2xl font-semibold text-muted-foreground">Coming Soon</h3>
            <p className="text-muted-foreground">
              Consultation management features are currently under development.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};