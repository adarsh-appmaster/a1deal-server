import { useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { validateForm } from '../../validation/validate';
import { changePasswordSchema } from '../../validation/schemas';

const INP = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition';

export default function ChangePasswordModal({ onClose, forced = false }) {
  const { applyToken } = useAuth();
  const [form, setForm]       = useState({ current: '', next: '', confirm: '' });
  const [saving, setSaving]   = useState(false);
  const [done, setDone]       = useState(false);
  const [err, setErr]         = useState('');
  const [show, setShow]       = useState({ current: false, next: false, confirm: false });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function toggle(k)  { setShow(s => ({ ...s, [k]: !s[k] })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr('');
    const { errors } = validateForm(changePasswordSchema, {
      currentPassword: form.current, newPassword: form.next, confirm: form.confirm,
    });
    if (errors) { setErr(errors.currentPassword || errors.newPassword || errors.confirm); return; }
    setSaving(true);
    try {
      const { data } = await api.patch('/auth/change-password', {
        currentPassword: form.current,
        newPassword:     form.next,
      });
      // Backend rotates the token on password change — adopt it so we stay logged in.
      applyToken(data?.token);
      setDone(true);
    } catch (ex) {
      setErr(ex.response?.data?.message || 'Failed to change password.');
    }
    setSaving(false);
  }

  const eye = (field) => (
    <button type="button" tabIndex={-1} onClick={() => toggle(field)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
      <span className="material-icons-outlined text-base">{show[field] ? 'visibility_off' : 'visibility'}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={forced ? undefined : onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="material-icons-outlined text-primary text-lg">lock_reset</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-montserrat font-bold text-base text-slate-800">
              {forced ? 'Set Your New Password' : 'Change Password'}
            </h2>
            {forced && <p className="text-xs text-amber-600">You must change your password before continuing.</p>}
          </div>
          {!forced && (
            <button onClick={onClose} aria-label="Close"
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600">
              <span className="material-icons-outlined text-lg">close</span>
            </button>
          )}
        </div>

        <div className="px-6 py-5">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                <span className="material-icons-outlined text-emerald-600 text-3xl">check_circle</span>
              </div>
              <h3 className="font-montserrat font-bold text-slate-800 mb-1">Password Updated!</h3>
              <p className="text-slate-500 text-sm mb-5">Your password has been changed successfully.</p>
              <button onClick={onClose}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition">
                Continue
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {forced && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
                  <span className="material-icons-outlined text-sm text-amber-500 flex-shrink-0">info</span>
                  Your account was set up with a temporary password. Please set a personal password to secure your account.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  {forced ? 'Temporary Password' : 'Current Password'}
                </label>
                <div className="relative">
                  <input type={show.current ? 'text' : 'password'} className={INP} value={form.current}
                    onChange={e => set('current', e.target.value)}
                    placeholder={forced ? 'Enter temporary password' : 'Enter current password'} />
                  {eye('current')}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">New Password</label>
                <div className="relative">
                  <input type={show.next ? 'text' : 'password'} className={INP} value={form.next}
                    onChange={e => set('next', e.target.value)} placeholder="Min 6 characters" />
                  {eye('next')}
                </div>
                {form.next && form.next.length < 6 && (
                  <p className="text-xs text-rose-500 mt-1">Too short — minimum 6 characters</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Confirm New Password</label>
                <div className="relative">
                  <input type={show.confirm ? 'text' : 'password'} className={INP} value={form.confirm}
                    onChange={e => set('confirm', e.target.value)} placeholder="Repeat new password" />
                  {eye('confirm')}
                </div>
                {form.confirm && form.next !== form.confirm && (
                  <p className="text-xs text-rose-500 mt-1">Passwords do not match</p>
                )}
              </div>

              {err && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs">
                  <span className="material-icons-outlined text-sm">error_outline</span>
                  {err}
                </div>
              )}

              <button type="submit" disabled={saving}
                className="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-container transition disabled:opacity-60">
                {saving ? 'Saving…' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
