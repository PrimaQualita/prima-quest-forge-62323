import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GraduationCap, Plus, CheckCircle, Clock, Video, Trash2, MoveUp, MoveDown, FileText, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

interface VideoData {
  title: string;
  url: string;
  description: string;
  duration_minutes: number;
  video_order: number;
  file?: File | null;
  uploadType: 'url' | 'file';
}

const Trainings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<any>(null);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [isTrail, setIsTrail] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    duration_hours: 0,
  });
  const [videos, setVideos] = useState<VideoData[]>([{
    title: "",
    url: "",
    description: "",
    duration_minutes: 0,
    video_order: 1,
    file: null,
    uploadType: 'url'
  }]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const { data: trainings } = useQuery({
    queryKey: ['trainings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trainings')
        .select(`
          *,
          training_videos (*),
          training_documents (*)
        `)
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

  const addTrainingMutation = useMutation({
    mutationFn: async () => {
      // Criar o treinamento
      const { data: training, error: trainingError } = await supabase
        .from('trainings')
        .insert({
          title: formData.title,
          category: formData.category,
          description: formData.description,
          duration_hours: formData.duration_hours,
          is_trail: isTrail,
        })
        .select()
        .single();

      if (trainingError) throw trainingError;

      // Processar e inserir vídeos
      if (videos.length > 0 && (videos[0].url || videos[0].file)) {
        const videosToInsert = await Promise.all(
          videos.map(async (video) => {
            let videoUrl = video.url;

            // Se for upload de arquivo, fazer o upload primeiro
            if (video.uploadType === 'file' && video.file) {
              const fileExt = video.file.name.split('.').pop();
              const fileName = `${training.id}/${crypto.randomUUID()}.${fileExt}`;
              
              const { error: uploadError } = await supabase.storage
                .from('training-videos')
                .upload(fileName, video.file);

              if (uploadError) throw uploadError;

              // Obter URL pública
              const { data: urlData } = supabase.storage
                .from('training-videos')
                .getPublicUrl(fileName);

              videoUrl = urlData.publicUrl;
            }

            return {
              training_id: training.id,
              title: video.title,
              url: videoUrl,
              description: video.description,
              duration_minutes: video.duration_minutes,
              video_order: video.video_order,
            };
          })
        );

        const { error: videosError } = await supabase
          .from('training_videos')
          .insert(videosToInsert);

        if (videosError) throw videosError;
      }

      // Upload de documentos
      if (documents.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        
        for (const doc of documents) {
          const fileExt = doc.name.split('.').pop();
          const fileName = `${training.id}/${crypto.randomUUID()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('compliance-documents')
            .upload(fileName, doc);

          if (uploadError) throw uploadError;

          const { error: docError } = await supabase
            .from('training_documents')
            .insert({
              training_id: training.id,
              file_name: doc.name,
              file_path: fileName,
              uploaded_by: user?.id
            });

          if (docError) throw docError;

          // Ler conteúdo do documento para gerar questões
          const reader = new FileReader();
          const content = await new Promise<string>((resolve, reject) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(doc);
          });

          // Gerar questões via IA (assíncrono, não bloqueia)
          setIsGeneratingQuestions(true);
          supabase.functions.invoke('generate-training-questions', {
            body: { 
              trainingId: training.id, 
              documentContent: content 
            }
          }).then(() => {
            setIsGeneratingQuestions(false);
          }).catch((err) => {
            console.error('Erro ao gerar questões:', err);
            setIsGeneratingQuestions(false);
          });
        }
      }

      return training;
    },
    onSuccess: () => {
      toast({ 
        title: "Treinamento criado com sucesso!",
        description: isGeneratingQuestions ? "As questões estão sendo geradas pela IA..." : undefined
      });
      setIsAddDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar treinamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      category: "",
      description: "",
      duration_hours: 0,
    });
    setVideos([{
      title: "",
      url: "",
      description: "",
      duration_minutes: 0,
      video_order: 1,
      file: null,
      uploadType: 'url'
    }]);
    setDocuments([]);
    setIsTrail(false);
  };

  const addVideo = () => {
    setVideos([...videos, {
      title: "",
      url: "",
      description: "",
      duration_minutes: 0,
      video_order: videos.length + 1,
      file: null,
      uploadType: 'url'
    }]);
  };

  const removeVideo = (index: number) => {
    if (videos.length > 1) {
      const newVideos = videos.filter((_, i) => i !== index);
      // Reordenar
      newVideos.forEach((video, i) => {
        video.video_order = i + 1;
      });
      setVideos(newVideos);
    }
  };

  const moveVideo = (index: number, direction: 'up' | 'down') => {
    const newVideos = [...videos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < videos.length) {
      [newVideos[index], newVideos[targetIndex]] = [newVideos[targetIndex], newVideos[index]];
      newVideos.forEach((video, i) => {
        video.video_order = i + 1;
      });
      setVideos(newVideos);
    }
  };

  const updateVideo = (index: number, field: keyof VideoData, value: any) => {
    const newVideos = [...videos];
    newVideos[index] = { ...newVideos[index], [field]: value };
    setVideos(newVideos);
  };

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

  const openEditPage = (trainingId: string) => {
    navigate(`/trainings/${trainingId}/edit`);
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground uppercase">TREINAMENTOS</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">Acompanhe e gerencie treinamentos de compliance</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo Treinamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Treinamento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-trail">Tipo de Treinamento</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{isTrail ? "Trilha (vários vídeos)" : "Simples (um vídeo)"}</span>
                    <Switch
                      id="is-trail"
                      checked={isTrail}
                      onCheckedChange={setIsTrail}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input 
                  id="title"
                  placeholder="Ex: LGPD e Proteção de Dados" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Input 
                  id="category"
                  placeholder="Ex: Segurança da Informação" 
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duração Total (horas) *</Label>
                <Input 
                  id="duration"
                  type="number" 
                  placeholder="4" 
                  value={formData.duration_hours || ""}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição *</Label>
                <Textarea 
                  id="description"
                  placeholder="Descrição detalhada do treinamento..." 
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <Label>Documentos do Treinamento (PDF, DOCX, TXT)</Label>
                  <Input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setDocuments(files);
                    }}
                  />
                  {documents.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {documents.length} documento(s) selecionado(s)
                      <p className="text-xs mt-1">
                        💡 A IA irá gerar 30 questões automaticamente a partir destes documentos.
                        Cada colaborador receberá 10 questões aleatórias únicas.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-lg">Vídeos do Treinamento</Label>
                  {isTrail && (
                    <Button type="button" onClick={addVideo} size="sm" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Vídeo
                    </Button>
                  )}
                </div>

                {videos.map((video, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Video className="w-4 h-4" />
                          Vídeo {index + 1}
                        </Label>
                        <div className="flex items-center gap-2">
                          {isTrail && videos.length > 1 && (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => moveVideo(index, 'up')}
                                disabled={index === 0}
                              >
                                <MoveUp className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => moveVideo(index, 'down')}
                                disabled={index === videos.length - 1}
                              >
                                <MoveDown className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeVideo(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Título do Vídeo *</Label>
                        <Input
                          placeholder="Ex: Introdução à LGPD"
                          value={video.title}
                          onChange={(e) => updateVideo(index, 'title', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Tipo de Vídeo</Label>
                        <RadioGroup
                          value={video.uploadType}
                          onValueChange={(value: 'url' | 'file') => updateVideo(index, 'uploadType', value)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="url" id={`url-${index}`} />
                            <Label htmlFor={`url-${index}`} className="font-normal cursor-pointer">
                              URL Externa (YouTube, Vimeo, etc.)
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="file" id={`file-${index}`} />
                            <Label htmlFor={`file-${index}`} className="font-normal cursor-pointer">
                              Upload de Arquivo
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>

                      {video.uploadType === 'url' ? (
                        <div className="space-y-2">
                          <Label>URL do Vídeo *</Label>
                          <Input
                            placeholder="https://www.youtube.com/watch?v=..."
                            value={video.url}
                            onChange={(e) => updateVideo(index, 'url', e.target.value)}
                          />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Upload do Vídeo * (MP4, WebM, máx. 500MB)</Label>
                          <Input
                            type="file"
                            accept="video/mp4,video/webm,video/ogg,video/quicktime"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              updateVideo(index, 'file', file);
                            }}
                          />
                          {video.file && (
                            <p className="text-sm text-muted-foreground">
                              Arquivo: {video.file.name} ({(video.file.size / 1024 / 1024).toFixed(2)} MB)
                            </p>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Descrição</Label>
                        <Textarea
                          placeholder="Breve descrição do vídeo..."
                          rows={2}
                          value={video.description}
                          onChange={(e) => updateVideo(index, 'description', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Duração (minutos)</Label>
                        <Input
                          type="number"
                          placeholder="30"
                          value={video.duration_minutes || ""}
                          onChange={(e) => updateVideo(index, 'duration_minutes', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Button 
                className="w-full"
                onClick={() => addTrainingMutation.mutate()}
                disabled={
                  addTrainingMutation.isPending || 
                  !formData.title || 
                  !formData.category || 
                  !videos.every(v => v.title && (v.uploadType === 'url' ? v.url : v.file))
                }
              >
                {addTrainingMutation.isPending ? "Criando..." : "Criar Treinamento"}
              </Button>
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
                  <div className="flex gap-2">
                    {training.is_trail && (
                      <Badge variant="secondary">
                        <Video className="w-3 h-3 mr-1" />
                        Trilha
                      </Badge>
                    )}
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {training.duration_hours}h
                    </Badge>
                  </div>
                </div>
                <CardTitle className="mt-4">{training.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{training.description}</p>
                <Badge>{training.category}</Badge>
                
                {training.training_videos && training.training_videos.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <Video className="w-4 h-4 inline mr-1" />
                    <strong>{training.training_videos.length}</strong> vídeo(s)
                  </div>
                )}

                {training.training_documents && training.training_documents.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <FileText className="w-4 h-4 inline mr-1" />
                    <strong>{training.training_documents.length}</strong> documento(s)
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Conclusão</span>
                    <span className="font-medium">{completionRate}%</span>
                  </div>
                  <Progress value={completionRate} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    className="w-full"
                    onClick={() => navigate(`/trainings/${training.id}`)}
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Acessar
                  </Button>

                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => openEditPage(training.id)}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
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
