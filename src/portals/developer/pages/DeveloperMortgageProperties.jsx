import MortgageHub from '../../../components/common/MortgageHub';
import WhatsAppGroupCard from '../../../components/common/WhatsAppGroupCard';

export default function DeveloperMortgageProperties() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-montserrat font-bold text-xl text-slate-800">Mortgage Properties</h1>
        <p className="text-sm text-slate-500 mt-0.5">Bank repo and auction properties in your area and admin-assigned areas</p>
      </div>
      <WhatsAppGroupCard type="mortgage" />
      <MortgageHub portalColor="#0369a1" />
    </div>
  );
}
