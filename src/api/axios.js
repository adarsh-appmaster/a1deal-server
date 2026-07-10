import axios from 'axios';
import { toast } from '../components/common/Toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL  ||'http://localhost:5002/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only force a redirect when a session actually expired (we had a token).
    // A 401 on a public/guest page (e.g. an embedded component hitting a
    // protected endpoint) must not blow away SPA navigation for guests.
    if (err.response?.status === 401 && localStorage.getItem('a1deal_token')) {
      localStorage.removeItem('a1deal_token');
      localStorage.removeItem('a1deal_user');
      window.location.href = '/';
      return Promise.reject(err);
    }

    // Surface genuinely-unexpected failures (network down / 5xx) so they don't
    // vanish into an empty `catch {}` and leave the user staring at a blank page.
    // Expected 4xx (validation, not-found, etc.) stay page-level to avoid noise.
    const status = err.response?.status;
    if (!err.response) {
      toast.error('Network error — please check your connection and try again.');
    } else if (status >= 500) {
      toast.error('Something went wrong on our end. Please try again in a moment.');
    }
    return Promise.reject(err);
  }
);

export default api;
