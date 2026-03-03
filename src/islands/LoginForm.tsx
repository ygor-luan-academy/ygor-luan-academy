import { useState, type FormEvent } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [mode, setMode] = useState<'login' | 'reset'>('login');

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? 'Credenciais inválidas');
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
      setLoading(false);
    }
  };

  const handleReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Erro ao enviar e-mail');

      setResetSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tente novamente');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'input-field';
  const labelClass = 'block text-sm font-medium text-zinc-300 mb-1';

  if (mode === 'reset') {
    return (
      <form onSubmit={handleReset} className="space-y-4">
        {resetSent ? (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400 text-sm text-center">
            Link enviado! Verifique seu e-mail.
          </div>
        ) : (
          <>
            <div>
              <label className={labelClass}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                placeholder="seu@email.com"
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Enviando...' : 'Enviar link de redefinição'}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setMode('login')}
          className="text-sm text-zinc-400 hover:text-white w-full text-center"
        >
          Voltar ao login
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className={labelClass}>E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <label className={labelClass}>Senha</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={inputClass}
          placeholder="••••••••"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Entrando...' : 'Entrar'}
      </button>

      <button
        type="button"
        onClick={() => setMode('reset')}
        className="text-sm text-zinc-400 hover:text-white w-full text-center"
      >
        Esqueceu a senha?
      </button>
    </form>
  );
}
