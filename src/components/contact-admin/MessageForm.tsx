/**
 * Message Form Component / Mesaj Formu Komponenti
 * Component for sending messages to admin
 * Adminə mesaj göndərmək üçün komponent
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { X, Upload, Image as ImageIcon, Loader2, Send } from "lucide-react";
import { MAX_IMAGES_PER_MESSAGE, validateImageFile } from "@/lib/message-helpers";

interface MessageFormProps {
  onSuccess?: () => void;
}

export function MessageForm({ onSuccess }: MessageFormProps) {
  const t = useTranslations('contactAdmin');
  const tCommon = useTranslations('common');
  
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Handle image upload / Şəkil yükləməni idarə et
  const handleImageUpload = async (file: File) => {
    // Check if max images reached / Maksimum şəkil sayına çatılıb-yox
    if (images.length >= MAX_IMAGES_PER_MESSAGE) {
      setError(t('maxImages'));
      return;
    }

    // Validate image / Şəkili yoxla
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || t('invalidImageFormat'));
      return;
    }

    const tempId = `temp-${Date.now()}`;
    setUploadingImages(prev => [...prev, tempId]);
    setError("");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/seller/messages/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('errorSending'));
      }

      setImages(prev => [...prev, data.url]);
    } catch (error: any) {
      console.error("Error uploading image:", error);
      setError(error.message || t('errorSending'));
    } finally {
      setUploadingImages(prev => prev.filter(id => id !== tempId));
    }
  };

  // Remove image / Şəkili sil
  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle form submission / Form göndərməni idarə et
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate form / Formu yoxla
    if (!subject.trim()) {
      setError(t('subjectRequired'));
      return;
    }

    if (!message.trim()) {
      setError(t('messageRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/seller/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          images,
          priority,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('errorSending'));
      }

      setSuccess(t('sent'));
      setSubject("");
      setMessage("");
      setImages([]);
      setPriority("NORMAL");

      // Call onSuccess callback / onSuccess callback-ini çağır
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      setError(error.message || t('errorSending'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Alert / Xəta Xəbərdarlığı */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert / Uğur Xəbərdarlığı */}
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Subject Input / Başlıq Input */}
      <div>
        <Label htmlFor="subject">{t('subject')}</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder={t('subjectPlaceholder')}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Message Textarea / Mesaj Textarea */}
      <div>
        <Label htmlFor="message">{t('message')}</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('messagePlaceholder')}
          required
          rows={6}
          disabled={isSubmitting}
        />
      </div>

      {/* Priority Select / Prioritet Select */}
      <div>
        <Label htmlFor="priority">{t('priority')}</Label>
        <Select
          value={priority}
          onValueChange={(value: "LOW" | "NORMAL" | "HIGH" | "URGENT") => setPriority(value)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LOW">{t('priorityLow')}</SelectItem>
            <SelectItem value="NORMAL">{t('priorityNormal')}</SelectItem>
            <SelectItem value="HIGH">{t('priorityHigh')}</SelectItem>
            <SelectItem value="URGENT">{t('priorityUrgent')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Image Upload / Şəkil Yükləmə */}
      <div>
        <Label>{t('attachImage')}</Label>
        <div className="mt-2 space-y-2">
          {/* Image Preview / Şəkil Önizləmə */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {images.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {uploadingImages.map((id) => (
              <div key={id} className="w-full h-24 bg-gray-100 rounded-md border flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ))}
          </div>

          {/* Upload Button / Yükləmə Düyməsi */}
          {images.length < MAX_IMAGES_PER_MESSAGE && (
            <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                  }
                }}
                className="hidden"
                disabled={isSubmitting}
              />
              <div className="flex flex-col items-center">
                <Upload className="h-6 w-6 text-gray-400 mb-1" />
                <span className="text-sm text-gray-600">{t('selectImage')}</span>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* Submit Button / Göndərmə Düyməsi */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('sending')}
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            {t('send')}
          </>
        )}
      </Button>
    </form>
  );
}

