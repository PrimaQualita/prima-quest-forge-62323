import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Plus, CheckCircle, Loader2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RichTextEditor } from "@/components/RichTextEditor";
import DOMPurify from "dompurify";

const Documents = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
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
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
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

  const updateDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!editingDoc) return;

      setIsGeneratingQuiz(true);
      try {
        const { data: quizData, error: quizError } = await supabase.functions.invoke('generate-quiz', {
          body: { 
            content: formData.content,
            title: formData.title
          }
        });

        if (quizError) throw quizError;

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
            quiz_question: quizData.question,
            quiz_options: quizData.options,
            correct_answer: quizData.correct_answer,
            file_path: filePath,
          })
          .eq('id', editingDoc.id);

        if (error) throw error;
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
      // Gerar quiz com IA
      setIsGeneratingQuiz(true);
      try {
        const { data: quizData, error: quizError } = await supabase.functions.invoke('generate-quiz', {
          body: { 
            content: formData.content,
            title: formData.title
          }
        });

        if (quizError) throw quizError;

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

        // Criar o documento com quiz gerado
        const { error } = await supabase
          .from('compliance_documents')
          .insert({
            title: formData.title,
            category: formData.category,
            description: formData.description,
            content: formData.content,
            quiz_question: quizData.question,
            quiz_options: quizData.options,
            correct_answer: quizData.correct_answer,
            file_path: filePath,
          });

        if (error) throw error;
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

  const submitAcknowledgmentMutation = useMutation({
    mutationFn: async ({ docId, answer }: any) => {
      if (!currentEmployee) {
        throw new Error("Você precisa estar logado como colaborador para aceitar documentos");
      }

      const doc = documents?.find(d => d.id === docId);
      const isCorrect = answer === doc?.correct_answer;

      const { error } = await supabase
        .from('document_acknowledgments')
        .upsert({
          document_id: docId,
          employee_id: currentEmployee.id,
          quiz_answered: true,
          quiz_correct: isCorrect,
          acknowledged_at: isCorrect ? new Date().toISOString() : null,
        });

      if (error) throw error;
      return isCorrect;
    },
    onSuccess: (isCorrect) => {
      if (isCorrect) {
        toast({ title: "Resposta correta! Documento aceito com sucesso." });
      } else {
        toast({ 
          title: "Resposta incorreta", 
          description: "Por favor, leia o documento novamente e tente outra vez.",
          variant: "destructive" 
        });
      }
      setSelectedDoc(null);
      setQuizAnswer("");
      queryClient.invalidateQueries({ queryKey: ['acknowledgments'] });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground uppercase">DOCUMENTOS DE COMPLIANCE</h1>
          <p className="text-muted-foreground mt-1">Gerencie políticas e regulamentos</p>
        </div>
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

        {/* Dialog de Edição */}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents?.map((doc) => (
          <Card key={doc.id} className="hover:shadow-elevated transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <FileText className="w-8 h-8 text-primary" />
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditDoc(doc)}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Badge variant="secondary">{doc.category}</Badge>
                </div>
              </div>
              <CardTitle className="mt-4">{doc.title}</CardTitle>
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setSelectedDoc(doc)}
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
                      <p className="text-sm text-muted-foreground">{doc.quiz_question}</p>
                      
                      <RadioGroup value={quizAnswer} onValueChange={setQuizAnswer}>
                        {(doc.quiz_options as string[])?.map((option, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`opt-${idx}`} />
                            <Label htmlFor={`opt-${idx}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                      
                      <Button 
                        className="w-full"
                        disabled={!quizAnswer || !currentEmployee}
                        onClick={() => submitAcknowledgmentMutation.mutate({
                          docId: doc.id,
                          answer: quizAnswer
                        })}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirmar Aceite
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Documents;
