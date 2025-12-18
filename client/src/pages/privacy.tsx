import { Link } from "wouter";

import { AppBackground } from "@/components/layout/AppBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPage() {
  return (
    <AppBackground>
      <div className="h-dvh w-full overflow-auto">
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="type-display">Politica de Privacidade</h1>
              <p className="type-caption">
                Versao de rascunho (conteudo placeholder).
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/login">Voltar</Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="type-title">Principios</CardTitle>
              <CardDescription>
                Este texto e temporario. Vamos substituir pelo documento oficial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>
                Coletamos apenas o necessario para oferecer sua experiencia (ex:
                autenticacao, preferencias e conteudo).
              </p>
              <p>
                Seus dados sao tratados com cuidado e boas praticas de
                seguranca. Voce pode solicitar informacoes ou exclusao quando
                aplicavel.
              </p>
              <p>
                Ao evoluir integracoes (ex: login social), vamos atualizar este
                documento com detalhes do que muda.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppBackground>
  );
}
