import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/common/Logo';

const STEPS = ['Goal', 'Budget', 'Cities'];

const GOALS = [
  { id: 'buy', icon: 'home', label: 'Buy a Home', desc: 'Find my dream property to own' },
  { id: 'invest', icon: 'trending_up', label: 'Invest', desc: 'Grow wealth through real estate' },
  { id: 'mortgage', icon: 'account_balance', label: 'Get a Mortgage', desc: 'Pre-approve my home loan' },
];

const BUDGETS = [
  { id: 'u50', label: 'Under ₹50 L' },
  { id: '50-1cr', label: '₹50 L – 1 Cr' },
  { id: '1-2cr', label: '₹1 – 2 Cr' },
  { id: '2-5cr', label: '₹2 – 5 Cr' },
  { id: '5cr+', label: 'Above ₹5 Cr' },
];

const CITIES = ['Mumbai', 'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Delhi NCR', 'Kolkata', 'Ahmedabad', 'Goa', 'Jaipur'];

export default function WelcomeOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState(null);
  const [budget, setBudget] = useState(null);
  const [cities, setCities] = useState([]);

  const toggleCity = (city) => {
    setCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
  };

  const canNext = [goal !== null, budget !== null, cities.length > 0][step];

  const handleFinish = () => navigate('/buyer');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f5f3ff] via-white to-[#fdf2f2] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo variant="compact" size="lg" />
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${i <= step ? 'bg-[#4900e5] text-white' : 'bg-slate-200 text-slate-400'}`}>
                {i < step ? <span className="material-icons-outlined text-base">check</span> : i + 1}
              </div>
              <span className={`text-xs font-semibold ${i === step ? 'text-[#4900e5]' : 'text-slate-400'}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`w-8 h-0.5 rounded-full ${i < step ? 'bg-[#4900e5]' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-8">
          {/* Step 0: Goal */}
          {step === 0 && (
            <>
              <h1 className="font-montserrat font-bold text-2xl text-[#0F172A] mb-1">Welcome to A1 Deal!</h1>
              <p className="text-slate-400 text-sm mb-6">What brings you here? We'll personalise your experience.</p>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setGoal(g.id)}
                    className={`text-left p-4 rounded-2xl border-2 transition-all ${goal === g.id ? 'border-[#4900e5] bg-[#4900e5]/5' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className={`material-icons-outlined text-2xl mb-2 block ${goal === g.id ? 'text-[#4900e5]' : 'text-slate-400'}`}>{g.icon}</span>
                    <p className={`font-semibold text-sm ${goal === g.id ? 'text-[#4900e5]' : 'text-[#0F172A]'}`}>{g.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{g.desc}</p>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 1: Budget */}
          {step === 1 && (
            <>
              <h1 className="font-montserrat font-bold text-2xl text-[#0F172A] mb-1">What's your budget?</h1>
              <p className="text-slate-400 text-sm mb-6">We'll show you properties within your range.</p>
              <div className="space-y-2">
                {BUDGETS.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setBudget(b.id)}
                    className={`w-full text-left px-5 py-3.5 rounded-xl border-2 font-semibold text-sm transition-all ${budget === b.id ? 'border-[#4900e5] bg-[#4900e5]/5 text-[#4900e5]' : 'border-slate-200 text-[#0F172A] hover:border-slate-300'}`}
                  >
                    {b.label}
                    {budget === b.id && <span className="material-icons-outlined text-base float-right">check_circle</span>}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Cities */}
          {step === 2 && (
            <>
              <h1 className="font-montserrat font-bold text-2xl text-[#0F172A] mb-1">Preferred cities?</h1>
              <p className="text-slate-400 text-sm mb-6">Select one or more cities. You can change this later.</p>
              <div className="flex flex-wrap gap-2">
                {CITIES.map(city => (
                  <button
                    key={city}
                    onClick={() => toggleCity(city)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${cities.includes(city) ? 'border-[#4900e5] bg-[#4900e5]/5 text-[#4900e5]' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  >
                    {cities.includes(city) && <span className="material-icons-outlined text-sm align-middle mr-1">check</span>}
                    {city}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition"
              >
                Back
              </button>
            )}
            <button
              onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : handleFinish()}
              disabled={!canNext}
              className="flex-1 py-3 rounded-xl bg-[#4900e5] text-white font-bold text-sm hover:bg-[#6236ff] transition disabled:opacity-40"
            >
              {step < STEPS.length - 1 ? 'Continue' : 'Explore Properties →'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-300 mt-5">
          <button onClick={() => navigate('/buyer')} className="hover:text-slate-500">Skip for now</button>
        </p>
      </div>
    </div>
  );
}
