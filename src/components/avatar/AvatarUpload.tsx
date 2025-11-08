/**
 * Avatar Upload Component / Avatar Yükləmə Komponenti
 * This component provides avatar upload functionality
 * Bu komponent avatar yükləmə funksionallığını təmin edir
 */

"use client";

import { useState, useRef } from "react";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/Button";
import { User, Upload, X, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/Alert";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onUploadSuccess?: (imageUrl: string) => void;
  onRemoveSuccess?: () => void;
  userId?: string; // For user seller avatar upload / İstifadəçi satıcı avatar yükləməsi üçün
}

export function AvatarUpload({
  currentAvatar,
  onUploadSuccess,
  onRemoveSuccess,
  userId,
}: AvatarUploadProps) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  
  const [avatar, setAvatar] = useState<string | null>(currentAvatar || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type / Fayl tipini yoxla
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError(t('invalidImageFormat') || "Invalid image format / Yanlış şəkil formatı");
      return;
    }

    // Validate file size (5MB) / Fayl ölçüsünü yoxla (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError(t('imageTooLarge') || "Image is too large / Şəkil çox böyükdür");
      return;
    }

    // Upload file / Faylı yüklə
    await uploadAvatar(file);
  };

  const uploadAvatar = async (file: File) => {
    try {
      setIsUploading(true);
      setError("");
      setSuccess("");

      const formData = new FormData();
      formData.append('file', file);

      // Determine API endpoint / API endpoint müəyyən et
      const endpoint = userId 
        ? `/api/seller/user-sellers/${userId}/avatar`
        : '/api/seller/upload/avatar';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('avatarUploadError') || "Failed to upload avatar / Avatar yükləmə uğursuz oldu");
      }

      setAvatar(data.imageUrl || data.user?.avatar);
      setSuccess(t('avatarUploaded') || "Avatar uploaded successfully / Avatar uğurla yükləndi");
      
      if (onUploadSuccess) {
        onUploadSuccess(data.imageUrl || data.user?.avatar);
      }

      // Clear success message after 3 seconds / 3 saniyədən sonra uğur mesajını təmizlə
      setTimeout(() => setSuccess(""), 3000);

    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      setError(error.message || t('avatarUploadError') || "Failed to upload avatar / Avatar yükləmə uğursuz oldu");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsUploading(true);
      setError("");
      setSuccess("");

      // Determine API endpoint / API endpoint müəyyən et
      const endpoint = userId 
        ? `/api/seller/user-sellers/${userId}/avatar`
        : '/api/seller/upload/avatar';

      const response = await fetch(endpoint, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove avatar / Avatar silmə uğursuz oldu");
      }

      setAvatar(null);
      setSuccess(t('avatarRemoved') || "Avatar removed successfully / Avatar uğurla silindi");
      
      if (onRemoveSuccess) {
        onRemoveSuccess();
      }

      // Clear success message after 3 seconds / 3 saniyədən sonra uğur mesajını təmizlə
      setTimeout(() => setSuccess(""), 3000);

    } catch (error: any) {
      console.error("Error removing avatar:", error);
      setError(error.message || "Failed to remove avatar / Avatar silmə uğursuz oldu");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Avatar Display / Avatar Görüntüsü */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-gray-300 shadow-md flex items-center justify-center">
              <User className="h-12 w-12 text-blue-600" />
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center space-x-2"
            >
              <Upload className="h-4 w-4" />
              <span>{avatar ? t('changeAvatar') : t('uploadAvatar')}</span>
            </Button>
            
            {avatar && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                <span>{t('removeAvatar')}</span>
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {t('selectImage')} (JPG, PNG, WEBP, max 5MB)
          </p>
        </div>
      </div>

      {/* Hidden file input / Gizli fayl input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error message / Xəta mesajı */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success message / Uğur mesajı */}
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

