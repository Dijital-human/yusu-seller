/**
 * Message List Component / Mesaj Siyahısı Komponenti
 * Component for displaying list of messages
 * Mesajlar siyahısını göstərmək üçün komponent
 */

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Loader2, Eye, Trash2, MessageSquare } from "lucide-react";
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

interface MessageListProps {
  onViewMessage?: (messageId: string) => void;
  onDeleteMessage?: (messageId: string) => void;
}

export function MessageList({ onViewMessage, onDeleteMessage }: MessageListProps) {
  const t = useTranslations('contactAdmin');
  const tCommon = useTranslations('common');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load messages / Mesajları yüklə
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch('/api/seller/messages');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('error'));
      }

      setMessages(data.messages || []);
    } catch (error: any) {
      console.error("Error loading messages:", error);
      setError(error.message || t('error'));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete / Silməni idarə et
  const handleDelete = async (messageId: string) => {
    if (!confirm(t('deleteConfirm'))) {
      return;
    }

    try {
      setDeletingId(messageId);
      setError("");

      const response = await fetch(`/api/seller/messages/${messageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('error'));
      }

      // Remove from list / Siyahıdan sil
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      if (onDeleteMessage) {
        onDeleteMessage(messageId);
      }
    } catch (error: any) {
      console.error("Error deleting message:", error);
      setError(error.message || t('error'));
    } finally {
      setDeletingId(null);
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

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">{t('noMessages')}</p>
          <p className="text-sm text-gray-500">{t('noMessagesDesc')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => (
        <Card key={message.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg mb-2">{message.subject}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={getStatusColor(message.status)}>
                    {getStatusText(message.status)}
                  </Badge>
                  <Badge className={getPriorityColor(message.priority)}>
                    {getPriorityText(message.priority)}
                  </Badge>
                  {message.images && message.images.length > 0 && (
                    <Badge variant="outline">
                      {message.images.length} {message.images.length === 1 ? 'Image' : 'Images'} / {message.images.length === 1 ? 'Şəkil' : 'Şəkillər'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onViewMessage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewMessage(message.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('viewDetails')}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(message.id)}
                  disabled={deletingId === message.id}
                >
                  {deletingId === message.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t('delete')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{message.message}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{t('createdAt')}: {formatDate(message.createdAt)}</span>
              {message.repliedAt && (
                <span>{t('repliedAt')}: {formatDate(message.repliedAt)}</span>
              )}
            </div>
            {message.reply && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-semibold text-green-800 mb-1">{t('adminReply')}</p>
                <p className="text-sm text-green-700">{message.reply}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

