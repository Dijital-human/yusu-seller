/**
 * Avatar Display Component / Avatar Görüntüləmə Komponenti
 * This component displays user avatars with fallback
 * Bu komponent istifadəçi avatar-larını fallback ilə göstərir
 */

"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarDisplayProps {
  avatar?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AvatarDisplay({
  avatar,
  name,
  size = 'md',
  className,
}: AvatarDisplayProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-12 w-12',
  };

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name || 'Avatar'}
        className={cn(
          'rounded-full object-cover border-2 border-gray-300 shadow-md',
          sizeClasses[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-gray-300 shadow-md flex items-center justify-center',
        sizeClasses[size],
        className
      )}
    >
      <User className={cn('text-blue-600', iconSizes[size])} />
    </div>
  );
}

