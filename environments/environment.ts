// ─────────────────────────────────────────────────────────────
// MediConnect — Environment (development)
// Backend: Spring Boot monolith on :8080
// Angular proxy (/proxy.conf.json) forwards /api and /ws to :8080
// ─────────────────────────────────────────────────────────────
export const environment = {
  production: false,
  // All API calls use relative /api — Angular dev proxy forwards to localhost:8080
  apiUrl: '/api',
  // SockJS WebSocket endpoint on the monolith
  wsUrl: 'http://localhost:8080/ws'
};
