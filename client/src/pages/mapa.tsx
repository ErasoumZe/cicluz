import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, User, Users, Target, Sparkles, Heart } from "lucide-react";
import { useMemo } from "react";
import type { MapaState } from "@shared/schema";

/* ======================================================
   NODES CONFIG
====================================================== */
const nodes = [
  {
    id: "eu",
    label: "Eu",
    icon: User,
    angle: -90,
    color: "hsl(262 70% 55%)",
  },
  {
    id: "relacoes",
    label: "Relações",
    icon: Users,
    angle: 0,
    color: "hsl(195 85% 55%)",
  },
  {
    id: "realizacao",
    label: "Realização",
    icon: Target,
    angle: 90,
    color: "hsl(160 84% 45%)",
  },
  {
    id: "proposito",
    label: "Propósito",
    icon: Sparkles,
    angle: 180,
    color: "hsl(25 95% 55%)",
  },
];

/* ======================================================
   UTILS
====================================================== */
function polarToCartesian(center: number, radius: number, angle: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(rad),
    y: center + radius * Math.sin(rad),
  };
}

/* ======================================================
   PAGE
====================================================== */
export default function MapaPage() {
  const { token } = useAuth();

  const { data, isLoading } = useQuery<{ mapa?: MapaState }>({
    queryKey: ["/api/mapa"],
    enabled: !!token,
  });

  const mapa = data?.mapa ?? {
    eixoEu: 65,
    eixoRelacoes: 45,
    eixoRealizacao: 70,
    eixoProposito: 55,
  };

  const values = {
    eu: mapa.eixoEu ?? 50,
    relacoes: mapa.eixoRelacoes ?? 50,
    realizacao: mapa.eixoRealizacao ?? 50,
    proposito: mapa.eixoProposito ?? 50,
  };

  const center = 400;
  const radius = 220;

  const positionedNodes = useMemo(() => {
    return nodes.map((n) => {
      const pos = polarToCartesian(center, radius, n.angle);
      return {
        ...n,
        ...pos,
        value: values[n.id as keyof typeof values],
      };
    });
  }, [values]);

  if (isLoading) {
    return (
      <div className="p-10">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="type-display flex items-center gap-2">
          <Brain className="w-6 h-6 text-cicluz-purple" />
          Mapa Mental
        </h1>
        <p className="text-muted-foreground">
          Visualização estratégica da sua jornada
        </p>
      </div>

      {/* MAPA */}
      <Card>
        <svg viewBox="0 0 800 800" className="w-full h-[600px]">
          {/* Connections */}
          {positionedNodes.map((node) => (
            <line
              key={node.id}
              x1={center}
              y1={center}
              x2={node.x}
              y2={node.y}
              stroke="currentColor"
              strokeOpacity="0.15"
              strokeWidth="2"
            />
          ))}

          {/* Central Node */}
          <g>
            <circle
              cx={center}
              cy={center}
              r="60"
              fill="hsl(262 70% 55%)"
              opacity="0.95"
            />
            <text
              x={center}
              y={center + 6}
              textAnchor="middle"
              className="fill-white font-medium"
            >
              EU
            </text>
          </g>

          {/* Outer Nodes */}
          {positionedNodes.map((node) => {
            const Icon = node.icon;
            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="46"
                  fill={node.color}
                  opacity="0.9"
                >
                  <animate
                    attributeName="r"
                    values="46;50;46"
                    dur="4s"
                    repeatCount="indefinite"
                  />
                </circle>

                <text
                  x={node.x}
                  y={node.y - 4}
                  textAnchor="middle"
                  className="fill-white text-sm font-medium"
                >
                  {node.label}
                </text>

                <text
                  x={node.x}
                  y={node.y + 14}
                  textAnchor="middle"
                  className="fill-white text-xs opacity-80"
                >
                  {node.value}%
                </text>
              </g>
            );
          })}
        </svg>
      </Card>

      {/* PERFORMANCE STRIP */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {nodes.map((node) => {
          const Icon = node.icon;
          const value = values[node.id as keyof typeof values];

          return (
            <Card
              key={node.id}
              className="p-4"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5" style={{ color: node.color }} />
                <span className="font-medium">{node.label}</span>
              </div>

              <div className="mt-3 text-2xl font-light">{value}%</div>

              <div className="mt-1 text-xs text-muted-foreground">
                Nível atual de desenvolvimento
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
