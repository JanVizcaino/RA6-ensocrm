import React, { useState } from 'react';
import { Lightbulb, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { IconWrapper } from '../ui/IconWrapper';
import { TextInput } from '../ui/TextInput'; 
import { TextArea } from '../ui/TextArea';  

interface SuggestionsBoxProps {
  onSubmit?: (data: { subject: string; description: string }) => void;
  className?: string;
}

export const SuggestionsBox: React.FC<SuggestionsBoxProps> = ({ 
  onSubmit, 
  className = '' 
}) => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmitting(true);
    
    setTimeout(() => {
      onSubmit?.({ subject, description });
      setSubject('');
      setDescription('');
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <div 
      className={`
        w-full p-6 sm:p-8 
        bg-bg-card rounded-lg shadow-sm
        outline -outline-offset-1 outline-border-line
        flex flex-col md:flex-row items-start gap-8 md:gap-12
        ${className}
      `}
    >
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <IconWrapper 
          icon={<Lightbulb size={24} />} 
          theme="brand" 
          variant="circle" 
          className="w-12 h-12"
        />
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-bold font-sans text-text-main tracking-tight">
            ¿Tienes alguna sugerencia?
          </h2>
          <p className="text-sm font-normal font-sans text-text-body leading-relaxed">
            Tu opinión nos ayuda a mejorar ENSO. Cuéntanos qué nueva funcionalidad te gustaría ver o cómo podemos facilitarte el día a día.
          </p>
        </div>
      </div>

      <form 
        onSubmit={handleSubmit}
        className="w-full md:w-2/3 flex flex-col gap-5"
      >
        <TextInput
          label="Asunto"
          placeholder="Ej: Nuevo filtro para la tabla de alumnos..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />

        <TextArea
          label="Descripción"
          placeholder="Detalla tu idea aquí..."
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <div className="flex justify-end pt-2">
          <Button 
            type="submit" 
            icon={<Send size={16} />} 
            iconPosition="right"
            isLoading={isSubmitting}
            disabled={!subject.trim() || !description.trim()}
          >
            Enviar sugerencia
          </Button>
        </div>
      </form>

    </div>
  );
};