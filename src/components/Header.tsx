export const Header = () => {
  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* Left Section */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-blue-600">অন্যরকম</h1>
            <p className="text-lg" style={{ color: '#282828' }}>হিলিং সার্ভিসেস</p>
          </div>
          
          {/* Right Section */}
          <div className="flex flex-col text-right">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Dr. Md. Shojib Hossen Sipo
            </h2>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>MBBS, FCGP, MPH, DUMS (DU), Diploma in Asthma (UK), CCD (BIRDEM),</p>
              <p>PG Diploma in Diabetes (UK), EMO, Medical College For Women and Hospital</p>
              <p>Ex-Lec. Shaheed Monsur Ali Medical College and Hospital</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};