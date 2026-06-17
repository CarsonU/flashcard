import type { Card, Deck } from './types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  decks: {
    list: () => request<Deck[]>('/decks'),
    create: (title: string) =>
      request<Deck>('/decks', { method: 'POST', body: JSON.stringify({ title }) }),
    update: (id: string, title: string) =>
      request<Deck>(`/decks/${id}`, { method: 'PATCH', body: JSON.stringify({ title }) }),
    delete: (id: string) => request<void>(`/decks/${id}`, { method: 'DELETE' }),
    cards: (id: string) => request<Card[]>(`/decks/${id}/cards`),
    session: (id: string) => request<Card[]>(`/decks/${id}/session`),
    createCard: (id: string, data: Partial<Card>) =>
      request<Card>(`/decks/${id}/cards`, { method: 'POST', body: JSON.stringify(data) }),
  },
  cards: {
    update: (id: string, data: Partial<Card>) =>
      request<Card>(`/cards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: 'focus' | 'learned') =>
      request<Card>(`/cards/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    delete: (id: string) => request<void>(`/cards/${id}`, { method: 'DELETE' }),
  },
};
