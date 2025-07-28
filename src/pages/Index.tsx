import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Stethoscope, Shield, Calendar, Clock, Users } from 'lucide-react';
import { AppointmentForm } from '@/components/AppointmentForm';
import { AppointmentList } from '@/components/AppointmentList';
import { StorageManager } from '@/utils/storage';

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [availableDate, setAvailableDate] = useState<string | null>(null);
  const [isBookingActive, setIsBookingActive] = useState(true);

  useEffect(() => {
    const fetchAvailableDate = async () => {
      const date = await StorageManager.getDoctorAvailableDate();
      setAvailableDate(date);

      // Check if the date is valid for booking
      const today = new Date().toISOString().split('T')[0];
      if (!date || new Date(date) < new Date(today)) {
        setIsBookingActive(false);
      } else {
        setIsBookingActive(true);
      }
    };
    fetchAvailableDate();
  }, []);

  const handleAppointmentBooked = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-2 sm:px-4 py-6">
          <div className="flex items-start justify-between">
            {/* Left: Onnorokom & Healing Services */}
            <div className="flex flex-col items-start">
              <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-primary font-serif drop-shadow-md" style={{fontFamily: 'Noto Serif Bengali, serif'}}>
                অন্যরকম
              </span>
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-normal mt-1" style={{color:'#343434', fontFamily: 'Noto Serif Bengali, serif'}}>
                হিলিং সার্ভিসেস
              </span>
            </div>
            {/* Right: Doctor Info */}
            <div className="flex flex-col items-end text-right">
              <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-emerald-700 font-sans" style={{fontFamily: 'Montserrat, Poppins, Arial, sans-serif'}}>
                Dr. Md. Shojib Hossen Sipo
              </span>
              <span className="text-[15px] text-black font-normal font-sans mt-1" style={{lineHeight: '1.2rem'}}>
                MBBS, FCGP, MPH, DUMS (DU), Diploma in Asthma (UK), CCD (BIRDEM)
              </span>
              <span className="text-[15px] text-black font-normal font-sans" style={{lineHeight: '1.2rem'}}>
                PG Diploma in Diabetes (UK), EMO, Medical College For Women and Hospital
              </span>
              <span className="text-[15px] text-black font-normal font-sans" style={{lineHeight: '1.2rem'}}>
                Ex-Lec. Shaheed Monsur Ali Medical College and Hospital
              </span>
            </div>
          </div>
          {/* Admin Notice */}
          <div className="mt-6 bg-yellow-50 border border-yellow-300 rounded p-3 text-sm text-yellow-900 text-center font-medium">
            ডাক্তারের চেম্বারে আসার পূর্বে অনুগ্রহ করে ওয়েবসাইটটি রিফ্রেশ করে আপনার সিরিয়াল এবং অ্যাপয়েন্টমেন্টের সময় পুনরায় যাচাই করে নিন। কারণ, কোনো কোনো দিন ডাক্তার নির্ধারিত সময়ের চেয়ে আগে বা পরে আসতে পারেন, এছাড়াও আপনার পূর্ববর্তী সিরিয়ালের কেউ অনুপস্থিত থাকেলে আপনার সিরিয়াল এবং সময় পরিবর্তিত হওয়ার সম্ভাবনা থাকে।
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Appointment Booking Form */}
          <div>
            {isBookingActive ? (
              <AppointmentForm onAppointmentBooked={handleAppointmentBooked} />
            ) : (
              <div className="text-center text-red-600 font-medium">
                এই সপ্তাহের জন্য এখনো ডাক্তারের আসার তারিখ নির্ধারণ করা হয়নি। অনুগ্রহ করে পরবর্তীতে চেষ্টা করুন。
              </div>
            )}
          </div>

          {/* Appointment List */}
          <div>
            <AppointmentList refreshTrigger={refreshTrigger} availableDate={availableDate} />
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-card border border-border rounded-lg medical-card">
            <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Easy Booking</h3>
            <p className="text-sm text-muted-foreground">
              Book your doctor appointment with just a few clicks using your employee PIN
            </p>
          </div>
          
          <div className="text-center p-6 bg-card border border-border rounded-lg medical-card">
            <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Flexible Timing</h3>
            <p className="text-sm text-muted-foreground">
              Choose from Follow-up (7 min), New Patient (10 min), or Report Show (12 min)
            </p>
          </div>
          
          <div className="text-center p-6 bg-card border border-border rounded-lg medical-card">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fair Queue</h3>
            <p className="text-sm text-muted-foreground">
              Automatic serial assignment with daily limit of 17 appointments
            </p>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="mt-8 p-4 bg-destructive/10 border border-destructive rounded-lg text-center">
          <p className="text-sm font-medium text-destructive">
            For medical emergencies when daily limit is reached, please contact: 
            <a href="tel:01708166012" className="underline ml-1">01708166012</a>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Index;
