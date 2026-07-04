import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ||'https://a1deal-og-server.onrender.com/api' ||'http://localhost:5002/api',
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
    }
    return Promise.reject(err);
  }
);

export default api;
