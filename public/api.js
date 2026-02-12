export const api = {
    token: localStorage.getItem('jwt_token'),

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('jwt_token', token);
        } else {
            localStorage.removeItem('jwt_token');
        }
    },

    getUser() {
        const user = localStorage.getItem('user_info');
        return user ? JSON.parse(user) : null;
    },

    setUser(user) {
        if (user) {
            localStorage.setItem('user_info', JSON.stringify(user));
        } else {
            localStorage.removeItem('user_info');
        }
    },

    async login(usuario, password) {
        const res = await fetch('/.netlify/functions/auth-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });
        const data = await res.json();
        if (res.ok) {
            this.setToken(data.token);
            this.setUser(data.user);
        }
        return data;
    },

    async register(userData) {
        const res = await fetch('/.netlify/functions/auth-register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        return res.json();
    },

    async logout() {
        this.setToken(null);
        this.setUser(null);
        window.location.href = '/login.html';
    },

    async fetch(url, options = {}) {
        const headers = {
            ...options.headers,
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
        return fetch(url, { ...options, headers });
    }
};
