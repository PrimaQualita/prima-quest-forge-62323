import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Plus, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const Trainings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  const { data: trainings } = useQuery({
    queryKey: ['trainings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase.from('employees').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: participations } = useQuery({
    queryKey: ['training-participations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_participations')
        .select('*');
      if (error) throw error;
      return data;
    },
  });

  const completeTrainingMutation = useMutation({
    mutationFn: async ({ trainingId, employeeId }: any) => {
      const { error } = await supabase
        .from('training_participations')
        .upsert({
          training_id: trainingId,
          employee_id: employeeId,
          completed: true,
          completion_date: new Date().toISOString(),
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Treinamento concluído com sucesso!" });
      setSelectedTraining(null);
      setSelectedEmployee("");
      queryClient.invalidateQueries({ queryKey: ['training-participations'] });
    },
  });

  const getCompletionRate = (trainingId: string) => {
    if (!participations || !employees) return 0;
    const completed = participations.filter(
      p => p.training_id === trainingId && p.completed
    ).length;
    return Math.round((completed / employees.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Gestão de Treinamentos</h1>
          <p className="text-muted-foreground mt-1">Acompanhe e gerencie treinamentos de compliance</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Treinamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Treinamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input placeholder="Ex: LGPD e Proteção de Dados" />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input placeholder="Ex: Segurança da Informação" />
              </div>
              <div className="space-y-2">
                <Label>Duração (horas)</Label>
                <Input type="number" placeholder="4" />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea placeholder="Descrição detalhada do treinamento..." rows={4} />
              </div>
              <Button className="w-full">Criar Treinamento</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trainings?.map((training) => {
          const completionRate = getCompletionRate(training.id);
          
          return (
            <Card key={training.id} className="hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <GraduationCap className="w-8 h-8 text-secondary" />
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {training.duration_hours}h
                  </Badge>
                </div>
                <CardTitle className="mt-4">{training.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{training.description}</p>
                <Badge>{training.category}</Badge>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conclusão</span>
                    <span className="font-medium">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setSelectedTraining(training)}
                    >
                      Marcar Conclusão
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirmar Conclusão de Treinamento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <p className="text-sm text-muted-foreground">
                        {training.title}
                      </p>
                      <div className="space-y-2">
                        <Label>Selecione o colaborador</Label>
                        <select
                          className="w-full border rounded-md p-2"
                          value={selectedEmployee}
                          onChange={(e) => setSelectedEmployee(e.target.value)}
                        >
                          <option value="">Selecione...</option>
                          {employees?.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </div>
                      <Button 
                        className="w-full"
                        disabled={!selectedEmployee}
                        onClick={() => completeTrainingMutation.mutate({
                          trainingId: training.id,
                          employeeId: selectedEmployee
                        })}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmar Conclusão
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Trainings;
