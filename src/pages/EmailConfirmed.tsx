import { useNavigate } from 'react-router-dom';

export default function EmailConfirmed() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-xl font-bold text-foreground mb-3">Email potvrđen!</h1>
        <p className="text-muted-foreground mb-8">
          Hvala što ste se pridružili ZadarIQ zajednici.
        </p>
        <button
          onClick={() => navigate('/owner/login')}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-colors"
        >
          Prijavi se i postavi profil →
        </button>
      </div>
    </div>
  );
}
