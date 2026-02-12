'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CredentialResponse,
  GoogleLogin,
  GoogleOAuthProvider,
} from '@react-oauth/google';
import { Loader2, LogOut, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  AuthUser,
  createTodo,
  deleteTodo,
  getMe,
  listTodos,
  Todo,
  updateTodo,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const TOKEN_STORAGE_KEY = 'todo_google_id_token';

function HomePage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(token && user);

  const ensureToken = useCallback((): string => {
    if (!token) {
      throw new Error('Voce precisa entrar com Google para continuar');
    }

    return token;
  }, [token]);

  const resetSession = useCallback(() => {
    setToken(null);
    setUser(null);
    setTodos([]);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const handleApiError = useCallback(
    (err: unknown, fallbackMessage: string) => {
      const message = err instanceof Error ? err.message : fallbackMessage;
      setError(message);

      if (message.includes('HTTP 401')) {
        resetSession();
      }
    },
    [resetSession],
  );

  const loadTodos = useCallback(
    async (authToken: string) => {
      setLoading(true);
      setError(null);

      try {
        const data = await listTodos(authToken);
        setTodos(data);
      } catch (err) {
        handleApiError(err, 'Falha ao carregar tarefas');
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
  );

  const bootstrapSession = useCallback(
    async (authToken: string) => {
      setAuthLoading(true);
      setError(null);

      try {
        const me = await getMe(authToken);
        setToken(authToken);
        setUser(me);
        localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
        await loadTodos(authToken);
      } catch (err) {
        resetSession();
        handleApiError(err, 'Falha ao validar login');
      } finally {
        setAuthLoading(false);
      }
    },
    [handleApiError, loadTodos, resetSession],
  );

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!stored) {
      setAuthLoading(false);
      return;
    }

    void bootstrapSession(stored);
  }, [bootstrapSession]);

  async function handleCreate() {
    const title = newTitle.trim();
    if (!title) {
      setError('Digite um titulo valido');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const authToken = ensureToken();
      await createTodo(authToken, title);
      setNewTitle('');
      await loadTodos(authToken);
    } catch (err) {
      handleApiError(err, 'Falha ao criar tarefa');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(todo: Todo, checked: boolean | 'indeterminate') {
    if (checked === 'indeterminate') {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const authToken = ensureToken();
      await updateTodo(authToken, todo.id, { completed: checked });
      await loadTodos(authToken);
    } catch (err) {
      handleApiError(err, 'Falha ao atualizar tarefa');
    } finally {
      setSaving(false);
    }
  }

  function openEditDialog(todo: Todo) {
    setEditingTodo(todo);
    setEditTitle(todo.title);
    setIsDialogOpen(true);
  }

  async function handleSaveEdit() {
    if (!editingTodo) {
      return;
    }

    const title = editTitle.trim();
    if (!title) {
      setError('Digite um titulo valido');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const authToken = ensureToken();
      await updateTodo(authToken, editingTodo.id, { title });
      setIsDialogOpen(false);
      setEditingTodo(null);
      setEditTitle('');
      await loadTodos(authToken);
    } catch (err) {
      handleApiError(err, 'Falha ao editar tarefa');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    setSaving(true);
    setError(null);

    try {
      const authToken = ensureToken();
      await deleteTodo(authToken, id);
      await loadTodos(authToken);
    } catch (err) {
      handleApiError(err, 'Falha ao excluir tarefa');
    } finally {
      setSaving(false);
    }
  }

  function onGoogleSuccess(response: CredentialResponse) {
    const credential = response.credential;

    if (!credential) {
      setError('Nao foi possivel obter o token do Google');
      return;
    }

    void bootstrapSession(credential);
  }

  const displayName = useMemo(() => {
    if (!user) {
      return '';
    }

    return user.name || user.email || 'Usuario';
  }, [user]);

  if (authLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          Validando sessao...
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-900">To Do CRUD</h1>
          <p className="mt-2 text-sm text-slate-600">
            Entre com sua conta Google para acessar suas tarefas.
          </p>

          <div className="mt-6 flex justify-start">
            <GoogleLogin onSuccess={onGoogleSuccess} onError={() => setError('Falha no login Google')} />
          </div>

          {error ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">To Do CRUD</h1>
            <p className="mt-2 text-sm text-slate-600">Logado como {displayName}</p>
          </div>
          <Button variant="outline" onClick={resetSession}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Nova tarefa"
            disabled={saving}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleCreate();
              }
            }}
          />
          <Button onClick={() => void handleCreate()} disabled={saving}>
            <Plus className="h-4 w-4" />
            Adicionar
          </Button>
        </div>

        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando tarefas...
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {todos.length === 0 ? (
              <li className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                Nenhuma tarefa criada.
              </li>
            ) : (
              todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Checkbox
                      checked={todo.completed}
                      disabled={saving}
                      onCheckedChange={(checked) => void handleToggle(todo, checked)}
                    />
                    <span
                      className={`truncate text-sm ${
                        todo.completed ? 'text-slate-500 line-through' : 'text-slate-900'
                      }`}
                    >
                      {todo.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(todo)}
                      disabled={saving}
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => void handleDelete(todo.id)}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar tarefa</DialogTitle>
          </DialogHeader>
          <Input
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            placeholder="Titulo da tarefa"
            disabled={saving}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleSaveEdit();
              }
            }}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSaveEdit()} disabled={saving}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function RootPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-10">
        <section className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          NEXT_PUBLIC_GOOGLE_CLIENT_ID nao configurado no apps/web/.env.local
        </section>
      </main>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <HomePage />
    </GoogleOAuthProvider>
  );
}
