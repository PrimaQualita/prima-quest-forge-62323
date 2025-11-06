import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, MoveUp, MoveDown, Video, FileText, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RichTextEditor } from "@/components/RichTextEditor";

interface VideoData {
  id?: string;
  title: string;
  url: string;
  description: string;
  duration_minutes: number;
  video_order: number;
  file?: File | null;
  uploadType: 'url' | 'file';
  isExisting?: boolean;
}

interface DocumentData {
  id?: string;
  file_name: string;
  file_path: string;
  isExisting?: boolean;
}

const TrainingEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isTrail, setIsTrail] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    duration_hours: 0,
    documentContent: "",
  });
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [newDocuments, setNewDocuments] = useState<File[]>([]);
  const [deletedVideoIds, setDeletedVideoIds] = useState<string[]>([]);
  const [deletedDocumentIds, setDeletedDocumentIds] = useState<string[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  const { data: training, isLoading } = useQuery({
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
      return data;
    },
  });

  useEffect(() => {
    if (training) {
      setFormData({
        title: training.title,
        category: training.category,
        description: training.description || "",
        duration_hours: training.duration_hours || 0,
        documentContent: "",
      });
      setIsTrail(training.is_trail || false);
      
      if (training.training_videos) {
        const sortedVideos = [...training.training_videos].sort((a, b) => a.video_order - b.video_order);
        setVideos(sortedVideos.map(v => ({
          id: v.id,
          title: v.title,
          url: v.url,
          description: v.description || "",
          duration_minutes: v.duration_minutes || 0,
          video_order: v.video_order,
          uploadType: 'url',
          isExisting: true,
        })));
      }
      
      if (training.training_documents) {
        setDocuments(training.training_documents.map(d => ({
          id: d.id,
          file_name: d.file_name,
          file_path: d.file_path,
          isExisting: true,
        })));
      }
    }
  }, [training]);

  const updateTrainingMutation = useMutation({
    mutationFn: async () => {
      // Atualizar dados básicos do treinamento
      const { error: trainingError } = await supabase
        .from('trainings')
        .update({
          title: formData.title,
          category: formData.category,
          description: formData.description,
          duration_hours: formData.duration_hours,
          is_trail: isTrail,
        })
        .eq('id', id);

      if (trainingError) throw trainingError;

      // Deletar vídeos marcados para exclusão
      if (deletedVideoIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('training_videos')
          .delete()
          .in('id', deletedVideoIds);
        if (deleteError) throw deleteError;
      }

      // Atualizar vídeos existentes e inserir novos
      for (const video of videos) {
        let videoUrl = video.url;

        // Se for upload de arquivo novo, fazer o upload
        if (video.uploadType === 'file' && video.file) {
          const fileExt = video.file.name.split('.').pop();
          const fileName = `${id}/${crypto.randomUUID()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('training-videos')
            .upload(fileName, video.file);

          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage
            .from('training-videos')
            .getPublicUrl(fileName);

          videoUrl = urlData.publicUrl;
        }

        if (video.isExisting && video.id) {
          // Atualizar vídeo existente
          const { error } = await supabase
            .from('training_videos')
            .update({
              title: video.title,
              url: videoUrl,
              description: video.description,
              duration_minutes: video.duration_minutes,
              video_order: video.video_order,
            })
            .eq('id', video.id);
          if (error) throw error;
        } else {
          // Inserir novo vídeo
          const { error } = await supabase
            .from('training_videos')
            .insert({
              training_id: id,
              title: video.title,
              url: videoUrl,
              description: video.description,
              duration_minutes: video.duration_minutes,
              video_order: video.video_order,
            });
          if (error) throw error;
        }
      }

      // Deletar documentos marcados para exclusão
      if (deletedDocumentIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('training_documents')
          .delete()
          .in('id', deletedDocumentIds);
        if (deleteError) throw deleteError;
      }

      // Inserir novos documentos
      if (newDocuments.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        
        for (const doc of newDocuments) {
          const fileExt = doc.name.split('.').pop();
          const fileName = `${id}/${crypto.randomUUID()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('compliance-documents')
            .upload(fileName, doc);

          if (uploadError) throw uploadError;

          const { error: docError } = await supabase
            .from('training_documents')
            .insert({
              training_id: id,
              file_name: doc.name,
              file_path: fileName,
              uploaded_by: user?.id
            });

          if (docError) throw docError;

          // Gerar questões via IA usando a nova função que extrai texto do PDF corretamente
          setIsGeneratingQuestions(true);
          supabase.functions.invoke('parse-pdf-and-generate-questions', {
            body: { 
              trainingId: id, 
              filePath: fileName 
            }
          }).then((response) => {
            setIsGeneratingQuestions(false);
            if (response.data?.success) {
              toast({
                title: "Questões geradas com sucesso!",
                description: `${response.data.questionsGenerated} questões criadas.`
              });
            }
          }).catch((err) => {
            console.error('Erro ao gerar questões:', err);
            setIsGeneratingQuestions(false);
            toast({
              title: "Erro ao gerar questões",
              description: "Não foi possível gerar as questões automaticamente.",
              variant: "destructive"
            });
          });
        }
      }
    },
    onSuccess: () => {
      toast({ 
        title: "Treinamento atualizado com sucesso!",
        description: isGeneratingQuestions ? "As questões estão sendo geradas pela IA..." : undefined
      });
      queryClient.invalidateQueries({ queryKey: ['trainings'] });
      queryClient.invalidateQueries({ queryKey: ['training', id] });
      navigate('/trainings');
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar treinamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addVideo = () => {
    setVideos([...videos, {
      title: "",
      url: "",
      description: "",
      duration_minutes: 0,
      video_order: videos.length + 1,
      file: null,
      uploadType: 'url',
      isExisting: false,
    }]);
  };

  const removeVideo = (index: number) => {
    const video = videos[index];
    if (video.isExisting && video.id) {
      setDeletedVideoIds([...deletedVideoIds, video.id]);
    }
    const newVideos = videos.filter((_, i) => i !== index);
    newVideos.forEach((v, i) => {
      v.video_order = i + 1;
    });
    setVideos(newVideos);
  };

  const moveVideo = (index: number, direction: 'up' | 'down') => {
    const newVideos = [...videos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < videos.length) {
      [newVideos[index], newVideos[targetIndex]] = [newVideos[targetIndex], newVideos[index]];
      newVideos.forEach((v, i) => {
        v.video_order = i + 1;
      });
      setVideos(newVideos);
    }
  };

  const updateVideo = (index: number, field: keyof VideoData, value: any) => {
    const newVideos = [...videos];
    newVideos[index] = { ...newVideos[index], [field]: value };
    setVideos(newVideos);
  };

  const removeDocument = (index: number) => {
    const doc = documents[index];
    if (doc.isExisting && doc.id) {
      setDeletedDocumentIds([...deletedDocumentIds, doc.id]);
    }
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleDownloadDocument = (filePath: string, fileName: string) => {
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

  const handleReplaceDocument = async (documentId: string, oldFilePath: string, newFile: File) => {
    if (!id) return;
    
    toast({
      title: "Substituindo documento...",
      description: "Deletando arquivo antigo e fazendo upload do novo."
    });

    try {
      // 1. Deletar arquivo antigo do storage
      const { error: deleteStorageError } = await supabase.storage
        .from('compliance-documents')
        .remove([oldFilePath]);

      if (deleteStorageError) {
        console.error('Erro ao deletar arquivo antigo:', deleteStorageError);
      }

      // 2. Fazer upload do novo arquivo
      const fileExt = newFile.name.split('.').pop();
      const newFileName = `${id}/${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('compliance-documents')
        .upload(newFileName, newFile);

      if (uploadError) throw uploadError;

      // 3. Atualizar registro na tabela training_documents
      const { error: updateError } = await supabase
        .from('training_documents')
        .update({
          file_path: newFileName,
          file_name: newFile.name,
        })
        .eq('id', documentId);

      if (updateError) throw updateError;

      // 4. Deletar questões antigas deste treinamento
      const { error: deleteQuestionsError } = await supabase
        .from('training_questions')
        .delete()
        .eq('training_id', id);

      if (deleteQuestionsError) {
        console.error('Erro ao deletar questões antigas:', deleteQuestionsError);
      }

      toast({
        title: "Documento substituído!",
        description: "Gerando novas questões..."
      });

      // 5. Gerar novas questões
      setIsGeneratingQuestions(true);
      const response = await supabase.functions.invoke('parse-pdf-and-generate-questions', {
        body: { 
          trainingId: id, 
          filePath: newFileName 
        }
      });

      if (response.data?.success) {
        toast({
          title: "Sucesso!",
          description: `Documento substituído e ${response.data.questionsGenerated} novas questões geradas.`
        });
        
        // Atualizar lista de documentos
        setDocuments(documents.map(doc => 
          doc.id === documentId 
            ? { ...doc, file_path: newFileName, file_name: newFile.name }
            : doc
        ));
        
        queryClient.invalidateQueries({ queryKey: ['training', id] });
      } else {
        throw new Error('Falha ao gerar questões');
      }
    } catch (err: any) {
      console.error('Erro ao substituir documento:', err);
      toast({
        title: "Erro ao substituir documento",
        description: err.message || "Não foi possível substituir o documento.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  if (isLoading) {
    return <div className="pt-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6 pt-6 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/trainings')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl md:text-4xl font-bold text-foreground uppercase">
            EDITAR TREINAMENTO
          </h1>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        <Card className="p-6">
          <div className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input 
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Input 
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração Total (horas) *</Label>
              <Input 
                id="duration"
                type="number" 
                value={formData.duration_hours || ""}
                onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <RichTextEditor
                value={formData.description}
                onChange={(value) => setFormData({ ...formData, description: value })}
                placeholder="Descreva o treinamento..."
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
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
                        </>
                      )}
                      {(isTrail || videos.length > 1) && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeVideo(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo de Upload</Label>
                    <RadioGroup
                      value={video.uploadType}
                      onValueChange={(value: 'url' | 'file') => updateVideo(index, 'uploadType', value)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="url" id={`url-${index}`} />
                        <Label htmlFor={`url-${index}`} className="font-normal">URL</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="file" id={`file-${index}`} />
                        <Label htmlFor={`file-${index}`} className="font-normal">Upload de Arquivo</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {video.uploadType === 'url' ? (
                    <div className="space-y-2">
                      <Label>URL do Vídeo *</Label>
                      <Input 
                        placeholder="https://youtube.com/watch?v=..." 
                        value={video.url}
                        onChange={(e) => updateVideo(index, 'url', e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Arquivo de Vídeo *</Label>
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            updateVideo(index, 'file', file);
                          }
                        }}
                      />
                      {video.url && !video.file && (
                        <p className="text-xs text-muted-foreground">
                          Vídeo atual: {video.url.split('/').pop()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Título do Vídeo *</Label>
                    <Input 
                      placeholder="Ex: Introdução ao LGPD" 
                      value={video.title}
                      onChange={(e) => updateVideo(index, 'title', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <RichTextEditor
                      value={video.description}
                      onChange={(value) => updateVideo(index, 'description', value)}
                      placeholder="Descrição do vídeo..."
                      className="min-h-[80px]"
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

            {videos.length === 0 && (
              <Button type="button" onClick={addVideo} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeiro Vídeo
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg">Conteúdo do Documento</Label>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="documentContent">
                📝 Texto do Documento (para gerar questões)
              </Label>
              <p className="text-sm text-muted-foreground mb-2">
                Cole aqui o texto completo do documento. Clique em "Gerar Questões" para criar 50 questões baseadas neste conteúdo.
                Você pode continuar editando o texto enquanto as questões estão sendo geradas.
              </p>
              <RichTextEditor
                value={formData.documentContent}
                onChange={(value) => setFormData({ ...formData, documentContent: value })}
              />
              {formData.documentContent && formData.documentContent.length > 0 && (
                <div className="text-sm text-success">
                  ✓ {formData.documentContent.split(/\s+/).filter(w => w.length > 0).length} palavras • 
                  {formData.documentContent.length} caracteres
                </div>
              )}
            </div>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={async () => {
                if (!id || !formData.documentContent || formData.documentContent.trim().length < 100) {
                  toast({
                    title: "Conteúdo insuficiente",
                    description: "Cole o texto do documento (mínimo 100 caracteres) antes de gerar questões.",
                    variant: "destructive"
                  });
                  return;
                }
                
                setIsGeneratingQuestions(true);
                
                toast({
                  title: "Gerando questões...",
                  description: "Isso pode levar alguns minutos. Aguarde."
                });
                
                try {
                  // Deletar questões antigas
                  await supabase
                    .from('training_questions')
                    .delete()
                    .eq('training_id', id);

                  const response = await supabase.functions.invoke('generate-questions-from-text', {
                    body: { 
                      trainingId: id, 
                      documentContent: formData.documentContent 
                    }
                  });
                  
                  if (response.error) {
                    console.error('Erro na resposta:', response.error);
                    throw response.error;
                  }
                  
                  if (response.data?.success) {
                    toast({
                      title: "Questões geradas com sucesso!",
                      description: `${response.data.questionsGenerated} questões criadas.`
                    });
                    queryClient.invalidateQueries({ queryKey: ['training', id] });
                  } else {
                    throw new Error('Resposta inválida da função');
                  }
                } catch (err: any) {
                  console.error('Erro ao gerar questões:', err);
                  toast({
                    title: "Erro ao gerar questões",
                    description: err.message || "Não foi possível gerar as questões automaticamente.",
                    variant: "destructive"
                  });
                } finally {
                  setIsGeneratingQuestions(false);
                }
              }}
              disabled={isGeneratingQuestions || !formData.documentContent || formData.documentContent.trim().length < 100}
            >
              {isGeneratingQuestions ? "Gerando..." : "✨ Gerar Questões"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg">Documentos (opcional - para download)</Label>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Estes arquivos ficarão disponíveis para download pelos colaboradores, mas NÃO serão usados para gerar questões.
            </p>
            
            {documents.length > 0 && (
              <div className="space-y-2">
                <Label>Documentos Existentes</Label>
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{doc.file_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}
                      >
                        Baixar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = '.pdf,.doc,.docx';
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file && doc.id) {
                              await handleReplaceDocument(doc.id, doc.file_path, file);
                            }
                          };
                          input.click();
                        }}
                      >
                        Substituir
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeDocument(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label>Adicionar Novos Documentos (PDF, DOCX, TXT)</Label>
              <Input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setNewDocuments(files);
                }}
              />
              {newDocuments.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {newDocuments.length} documento(s) selecionado(s)
                  <p className="text-xs mt-1">
                    💡 A IA irá gerar 30 questões automaticamente a partir destes documentos.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="flex gap-3">
          <Button 
            onClick={() => updateTrainingMutation.mutate()}
            disabled={updateTrainingMutation.isPending}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateTrainingMutation.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/trainings')}
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrainingEdit;
