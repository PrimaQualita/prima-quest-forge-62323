import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VideoPlayer } from "@/components/VideoPlayer";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Video, FileText, CheckCircle, Lock, Download } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface AssessmentWithQuestions {
  id: string;
  training_id: string;
  employee_id: string;
  questions: any;
  answers: any;
  completed: boolean;
  completed_at: string | null;
  score: number | null;
  created_at: string;
  training_questions?: Array<{
    id: string;
    question: string;
    options: string[];
    correct_answer: string;
  }>;
}

const TrainingView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data: currentEmployee } = useQuery({
    queryKey: ['current-employee'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: training } = useQuery({
    queryKey: ['training', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainings')
        .select(`
          *,
          training_videos (*),
          training_documents (*)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      // Sort videos by order
      if (data.training_videos) {
        data.training_videos.sort((a, b) => a.video_order - b.video_order);
      }
      
      return data;
    },
  });

  const { data: videoProgress } = useQuery({
    queryKey: ['video-progress', id, currentEmployee?.id],
    queryFn: async () => {
      if (!currentEmployee) return [];
      
      const { data, error } = await supabase
        .from('video_progress')
        .select('*')
        .eq('training_id', id)
        .eq('employee_id', currentEmployee.id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!currentEmployee,
  });

  const { data: assessment } = useQuery<AssessmentWithQuestions | null>({
    queryKey: ['assessment', id, currentEmployee?.id],
    queryFn: async () => {
      if (!currentEmployee) return null;
      
      const { data: assessmentData, error } = await supabase
        .from('training_assessments')
        .select('*')
        .eq('training_id', id)
        .eq('employee_id', currentEmployee.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      if (!assessmentData) return null;
      
      // Fetch questions based on the question IDs in the assessment
      const questionIds = assessmentData.questions as string[];
      if (questionIds && questionIds.length > 0) {
        const { data: questionsData } = await supabase
          .from('training_questions')
          .select('*')
          .in('id', questionIds);
        
        return {
          ...assessmentData,
          training_questions: questionsData || []
        } as AssessmentWithQuestions;
      }
      
      return assessmentData as AssessmentWithQuestions;
    },
    enabled: !!currentEmployee,
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ videoId, percentage }: { videoId: string; percentage: number }) => {
      if (!currentEmployee) return;

      const completed = percentage >= 70;

      const { error } = await supabase
        .from('video_progress')
        .upsert({
          employee_id: currentEmployee.id,
          training_id: id!,
          video_id: videoId,
          progress_percentage: Math.floor(percentage),
          completed,
          last_watched_at: new Date().toISOString(),
        }, {
          onConflict: 'employee_id,video_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-progress'] });
    },
  });

  const submitAssessmentMutation = useMutation({
    mutationFn: async () => {
      if (!currentEmployee || !assessment) return;

      const { error } = await supabase
        .from('training_assessments')
        .update({
          answers,
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', assessment.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Avaliação enviada com sucesso!",
        description: "Sua resposta foi registrada.",
      });
      setIsAssessmentOpen(false);
      queryClient.invalidateQueries({ queryKey: ['assessment'] });
      navigate('/trainings');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar avaliação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const currentVideo = training?.training_videos?.[currentVideoIndex];
  const currentVideoProgress = videoProgress?.find(vp => vp.video_id === currentVideo?.id);
  
  const allVideosCompleted = training?.training_videos?.every(video => 
    videoProgress?.find(vp => vp.video_id === video.id)?.completed
  ) ?? false;

  const canTakeAssessment = allVideosCompleted && !assessment?.completed;

  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    const { data } = supabase.storage
      .from('compliance-documents')
      .getPublicUrl(filePath);

    const link = document.createElement('a');
    link.href = data.publicUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!training) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 pt-6">
      <div className="flex items-center gap-3 md:gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/trainings')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden md:inline">Voltar</span>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl md:text-4xl font-bold text-foreground">{training.title}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-2">{training.description}</p>
        <Badge className="mt-2">{training.category}</Badge>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="videos" className="text-xs md:text-sm">
            <Video className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Vídeos</span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="text-xs md:text-sm">
            <FileText className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            <span className="hidden md:inline">Materiais</span>
          </TabsTrigger>
          <TabsTrigger value="assessment" disabled={!canTakeAssessment} className="text-xs md:text-sm">
            {canTakeAssessment ? (
              <CheckCircle className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            ) : (
              <Lock className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
            )}
            <span className="hidden md:inline">Avaliação</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4 mt-4">
          {training.training_videos && training.training_videos.length > 0 ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{currentVideo?.title}</span>
                    {currentVideoProgress?.completed && (
                      <Badge variant="secondary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Concluído
                      </Badge>
                    )}
                  </CardTitle>
                  {currentVideo?.description && (
                    <p className="text-sm text-muted-foreground">{currentVideo.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <VideoPlayer
                    url={currentVideo?.url || ""}
                    currentProgress={currentVideoProgress?.progress_percentage || 0}
                    onProgressUpdate={(percentage) => {
                      if (currentVideo) {
                        updateProgressMutation.mutate({
                          videoId: currentVideo.id,
                          percentage,
                        });
                      }
                    }}
                    onComplete={() => {
                      toast({
                        title: "Vídeo concluído!",
                        description: "Você assistiu a mais de 70% deste vídeo.",
                      });
                    }}
                  />
                </CardContent>
              </Card>

              {training.training_videos.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Todos os Vídeos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {training.training_videos.map((video, index) => {
                      const progress = videoProgress?.find(vp => vp.video_id === video.id);
                      return (
                        <Button
                          key={video.id}
                          variant={currentVideoIndex === index ? "default" : "outline"}
                          className="w-full justify-start"
                          onClick={() => setCurrentVideoIndex(index)}
                        >
                          <span className="flex items-center gap-2 w-full">
                            <Video className="w-4 h-4" />
                            <span className="flex-1 text-left">
                              {index + 1}. {video.title}
                            </span>
                            {progress?.completed && (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            )}
                          </span>
                        </Button>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {!allVideosCompleted && (
                <Card className="bg-muted">
                  <CardContent className="pt-6">
                    <p className="text-sm text-center text-muted-foreground">
                      Complete todos os vídeos para liberar a avaliação
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhum vídeo disponível para este treinamento.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4 mt-4">
          {training.training_documents && training.training_documents.length > 0 ? (
            <div className="grid gap-4">
              {training.training_documents.map((doc) => (
                <Card key={doc.id}>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-secondary" />
                      <div>
                        <p className="font-medium">{doc.file_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Material de apoio
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Baixar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Nenhum material disponível para este treinamento.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4 mt-4">
          {canTakeAssessment && (
            <Card>
              <CardHeader>
                <CardTitle>Avaliação do Treinamento</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Responda às questões abaixo para concluir o treinamento.
                </p>
              </CardHeader>
              <CardContent>
                <Button onClick={() => setIsAssessmentOpen(true)} className="w-full">
                  Iniciar Avaliação
                </Button>
              </CardContent>
            </Card>
          )}

          {assessment?.completed && (
            <Card>
              <CardContent className="pt-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Avaliação Concluída!</h3>
                <p className="text-muted-foreground">
                  Você completou este treinamento com sucesso.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isAssessmentOpen} onOpenChange={setIsAssessmentOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Avaliação - {training.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {assessment?.training_questions?.map((q: any, index: number) => (
              <Card key={q.id}>
                <CardContent className="pt-6 space-y-4">
                  <Label className="text-base font-medium">
                    {index + 1}. {q.question}
                  </Label>
                  <RadioGroup
                    value={answers[q.id] || ""}
                    onValueChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                  >
                    {q.options?.map((option: string, optIndex: number) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${q.id}-${optIndex}`} />
                        <Label htmlFor={`${q.id}-${optIndex}`} className="font-normal cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
            
            <Button 
              className="w-full"
              onClick={() => submitAssessmentMutation.mutate()}
              disabled={
                submitAssessmentMutation.isPending ||
                Object.keys(answers).length !== assessment?.training_questions?.length
              }
            >
              {submitAssessmentMutation.isPending ? "Enviando..." : "Enviar Avaliação"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingView;
