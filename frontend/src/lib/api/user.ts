import { apiFetch } from './client';

// Login
export async function loginUser(username: string, password: string) {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  return apiFetch('/api/v1/login/access-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });
}

// Register User
export async function createUser(email: string, username: string, password: string) {
  return apiFetch('/api/v1/users/', {
    method: 'POST',
    body: JSON.stringify({
      email,
      username,
      password,
    }),
  });
}

// Get Current User Information
export async function getCurrentUser() {
  return apiFetch('/api/v1/users/me', {
    method: 'GET',
  });
} 