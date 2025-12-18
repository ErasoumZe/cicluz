import { Link } from "wouter";

import { AppBackground } from "@/components/layout/AppBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
  return (
    <AppBackground>
      <div className="h-dvh w-full overflow-auto">
        <div className="p-6 max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="type-display">Termos de Servico</h1>
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
              <CardTitle className="type-title">Resumo</CardTitle>
              <CardDescription>
                Este texto e temporario. Vamos substituir pelo documento oficial.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-relaxed">
              <p>
                Ao usar o CICLUZ, voce concorda em utilizar a plataforma de forma
                responsavel e respeitosa.
              </p>
              <p>
                O CICLUZ nao substitui acompanhamento profissional quando
                necessario. Em caso de emergencia, procure ajuda especializada.
              </p>
              <p>
                Podemos atualizar estes termos periodicamente para evoluir o
                produto com transparencia.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppBackground>
  );
}
