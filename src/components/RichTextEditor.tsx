import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, List, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor = ({ value, onChange, placeholder, className }: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const applyLineHeight = (lineHeight: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.lineHeight = lineHeight;
      
      try {
        range.surroundContents(span);
      } catch {
        span.appendChild(range.extractContents());
        range.insertNode(span);
      }
      
      selection.removeAllRanges();
      selection.addRange(range);
    }
    editorRef.current?.focus();
  };

  const fonts = [
    { name: "Arial", value: "Arial, sans-serif" },
    { name: "Times New Roman", value: "Times New Roman, serif" },
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Courier New", value: "Courier New, monospace" },
    { name: "Verdana", value: "Verdana, sans-serif" },
    { name: "Helvetica", value: "Helvetica, sans-serif" },
    { name: "Comic Sans", value: "Comic Sans MS, cursive" },
    { name: "Impact", value: "Impact, fantasy" },
  ];

  const lineHeights = [
    { name: "Simples", value: "1" },
    { name: "1.15", value: "1.15" },
    { name: "1.5", value: "1.5" },
    { name: "Duplo", value: "2" },
    { name: "2.5", value: "2.5" },
    { name: "3", value: "3" },
  ];

  const colors = [
    { name: "Preto", value: "#000000" },
    { name: "Vermelho", value: "#ef4444" },
    { name: "Laranja", value: "#f97316" },
    { name: "Amarelo", value: "#eab308" },
    { name: "Verde", value: "#22c55e" },
    { name: "Azul", value: "#3b82f6" },
    { name: "Roxo", value: "#a855f7" },
    { name: "Rosa", value: "#ec4899" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex gap-1 p-2 border rounded-md bg-muted/50 flex-wrap items-center">
        <Select onValueChange={(value) => execCommand('fontName', value)}>
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>{font.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-px bg-border mx-1" />
        <Select onValueChange={applyLineHeight}>
          <SelectTrigger className="h-8 w-[120px]">
            <SelectValue placeholder="Espaçamento" />
          </SelectTrigger>
          <SelectContent>
            {lineHeights.map((height) => (
              <SelectItem key={height.value} value={height.value}>
                {height.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('bold')}
          className="h-8 w-8 p-0"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('italic')}
          className="h-8 w-8 p-0"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('underline')}
          className="h-8 w-8 p-0"
        >
          <Underline className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyLeft')}
          className="h-8 w-8 p-0"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyCenter')}
          className="h-8 w-8 p-0"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('justifyRight')}
          className="h-8 w-8 p-0"
        >
          <AlignRight className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand('insertUnorderedList')}
          className="h-8 w-8 p-0"
        >
          <List className="h-4 w-4" />
        </Button>
        <div className="w-px bg-border mx-1" />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 bg-background border shadow-lg z-50">
            <div className="grid grid-cols-4 gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => execCommand('foreColor', color.value)}
                  className="h-8 w-8 rounded border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className={cn(
          "min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground",
          className
        )}
        data-placeholder={placeholder}
      />
    </div>
  );
};
