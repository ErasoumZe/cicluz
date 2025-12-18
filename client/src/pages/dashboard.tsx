import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  BookOpen,
  MessageCircle,
  Play,
  Calendar,
  Brain,
  TrendingUp,
  Heart,
  Sparkles,
  Sun,
  Moon,
  CloudRain,
  Zap,
} from "lucide-react";

const moodIcons: Record<string, React.ReactNode> = {
  happy: <Sun className="w-5 h-5 text-cicluz-yellow" />,
  calm: <Moon className="w-5 h-5 text-cicluz-blue" />,
  sad: <CloudRain className="w-5 h-5 text-cicluz-purple" />,
  anxious: <Zap className="w-5 h-5 text-cicluz-orange" />,
  neutral: <Heart className="w-5 h-5 text-cicluz-teal" />,
};

type DashboardResponse = {
  dashboard?: {
    energiaEmocional?: number;
    estadoSPlus?: number;
    estadoISMinus?: number;
    progressoSemanal?: {
      diario?: number;
      meditacao?: number;
      exercicios?: number;
    };
  };
};

type SuggestionsResponse = { suggestions?: string[] };

function EmotionalEnergyCircle({ sPlus, isMinus }: { sPlus: number; isMinus: number }) {
  const total = sPlus + isMinus;
  const positivePercent = total > 0 ? (sPlus / total) * 100 : 50;
  const circumference = 2 * Math.PI * 45;
  const positiveOffset = circumference - (circumference * positivePercent) / 100;

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="url(#energyGradient)"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={positiveOffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(262, 70%, 55%)" />
            <stop offset="50%" stopColor="hsl(195, 85%, 55%)" />
            <stop offset="100%" stopColor="hsl(160, 84%, 45%)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-light">{Math.round(positivePercent)}%</span>
        <span className="text-xs text-muted-foreground">Energia S+</span>
      </div>
    </div>
  );
}

function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  gradient,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
}) {
  return (
    <Link href={href}>
      <Card className="group cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover-elevate-2">
        <CardContent className="p-5 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center flex-shrink-0`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-sm group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-xs text-muted-foreground truncate">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { user, token } = useAuth();

  const { data: dashboardData, isLoading } = useQuery<DashboardResponse>({
    queryKey: ["/api/dashboard"],
    enabled: !!token,
  });

  const { data: suggestionsData } = useQuery<SuggestionsResponse>({
    queryKey: ["/api/dashboard/suggestions"],
    enabled: !!token,
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const dashboard = dashboardData?.dashboard || {
    energiaEmocional: 65,
    estadoSPlus: 70,
    estadoISMinus: 30,
    progressoSemanal: { diario: 4, meditacao: 3, exercicios: 2 },
  };

  const suggestions = suggestionsData?.suggestions || [
    "Pratique 5 minutos de respiracao consciente",
    "Registre suas emocoes no diario",
    "Assista ao video recomendado do dia",
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="type-display" data-testid="text-greeting">
            {greeting()}, <span className="font-medium">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-muted-foreground">Como voce esta se sentindo hoje?</p>
        </div>
        <Badge variant="outline" className="w-fit rounded-full px-4 py-1.5 gap-2">
          <Sparkles className="w-4 h-4 text-cicluz-purple" />
          <span>Dia {Math.floor(Math.random() * 30) + 1} da sua jornada</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Heart className="w-5 h-5 text-cicluz-pink" />
              Energia Emocional
            </CardTitle>
            <CardDescription>Seu estado atual S+ vs IS-</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <EmotionalEnergyCircle
              sPlus={dashboard.estadoSPlus ?? 70}
              isMinus={dashboard.estadoISMinus ?? 30}
            />
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-xl bg-cicluz-green/10">
                <p className="text-2xl font-light text-cicluz-green">{dashboard.estadoSPlus ?? 70}%</p>
                <p className="text-xs text-muted-foreground">Emocoes S+</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-cicluz-pink/10">
                <p className="text-2xl font-light text-cicluz-pink">{dashboard.estadoISMinus ?? 30}%</p>
                <p className="text-xs text-muted-foreground">Emocoes IS-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cicluz-purple" />
              Sugestoes da IA
            </CardTitle>
            <CardDescription>Recomendacoes personalizadas para hoje</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            {suggestions.map((suggestion: string, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-xl bg-accent/50 transition-colors hover:bg-accent"
              >
                <div className="w-6 h-6 rounded-full bg-cicluz-gradient flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-medium">{index + 1}</span>
                </div>
                <p className="text-sm" data-testid={`text-suggestion-${index}`}>{suggestion}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="type-title mb-4">Acoes Rapidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title="Meu Diario"
            description="Registre suas emocoes"
            icon={BookOpen}
            href="/diario"
            gradient="bg-gradient-to-br from-cicluz-purple to-cicluz-blue"
          />
          <QuickActionCard
            title="Consultorio"
            description="Sessao com IA"
            icon={MessageCircle}
            href="/consultorio"
            gradient="bg-gradient-to-br from-cicluz-blue to-cicluz-teal"
          />
          <QuickActionCard
            title="Trilhas"
            description="Videos terapeuticos"
            icon={Play}
            href="/trilhas"
            gradient="bg-gradient-to-br from-cicluz-teal to-cicluz-green"
          />
          <QuickActionCard
            title="Agenda"
            description="Tarefas do dia"
            icon={Calendar}
            href="/agenda"
            gradient="bg-gradient-to-br from-cicluz-green to-cicluz-yellow"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cicluz-teal" />
            Progresso Semanal
          </CardTitle>
          <CardDescription>Suas atividades nos ultimos 7 dias</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cicluz-purple" />
                Entradas no Diario
              </span>
              <span className="text-muted-foreground">{dashboard.progressoSemanal?.diario || 0}/7</span>
            </div>
            <Progress value={((dashboard.progressoSemanal?.diario || 0) / 7) * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-cicluz-blue" />
                Meditacoes
              </span>
              <span className="text-muted-foreground">{dashboard.progressoSemanal?.meditacao || 0}/5</span>
            </div>
            <Progress value={((dashboard.progressoSemanal?.meditacao || 0) / 5) * 100} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cicluz-teal" />
                Exercicios Corporais
              </span>
              <span className="text-muted-foreground">{dashboard.progressoSemanal?.exercicios || 0}/3</span>
            </div>
            <Progress value={((dashboard.progressoSemanal?.exercicios || 0) / 3) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
