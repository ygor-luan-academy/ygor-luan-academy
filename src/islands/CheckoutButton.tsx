import { useState, type FormEvent } from 'react';

interface CheckoutButtonProps {
  fullWidth?: boolean;
}

export default function CheckoutButton({ fullWidth = false }: CheckoutButtonProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json() as { checkoutUrl?: string; error?: string };

      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? 'Erro ao gerar checkout');
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={fullWidth ? 'w-full' : 'flex gap-2'}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="Seu melhor e-mail"
        className="input-field"
        style={{ flex: fullWidth ? undefined : '1' }}
      />
      <button
        type="submit"
        disabled={loading}
        className={`btn-primary whitespace-nowrap ${fullWidth ? 'w-full mt-3' : ''}`}
      >
        {loading ? 'Aguarde...' : 'Quero começar →'}
      </button>
      {error && <p className="text-red-400 text-xs mt-2 col-span-full">{error}</p>}
    </form>
  );
}
