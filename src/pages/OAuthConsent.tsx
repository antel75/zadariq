import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ZadarIQLogo } from "@/components/ZadarIQLogo";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: any; error: any }>;
  approveAuthorization: (id: string) => Promise<{ data: any; error: any }>;
  denyAuthorization: (id: string) => Promise<{ data: any; error: any }>;
};

const oauthApi = () => (supabase.auth as unknown as { oauth: OAuthApi }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<any>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Nedostaje authorization_id.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!active) return;
      if (!sess.session) {
        setNeedsAuth(true);
        return;
      }
      setNeedsAuth(false);
      const { data, error: err } = await oauthApi().getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (err) {
        setError(err.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId, reload]);

  const signInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) return setError(err.message);
    setReload((n) => n + 1);
  };

  const signInWithGoogle = async () => {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.href,
    });
    setBusy(false);
    if ((result as any)?.error) return setError(String((result as any).error.message ?? result));
    setReload((n) => n + 1);
  };

  const decide = async (approve: boolean) => {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await oauthApi().approveAuthorization(authorizationId)
      : await oauthApi().denyAuthorization(authorizationId);
    if (err) {
      setBusy(false);
      return setError(err.message);
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      return setError("Autorizacijski poslužitelj nije vratio povratni URL.");
    }
    window.location.href = target;
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10 bg-background">
      <Card className="w-full max-w-md p-6 space-y-5">
        <div className="flex justify-center">
          <ZadarIQLogo />
        </div>

        {error && (
          <p className="text-sm text-destructive text-center" role="alert">
            {error}
          </p>
        )}

        {needsAuth ? (
          <>
            <h1 className="text-lg font-semibold text-center text-foreground">
              Prijavi se za nastavak
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              Prijava je potrebna kako bi aplikacija dobila pristup u tvoje ime.
            </p>
            <form onSubmit={signInWithPassword} className="space-y-3">
              <Input
                type="email"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Lozinka"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={busy}>
                Prijava
              </Button>
            </form>
            <Button variant="outline" className="w-full" onClick={signInWithGoogle} disabled={busy}>
              Nastavi s Googleom
            </Button>
          </>
        ) : !details ? (
          <p className="text-sm text-muted-foreground text-center">Učitavanje…</p>
        ) : (
          <>
            <h1 className="text-lg font-semibold text-center text-foreground">
              Poveži {details.client?.name ?? "aplikaciju"} sa ZadarIQ
            </h1>
            <p className="text-sm text-muted-foreground">
              {details.client?.name ?? "Klijent"} će moći koristiti ZadarIQ alate u tvoje ime dok si
              prijavljen. Ovo ne zaobilazi pravila pristupa podacima u aplikaciji.
            </p>
            {details.client?.redirect_uri && (
              <p className="text-xs text-muted-foreground break-all">
                Povratna adresa: {details.client.redirect_uri}
              </p>
            )}
            {details.scope && (
              <p className="text-xs text-muted-foreground">Tražena dozvola: {details.scope}</p>
            )}
            <div className="flex gap-3 pt-1">
              <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                Odobri
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                disabled={busy}
                onClick={() => decide(false)}
              >
                Odustani
              </Button>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}