import MortgageHub from '../../../components/common/MortgageHub';
import WhatsAppGroupCard from '../../../components/common/WhatsAppGroupCard';

export default function MortgageListing() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center gap-2 mb-1">
        <span>💰</span>
        <h2 className="font-montserrat font-bold text-xl text-slate-800">Property Deals</h2>
      </div>
      <p className="text-slate-500 text-sm mb-5">
        Save 30–40% Compared to Market Prices
      </p>
      <div className="mb-5">
        <WhatsAppGroupCard type="mortgage" />
      </div>
      <MortgageHub portalColor="#4900e5" scheduleVisitEnabled />
    </div>
  );
}
