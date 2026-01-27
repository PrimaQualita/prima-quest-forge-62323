import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Plus, CheckCircle, Loader2, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RichTextEditor } from "@/components/RichTextEditor";
import DOMPurify from "dompurify";
import { useAuth } from "@/hooks/useAuth";

const Documents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [quizResult, setQuizResult] = useState<'correct' | 'incorrect' | null>(null);
  const [isGeneratingNewQuestion, setIsGeneratingNewQuestion] = useState(false);
  const [isGeneratingAllQuestions, setIsGeneratingAllQuestions] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    content: "",
    quiz_question: "",
    quiz_options: "",
    correct_answer: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: documents } = useQuery({
    queryKey: ['compliance-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compliance_documents')
        .select('*');
      if (error) throw error;
      
      // Ordem específica dos regulamentos
      const orderMap: { [key: string]: number } = {
        "Manual de Compliance": 1,
        "Código de Ética e Conduta": 2,
        "Política de Integridade": 3,
        "Regulamento Antissuborno e Anticorrupção": 4,
        "Regulamento de Due Dilligence": 5,
        "Regulamento de Proteção de Dados": 6,
        "Regulamento de Registros e Controles Contábeis e Financeiros": 7,
        "Regulamento Canal de Denúncia": 8,
      };
      
      // Ordenar com base no mapa, documentos não listados vão para o final
      const sorted = data?.sort((a, b) => {
        const orderA = orderMap[a.title] || 999;
        const orderB = orderMap[b.title] || 999;
        return orderA - orderB;
      }) || [];
      
      console.log('Documents order:', sorted.map(d => d.title));
      return sorted;
    },
    staleTime: 0, // Force fresh data
    refetchOnMount: true,
  });

  const { data: currentEmployee } = useQuery({
    queryKey: ['current-employee'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: acknowledgments } = useQuery({
    queryKey: ['acknowledgments', currentEmployee?.id],
    queryFn: async () => {
      if (!currentEmployee) return [];
      
      const { data, error } = await supabase
        .from('document_acknowledgments')
        .select('*')
        .eq('employee_id', currentEmployee.id)
        .eq('quiz_correct', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentEmployee,
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!editingDoc) return;

      setIsGeneratingQuiz(true);
      try {
        let filePath = editingDoc.file_path;

        if (selectedFile) {
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('compliance-documents')
            .upload(fileName, selectedFile);

          if (uploadError) throw uploadError;
          filePath = fileName;

          // Deletar arquivo antigo se houver
          if (editingDoc.file_path) {
            await supabase.storage
              .from('compliance-documents')
              .remove([editingDoc.file_path]);
          }
        }

        const { error } = await supabase
          .from('compliance_documents')
          .update({
            title: formData.title,
            category: formData.category,
            description: formData.description,
            content: formData.content,
            file_path: filePath,
          })
          .eq('id', editingDoc.id);

        if (error) throw error;

        // Gerar 20 perguntas com IA
        const { data: questionsData, error: questionsError } = await supabase.functions.invoke('generate-document-questions', {
          body: { 
            documentId: editingDoc.id,
            documentContent: formData.content,
            documentTitle: formData.title,
            documentCategory: formData.category
          }
        });

        if (questionsError) {
          console.error("Erro ao gerar questões:", questionsError);
          throw questionsError;
        }

        console.log(`${questionsData.questionsGenerated} questões geradas para o documento`);
      } finally {
        setIsGeneratingQuiz(false);
      }
    },
    onSuccess: () => {
      toast({ title: "Documento atualizado com sucesso!" });
      setIsEditDialogOpen(false);
      setEditingDoc(null);
      setFormData({
        title: "",
        category: "",
        description: "",
        content: "",
        quiz_question: "",
        quiz_options: "",
        correct_answer: "",
      });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['compliance-documents'] });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao atualizar documento", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const addDocumentMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingQuiz(true);
      try {
        let filePath = null;

        // Upload do arquivo se houver
        if (selectedFile) {
          const fileExt = selectedFile.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('compliance-documents')
            .upload(fileName, selectedFile);

          if (uploadError) throw uploadError;
          filePath = fileName;
        }

        // Criar o documento
        const { data: newDoc, error } = await supabase
          .from('compliance_documents')
          .insert({
            title: formData.title,
            category: formData.category,
            description: formData.description,
            content: formData.content,
            file_path: filePath,
          })
          .select()
          .single();

        if (error) throw error;

        // Gerar 20 perguntas com IA
        const { data: questionsData, error: questionsError } = await supabase.functions.invoke('generate-document-questions', {
          body: { 
            documentId: newDoc.id,
            documentContent: formData.content,
            documentTitle: formData.title,
            documentCategory: formData.category
          }
        });

        if (questionsError) {
          console.error("Erro ao gerar questões:", questionsError);
          throw questionsError;
        }

        console.log(`${questionsData.questionsGenerated} questões geradas para o documento`);
      } finally {
        setIsGeneratingQuiz(false);
      }
    },
    onSuccess: () => {
      toast({ title: "Documento adicionado com sucesso!" });
      setIsAddDialogOpen(false);
      setFormData({
        title: "",
        category: "",
        description: "",
        content: "",
        quiz_question: "",
        quiz_options: "",
        correct_answer: "",
      });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ['compliance-documents'] });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao adicionar documento", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const generateAllQuestionsMutation = useMutation({
    mutationFn: async () => {
      setIsGeneratingAllQuestions(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-all-document-questions');
        
        if (error) throw error;
        return data;
      } finally {
        setIsGeneratingAllQuestions(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Questões geradas com sucesso!",
        description: `${data.totalQuestionsGenerated} questões geradas para ${data.totalDocuments} documentos`,
      });
      queryClient.invalidateQueries({ queryKey: ['compliance-documents'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar questões",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const generateNewQuestionMutation = useMutation({
    mutationFn: async (docId: string) => {
      setIsGeneratingNewQuestion(true);
      try {
        // Buscar uma pergunta aleatória diferente da atual
        const { data: questions, error } = await supabase
          .from('document_questions')
          .select('*')
          .eq('document_id', docId);

        if (error) throw error;

        if (!questions || questions.length === 0) {
          throw new Error("Nenhuma pergunta disponível para este documento");
        }

        // Filtrar a pergunta atual se houver
        let availableQuestions = questions;
        if (currentQuiz?.id) {
          availableQuestions = questions.filter(q => q.id !== currentQuiz.id);
        }

        // Se não há mais perguntas diferentes, usar todas
        if (availableQuestions.length === 0) {
          availableQuestions = questions;
        }

        // Selecionar uma pergunta aleatória
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        return availableQuestions[randomIndex];
      } finally {
        setIsGeneratingNewQuestion(false);
      }
    },
    onSuccess: (quizData) => {
      setCurrentQuiz(quizData);
      setQuizAnswer("");
      setQuizResult(null);
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao carregar nova pergunta", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const submitAcknowledgmentMutation = useMutation({
    mutationFn: async ({ docId, answer }: any) => {
      if (!currentEmployee) {
        throw new Error("Você precisa estar logado como colaborador para aceitar documentos");
      }

      const quiz = currentQuiz || documents?.find(d => d.id === docId);
      const isCorrect = answer === quiz?.correct_answer;

      if (isCorrect) {
        const { error } = await supabase
          .from('document_acknowledgments')
          .upsert({
            document_id: docId,
            employee_id: currentEmployee.id,
            quiz_answered: true,
            quiz_correct: isCorrect,
            acknowledged_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      return isCorrect;
    },
    onSuccess: (isCorrect, variables) => {
      if (isCorrect) {
        setQuizResult('correct');
        queryClient.invalidateQueries({ queryKey: ['acknowledgments'] });
      } else {
        setQuizResult('incorrect');
        // Gerar nova pergunta automaticamente
        generateNewQuestionMutation.mutate(variables.docId);
      }
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao processar resposta", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      // Primeiro deletar as questões relacionadas
      await supabase
        .from('document_questions')
        .delete()
        .eq('document_id', docId);

      // Deletar os acknowledgments relacionados
      await supabase
        .from('document_acknowledgments')
        .delete()
        .eq('document_id', docId);

      // Buscar o documento para obter o file_path
      const { data: doc } = await supabase
        .from('compliance_documents')
        .select('file_path')
        .eq('id', docId)
        .single();

      // Deletar o arquivo do storage se existir
      if (doc?.file_path) {
        await supabase.storage
          .from('compliance-documents')
          .remove([doc.file_path]);
      }

      // Deletar o documento
      const { error } = await supabase
        .from('compliance_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Documento excluído com sucesso!" });
      setDeleteDocId(null);
      queryClient.invalidateQueries({ queryKey: ['compliance-documents'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir documento",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const handleEditDoc = (doc: any) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      category: doc.category,
      description: doc.description || "",
      content: doc.content || "",
      quiz_question: doc.quiz_question || "",
      quiz_options: Array.isArray(doc.quiz_options) ? doc.quiz_options.join(', ') : "",
      correct_answer: doc.correct_answer || "",
    });
    setIsEditDialogOpen(true);
  };

  const categories = ["Código de Ética", "Política de Integridade", "Regulamento Interno", "LGPD", "Outro"];

  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground uppercase">REGULAMENTOS</h1>
          <p className="text-muted-foreground mt-1">Gerencie políticas e regulamentos</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              onClick={() => generateAllQuestionsMutation.mutate()}
              disabled={isGeneratingAllQuestions}
              variant="outline"
            >
              {isGeneratingAllQuestions && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Gerar 20 Perguntas para Todos
            </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Documento
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Adicionar Documento de Compliance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input 
                  placeholder="Ex: Código de Ética Prima Qualitá" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <RadioGroup value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center space-x-2">
                      <RadioGroupItem value={cat} id={cat} />
                      <Label htmlFor={cat}>{cat}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Upload do Documento (PDF, DOCX, etc.)</Label>
                <Input 
                  type="file" 
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.txt"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Breve descrição do documento..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo do Documento</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Conteúdo completo ou resumo..."
                  className="min-h-[200px]"
                />
              </div>
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  💡 As perguntas do quiz serão geradas automaticamente pela IA com base no conteúdo do documento.
                </p>
              </div>
              <Button 
                className="w-full"
                onClick={() => addDocumentMutation.mutate()}
                disabled={addDocumentMutation.isPending || isGeneratingQuiz || !formData.title || !formData.category || !formData.content}
              >
                {isGeneratingQuiz && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isGeneratingQuiz ? "Gerando quiz com IA..." : addDocumentMutation.isPending ? "Salvando..." : "Adicionar Documento"}
              </Button>
            </div>
            </DialogContent>
          </Dialog>
          </div>
        )}
      </div>

      {isAdmin && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Documento de Compliance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input 
                  placeholder="Ex: Código de Ética Prima Qualitá" 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <RadioGroup value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  {categories.map(cat => (
                    <div key={cat} className="flex items-center space-x-2">
                      <RadioGroupItem value={cat} id={`edit-${cat}`} />
                      <Label htmlFor={`edit-${cat}`}>{cat}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Upload do Documento (PDF, DOCX, etc.)</Label>
                <Input 
                  type="file" 
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".pdf,.doc,.docx,.txt"
                />
                {editingDoc?.file_path && !selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Arquivo atual: {editingDoc.file_path}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Breve descrição do documento..."
                  className="min-h-[80px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo do Documento</Label>
                <RichTextEditor
                  value={formData.content}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder="Conteúdo completo ou resumo..."
                  className="min-h-[200px]"
                />
              </div>
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  💡 As perguntas do quiz serão geradas automaticamente pela IA com base no conteúdo atualizado.
                </p>
              </div>
              <Button 
                className="w-full"
                onClick={() => updateDocumentMutation.mutate()}
                disabled={updateDocumentMutation.isPending || isGeneratingQuiz || !formData.title || !formData.category || !formData.content}
              >
                {isGeneratingQuiz && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isGeneratingQuiz ? "Gerando quiz com IA..." : updateDocumentMutation.isPending ? "Salvando..." : "Atualizar Documento"}
              </Button>
            </div>
            </DialogContent>
        </Dialog>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents?.map((doc) => {
          const isAccepted = acknowledgments?.some(ack => ack.document_id === doc.id);
          
          return (
            <Card key={doc.id} className="hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDoc(doc)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteDocId(doc.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Badge variant="secondary">{doc.category}</Badge>
                  </div>
                </div>
                <CardTitle className="mt-4 text-center leading-[1.5]">{doc.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="text-sm text-muted-foreground mb-4" 
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.description || "") }}
                />
                {doc.file_path && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mb-2 w-full"
                    onClick={async () => {
                      const { data } = supabase.storage
                        .from('compliance-documents')
                        .getPublicUrl(doc.file_path);
                      window.open(data.publicUrl, '_blank');
                    }}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Baixar Arquivo
                  </Button>
                )}
                {isAccepted ? (
                  <Button 
                    variant="default" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Documento Aceito
                  </Button>
                ) : (
                  <Dialog open={selectedDoc?.id === doc.id} onOpenChange={(open) => {
                    if (!open) {
                      setSelectedDoc(null);
                      setQuizAnswer("");
                      setQuizResult(null);
                      setCurrentQuiz(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={async () => {
                          setSelectedDoc(doc);
                          setQuizResult(null);
                          setQuizAnswer("");
                          
                          // Buscar uma pergunta aleatória do banco
                          try {
                            const { data: questions, error } = await supabase
                              .from('document_questions')
                              .select('*')
                              .eq('document_id', doc.id);

                            if (error) throw error;

                            if (questions && questions.length > 0) {
                              const randomIndex = Math.floor(Math.random() * questions.length);
                              setCurrentQuiz(questions[randomIndex]);
                            } else {
                              // Fallback para o quiz antigo se não houver perguntas
                              setCurrentQuiz({
                                question: doc.quiz_question,
                                options: doc.quiz_options,
                                correct_answer: doc.correct_answer
                              });
                            }
                          } catch (error) {
                            console.error("Erro ao buscar pergunta:", error);
                            toast({
                              title: "Erro ao carregar pergunta",
                              description: "Tente novamente",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        Ler e Aceitar
                      </Button>
                    </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{doc.title}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: doc.content || "Conteúdo do documento..." }}
                    />
                    
                    <div className="border-t pt-6 space-y-4">
                      <h3 className="font-semibold text-lg">Quiz de Validação</h3>
                      
                      {quizResult === 'correct' ? (
                        <div className="space-y-4">
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
                              <CheckCircle className="w-5 h-5" />
                              <p className="font-semibold">Resposta correta!</p>
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                              Documento aceito com sucesso. Você pode fechar esta janela.
                            </p>
                          </div>
                          <Button 
                            className="w-full"
                            onClick={() => {
                              setSelectedDoc(null);
                              setQuizAnswer("");
                              setQuizResult(null);
                              setCurrentQuiz(null);
                            }}
                          >
                            Fechar
                          </Button>
                        </div>
                      ) : quizResult === 'incorrect' ? (
                        <div className="space-y-4">
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                              <span className="text-xl">✗</span>
                              <p className="font-semibold">Resposta incorreta</p>
                            </div>
                            <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                              {isGeneratingNewQuestion 
                                ? "Gerando nova pergunta..." 
                                : "Por favor, tente responder a nova pergunta abaixo."}
                            </p>
                          </div>
                          
                          {!isGeneratingNewQuestion && currentQuiz && (
                            <>
                              <p className="text-sm text-muted-foreground">{currentQuiz.question}</p>
                              
                              <RadioGroup value={quizAnswer} onValueChange={setQuizAnswer}>
                                {Object.entries(currentQuiz.options || {}).map(([key, value]) => (
                                  <div key={key} className="flex items-center space-x-2">
                                    <RadioGroupItem value={key} id={`opt-new-${key}`} />
                                    <Label htmlFor={`opt-new-${key}`}>{value as string}</Label>
                                  </div>
                                ))}
                              </RadioGroup>
                              
                              <Button 
                                className="w-full"
                                disabled={!quizAnswer || !currentEmployee || submitAcknowledgmentMutation.isPending}
                                onClick={() => submitAcknowledgmentMutation.mutate({
                                  docId: doc.id,
                                  answer: quizAnswer
                                })}
                              >
                                {submitAcknowledgmentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Confirmar Aceite
                              </Button>
                            </>
                          )}
                          
                          {isGeneratingNewQuestion && (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-muted-foreground">
                            {currentQuiz?.question}
                          </p>
                          
                          <RadioGroup value={quizAnswer} onValueChange={setQuizAnswer}>
                            {Object.entries(currentQuiz?.options || {}).map(([key, value]) => (
                              <div key={key} className="flex items-center space-x-2">
                                <RadioGroupItem value={key} id={`opt-${key}`} />
                                <Label htmlFor={`opt-${key}`}>{value as string}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                          
                          <Button 
                            className="w-full"
                            disabled={!quizAnswer || !currentEmployee || submitAcknowledgmentMutation.isPending}
                            onClick={() => submitAcknowledgmentMutation.mutate({
                              docId: doc.id,
                              answer: quizAnswer
                            })}
                          >
                            {submitAcknowledgmentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Confirmar Aceite
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
                )}
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={!!deleteDocId} onOpenChange={(open) => !open && setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este regulamento? Esta ação não pode ser desfeita.
              Todos os dados relacionados (questões, aceites de colaboradores) também serão excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDocId && deleteDocumentMutation.mutate(deleteDocId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDocumentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Documents;
