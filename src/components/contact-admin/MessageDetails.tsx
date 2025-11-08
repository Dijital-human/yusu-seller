/**
 * Message Details Component / Mesaj Detalları Komponenti
 * Component for displaying message details
 * Mesaj detallarını göstərmək üçün komponent
 */

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Loader2, ArrowLeft, X } from "lucide-react";
// Format date helper / Tarix formatlaşdırma köməkçisi
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('az-AZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface Message {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  images: string[];
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  admin?: {
    id: string;
    name: string;
    email: string;
  };
}

interface MessageDetailsProps {
  messageId: string;
  onBack?: () => void;
}

export function MessageDetails({ messageId, onBack }: MessageDetailsProps) {
  const t = useTranslations('contactAdmin');
  const tCommon = useTranslations('common');
  
  const [message, setMessage] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Load message details / Mesaj detallarını yüklə
  useEffect(() => {
    loadMessage();
  }, [messageId]);

  const loadMessage = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`/api/seller/messages/${messageId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('error'));
      }

      setMessage(data.message);
    } catch (error: any) {
      console.error("Error loading message:", error);
      setError(error.message || t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Get status badge color / Status badge rəngi al
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'READ':
        return 'bg-blue-100 text-blue-800';
      case 'REPLIED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get priority badge color / Prioritet badge rəngi al
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800';
      case 'NORMAL':
        return 'bg-blue-100 text-blue-800';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800';
      case 'URGENT':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status text / Status mətni al
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return t('statusPending');
      case 'READ':
        return t('statusRead');
      case 'REPLIED':
        return t('statusReplied');
      case 'CLOSED':
        return t('statusClosed');
      default:
        return status;
    }
  };

  // Get priority text / Prioritet mətni al
  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return t('priorityLow');
      case 'NORMAL':
        return t('priorityNormal');
      case 'HIGH':
        return t('priorityHigh');
      case 'URGENT':
        return t('priorityUrgent');
      default:
        return priority;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!message) {
    return (
      <Alert>
        <AlertDescription>{t('error')}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Back Button / Geri Düyməsi */}
      {onBack && (
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('back')}
        </Button>
      )}

      {/* Message Card / Mesaj Kartı */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl">{message.subject}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(message.status)}>
                {getStatusText(message.status)}
              </Badge>
              <Badge className={getPriorityColor(message.priority)}>
                {getPriorityText(message.priority)}
              </Badge>
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2">
            {t('createdAt')}: {formatDate(message.createdAt)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Message Content / Mesaj Məzmunu */}
          <div>
            <p className="text-gray-700 whitespace-pre-wrap">{message.message}</p>
          </div>

          {/* Images / Şəkillər */}
          {message.images && message.images.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">Images / Şəkillər</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {message.images.map((url, index) => (
                  <div
                    key={index}
                    className="relative cursor-pointer group"
                    onClick={() => setSelectedImage(url)}
                  >
                    <img
                      src={url}
                      alt={`Image ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md border hover:opacity-80 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Admin Reply / Admin Cavabı */}
          {message.reply ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-green-800">{t('adminReply')}</h4>
                {message.repliedAt && (
                  <span className="text-xs text-green-600">
                    {formatDate(message.repliedAt)}
                  </span>
                )}
              </div>
              <p className="text-sm text-green-700 whitespace-pre-wrap">{message.reply}</p>
              {message.admin && (
                <p className="text-xs text-green-600 mt-2">
                  {message.admin.name} ({message.admin.email})
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
              <p className="text-sm text-gray-600">{t('noReply')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Modal / Şəkil Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-md"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

