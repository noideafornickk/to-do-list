export type Todo = {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthUser = {
  id: number;
  googleSub: string;
  email: string | null;
  name: string | null;
  picture: string | null;
};

type UpdateTodoPayload = {
  title?: string;
  completed?: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function normalizeErrorMessage(data: unknown, raw: string): string {
  if (typeof data === 'object' && data) {
    const typed = data as { message?: unknown };

    if (Array.isArray(typed.message)) {
      return typed.message.map(String).join(', ');
    }

    if (typed.message) {
      return String(typed.message);
    }
  }

  return raw || 'Request failed';
}

async function apiRequest<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  if (!API_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  const raw = await response.text();
  const data = raw ? safeJsonParse(raw) : null;

  if (!response.ok) {
    const message = normalizeErrorMessage(data, raw);
    throw new Error(`HTTP ${response.status}: ${message}`);
  }

  return data as T;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function getMe(token: string): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me', token);
}

export function listTodos(token: string): Promise<Todo[]> {
  return apiRequest<Todo[]>('/todos', token);
}

export function createTodo(token: string, title: string): Promise<Todo> {
  return apiRequest<Todo>('/todos', token, {
    method: 'POST',
    body: JSON.stringify({ title }),
  });
}

export function updateTodo(
  token: string,
  id: number,
  data: UpdateTodoPayload,
): Promise<Todo> {
  return apiRequest<Todo>(`/todos/${id}`, token, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTodo(token: string, id: number): Promise<void> {
  await apiRequest<unknown>(`/todos/${id}`, token, {
    method: 'DELETE',
  });
}
