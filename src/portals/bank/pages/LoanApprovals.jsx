export default function LoanApprovals() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="font-montserrat font-bold text-2xl text-on-surface">Loan Approvals</h1>
        <p className="text-on-surface-variant text-sm mt-1">Applications pending final bank approval</p>
      </div>

      <div className="card p-10 text-center text-on-surface-variant">
        <span className="material-icons-outlined text-4xl mb-3 block">fact_check</span>
        <p className="text-sm font-semibold text-on-surface mb-1">No loan applications yet</p>
        <p className="text-sm">This feature is coming soon — approvals will appear here once the loan application workflow is available.</p>
      </div>
    </div>
  );
}
