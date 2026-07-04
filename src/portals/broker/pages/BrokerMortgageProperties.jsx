import MortgageHub from '../../../components/common/MortgageHub';
import WhatsAppGroupCard from '../../../components/common/WhatsAppGroupCard';
import { useAuth } from '../../../context/AuthContext';

export default function BrokerMortgageProperties() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-xl text-slate-800">Mortgage Properties</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Bank repo and auction properties filtered to your registered city, area and pincodes.
          Use the area chips to switch zones or search any city.
        </p>
      </div>
      <WhatsAppGroupCard type="mortgage" />
      <MortgageHub portalColor="#ff5a5f" />
    </div>
  );
}
