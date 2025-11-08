/**
 * Contact Admin Page / Adminə Yaz Səhifəsi
 * Page for Super Sellers to send messages to admin
 * Super Seller-lərin adminə mesaj göndərməsi üçün səhifə
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { MessageForm } from "@/components/contact-admin/MessageForm";
import { MessageList } from "@/components/contact-admin/MessageList";
import { MessageDetails } from "@/components/contact-admin/MessageDetails";
import { MessageSquare } from "lucide-react";

export default function ContactAdminPage() {
  const t = useTranslations('contactAdmin');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Handle message sent / Mesaj göndərildi
  const handleMessageSent = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Handle view message / Mesajı gör
  const handleViewMessage = (messageId: string) => {
    setSelectedMessageId(messageId);
  };

  // Handle back to list / Siyahıya qayıt
  const handleBackToList = () => {
    setSelectedMessageId(null);
    setRefreshKey(prev => prev + 1);
  };

  // Handle delete message / Mesajı sil
  const handleDeleteMessage = () => {
    setRefreshKey(prev => prev + 1);
    if (selectedMessageId) {
      setSelectedMessageId(null);
    }
  };

  // If viewing message details / Əgər mesaj detallarına baxırsa
  if (selectedMessageId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            {t('title')}
          </h1>
          <p className="text-gray-600 mt-1">{t('subtitle')}</p>
        </div>
        <MessageDetails
          messageId={selectedMessageId}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          {t('title')}
        </h1>
        <p className="text-gray-600 mt-1">{t('subtitle')}</p>
      </div>

      <Tabs defaultValue="new" className="space-y-4">
        <TabsList>
          <TabsTrigger value="new">{t('newMessage')}</TabsTrigger>
          <TabsTrigger value="messages">{t('myMessages')}</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>{t('newMessage')}</CardTitle>
              <CardDescription>
                Send a message to admin with your questions or concerns
                Adminə suallarınızı və ya narahatlıqlarınızı göndərin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MessageForm onSuccess={handleMessageSent} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>{t('myMessages')}</CardTitle>
              <CardDescription>
                View and manage your messages to admin
                Adminə göndərdiyiniz mesajları görüntüləyin və idarə edin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MessageList
                key={refreshKey}
                onViewMessage={handleViewMessage}
                onDeleteMessage={handleDeleteMessage}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

