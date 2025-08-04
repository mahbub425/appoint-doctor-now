import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Left Section */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold" style={{ color: '#0000FF' }}>অন্যরকম</h1>
            <p className="text-lg" style={{ color: '#282828' }}>হিলিং সার্ভিসেস</p>
          </div>
          
          {/* Right Section */}
          <div className="flex">
            <Button 
              onClick={() => navigate("/auth")}
              className="px-6 py-2"
            >
              লগিন
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};