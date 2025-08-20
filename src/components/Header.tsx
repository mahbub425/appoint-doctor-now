import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
          {/* Left Section */}
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">অন্যরকম</h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">হিলিং সার্ভিসেস</p>
          </div>
          
          {/* Right Section */}
          <div className="flex w-full sm:w-auto">
            <Button 
              onClick={() => navigate("/auth")}
              className="px-4 py-2 sm:px-6 w-full sm:w-auto text-sm sm:text-base"
              size="sm"
            >
              Login
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};