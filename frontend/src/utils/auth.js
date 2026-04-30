export function saveAuth(access, refresh, user) {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function isAuthenticated() {
  return !!localStorage.getItem("access");
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
}