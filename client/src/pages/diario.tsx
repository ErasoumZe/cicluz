import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  BookOpen,
  Plus,
  Heart,
  Brain,
  Users,
  Sparkles,
  Sun,
  Moon,
  CloudRain,
  Zap,
  Wind,
  Loader2,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DiarioEntry } from "@shared/schema";

const moodOptions = [
  { value: "happy", label: "Feliz", icon: Sun, color: "text-cicluz-yellow" },
  { value: "calm", label: "Calmo", icon: Moon, color: "text-cicluz-blue" },
  { value: "sad", label: "Triste", icon: CloudRain, color: "text-cicluz-purple" },
  { value: "anxious", label: "Ansioso", icon: Zap, color: "text-cicluz-orange" },
  { value: "neutral", label: "Neutro", icon: Wind, color: "text-cicluz-teal" },
];

const breathingOptions = [
  { value: "shallow", label: "Superficial" },
  { value: "normal", label: "Normal" },
  { value: "deep", label: "Profunda" },
];

const bodyAreas = [
  "Cabeca", "Pescoco", "Ombros", "Peito", "Costas", "Abdomen", "Maos", "Pernas", "Sem tensao"
];

const diarioSchema = z.object({
  mood: z.string().min(1, "Selecione seu humor"),
  emotionalState: z.enum(["S+", "IS-"]),
  emotionalIntensity: z.number().min(1).max(10),
  emotionalDescription: z.string().optional(),
  corporalTension: z.string().optional(),
  corporalBreathing: z.string().optional(),
  systemicRelations: z.string().optional(),
  cognitiveBeliefs: z.string().optional(),
});

type DiarioFormData = z.infer<typeof diarioSchema>;

export default function DiarioPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const form = useForm<DiarioFormData>({
    resolver: zodResolver(diarioSchema),
    defaultValues: {
      mood: "",
      emotionalState: "S+",
      emotionalIntensity: 5,
      emotionalDescription: "",
      corporalTension: "",
      corporalBreathing: "normal",
      systemicRelations: "",
      cognitiveBeliefs: "",
    },
  });

  const { data: entriesData, isLoading } = useQuery<{ entries?: DiarioEntry[] }>({
    queryKey: ["/api/diario"],
    enabled: !!token,
  });

  const createEntryMutation = useMutation({
    mutationFn: async (data: DiarioFormData) => {
      const res = await apiRequest("POST", "/api/diario", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Entrada salva no seu diario." });
      queryClient.invalidateQueries({ queryKey: ["/api/diario"] });
      setShowForm(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Erro", description: "Nao foi possivel salvar a entrada.", variant: "destructive" });
    },
  });

  const entries: DiarioEntry[] = entriesData?.entries || [];

  const getMoodIcon = (mood: string) => {
    const option = moodOptions.find((m) => m.value === mood);
    if (!option) return null;
    const Icon = option.icon;
    return <Icon className={`w-5 h-5 ${option.color}`} />;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-display flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-cicluz-purple" />
            Meu Diario
          </h1>
          <p className="text-muted-foreground">Registre e acompanhe sua jornada emocional</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-cicluz-gradient text-white rounded-full"
          data-testid="button-new-entry"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Entrada
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Como voce esta hoje?</CardTitle>
            <CardDescription>Registre suas emocoes, sensacoes e pensamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createEntryMutation.mutate(data))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="mood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-cicluz-pink" />
                          Humor
                        </FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {moodOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => field.onChange(option.value)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                                field.value === option.value
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                              data-testid={`button-mood-${option.value}`}
                            >
                              <option.icon className={`w-4 h-4 ${option.color}`} />
                              <span className="text-sm">{option.label}</span>
                            </button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emotionalState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-cicluz-purple" />
                          Estado Emocional
                        </FormLabel>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => field.onChange("S+")}
                            className={`flex-1 py-3 rounded-xl border transition-all ${
                              field.value === "S+"
                                ? "border-cicluz-green bg-cicluz-green/10 text-cicluz-green"
                                : "border-border"
                            }`}
                            data-testid="button-state-positive"
                          >
                            S+ Positivo
                          </button>
                          <button
                            type="button"
                            onClick={() => field.onChange("IS-")}
                            className={`flex-1 py-3 rounded-xl border transition-all ${
                              field.value === "IS-"
                                ? "border-cicluz-pink bg-cicluz-pink/10 text-cicluz-pink"
                                : "border-border"
                            }`}
                            data-testid="button-state-negative"
                          >
                            IS- Negativo
                          </button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="emotionalIntensity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Intensidade: {field.value}/10</FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          min={1}
                          max={10}
                          step={1}
                          className="py-4"
                          data-testid="slider-intensity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emotionalDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>O que voce esta sentindo?</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descreva suas emocoes e pensamentos..."
                          className="min-h-[100px] rounded-xl"
                          data-testid="input-emotional-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="corporalTension"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-cicluz-blue" />
                          Tensao Corporal
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl" data-testid="select-tension">
                              <SelectValue placeholder="Onde voce sente tensao?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bodyAreas.map((area) => (
                              <SelectItem key={area} value={area}>{area}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="corporalBreathing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Respiracao</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl" data-testid="select-breathing">
                              <SelectValue placeholder="Como esta sua respiracao?" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {breathingOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="systemicRelations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-cicluz-teal" />
                        Relacoes (Sistema Familiar)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Como estao suas relacoes familiares e sociais?"
                          className="min-h-[80px] rounded-xl"
                          data-testid="input-relations"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cognitiveBeliefs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cicluz-yellow" />
                        Crencas e Pensamentos
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Quais pensamentos ou crencas estao presentes?"
                          className="min-h-[80px] rounded-xl"
                          data-testid="input-beliefs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-cicluz-gradient text-white"
                    disabled={createEntryMutation.isPending}
                    data-testid="button-save-entry"
                  >
                    {createEntryMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="type-title">Historico</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Nenhuma entrada ainda.</p>
              <p className="text-sm text-muted-foreground">Comece a registrar sua jornada!</p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-4 pr-4">
              {entries.map((entry: DiarioEntry) => (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {getMoodIcon(entry.mood)}
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={entry.emotionalState === "S+" ? "border-cicluz-green text-cicluz-green" : "border-cicluz-pink text-cicluz-pink"}
                            >
                              {entry.emotionalState}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Intensidade: {entry.emotionalIntensity}/10
                            </span>
                          </div>
                          {entry.emotionalDescription && (
                            <p className="mt-2 text-sm">{entry.emotionalDescription}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(entry.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    
                    {(entry.corporalTension || entry.systemicRelations || entry.cognitiveBeliefs) && (
                      <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
                        {entry.corporalTension && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Tensao:</span> {entry.corporalTension}
                          </div>
                        )}
                        {entry.systemicRelations && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Relacoes:</span> {entry.systemicRelations}
                          </div>
                        )}
                        {entry.cognitiveBeliefs && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Crencas:</span> {entry.cognitiveBeliefs}
                          </div>
                        )}
                      </div>
                    )}

                    {entry.aiAnalysis != null && (
                      <div className="mt-4 p-3 rounded-xl bg-cicluz-purple/5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                          <Sparkles className="w-3 h-3" /> Analise da IA
                        </p>
                        <p className="text-sm">{typeof entry.aiAnalysis === 'string' ? entry.aiAnalysis : JSON.stringify(entry.aiAnalysis)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
