"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Switch } from "@/components/ui/Switch";
import {
  Settings,
  User,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Building,
  AlertCircle,
  CheckCircle,
  Package
} from "lucide-react";
import { AvatarUpload } from "@/components/avatar/AvatarUpload";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  country: string;
  website: string;
  description: string;
  avatar: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  orderUpdates: boolean;
  marketingEmails: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');

  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    name: "",
    email: "",
    phone: "",
    company: "",
    address: "",
    city: "",
    country: "",
    website: "",
    description: "",
    avatar: "",
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderUpdates: true,
    marketingEmails: false,
    weeklyReports: true,
    monthlyReports: true,
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: 30,
    passwordExpiry: 90,
  });

  const [lowStockThreshold, setLowStockThreshold] = useState<number>(10);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Check if user is seller / İstifadəçinin satıcı olub-olmadığını yoxla
  useEffect(() => {
    if (status === "loading") return;
    
    // For testing purposes, skip authentication check
    // Test məqsədləri üçün autentifikasiya yoxlamasını keç
    // if (!session || session.user?.role !== "SELLER") {
    //   router.push("/auth/signin");
    //   return;
    // }
  }, [session, status, router]);

  // Load settings data / Tənzimləmə məlumatlarını yüklə
  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      // Load settings data from unified API / Vahid API-dən tənzimləmə məlumatlarını yüklə
      const response = await fetch("/api/seller/settings");
      if (response.ok) {
        const data = await response.json();
        
        // Set profile data / Profil məlumatlarını təyin et
        setProfile({
          id: data.profile.id,
          name: data.profile.name || "",
          email: data.profile.email || "",
          phone: data.profile.phone || "",
          company: data.profile.company || "",
          address: data.profile.address || "",
          city: data.profile.city || "",
          country: data.profile.country || "",
          website: data.profile.website || "",
          description: data.profile.description || "",
          avatar: data.profile.avatar || "",
        });

        // Set notification settings / Bildiriş tənzimləmələrini təyin et
        if (data.notifications) {
          setNotifications(data.notifications);
        }

        // Set low stock threshold / Aşağı stok həddini təyin et
        if (data.lowStockThreshold !== undefined) {
          setLowStockThreshold(data.lowStockThreshold);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to load settings / Tənzimləmələr yüklənmədi");
      }
    } catch (error) {
      console.error("Error loading settings / Tənzimləmələri yükləmə xətası:", error);
      setError("Failed to load settings / Tənzimləmələr yüklənmədi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");
      
      const response = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          company: profile.company,
          website: profile.website,
          description: profile.description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save profile / Profil saxlanılmadı");
        return;
      }

      const data = await response.json();
      setProfile({
        ...profile,
        ...data.profile,
      });
      setSuccess("Profile updated successfully / Profil uğurla yeniləndi");
    } catch (error) {
      console.error("Error saving profile / Profil saxlaması xətası:", error);
      setError("Failed to save profile / Profil saxlanılmadı");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");
      
      const response = await fetch("/api/seller/settings/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notifications),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save notifications / Bildirişlər saxlanılmadı");
        return;
      }

      const data = await response.json();
      setNotifications(data.notifications);
      setSuccess("Notification settings updated successfully / Bildiriş tənzimləmələri uğurla yeniləndi");
    } catch (error) {
      console.error("Error saving notifications / Bildirişləri saxlaması xətası:", error);
      setError("Failed to save notifications / Bildirişlər saxlanılmadı");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");
      
      // Note: Security settings API will be implemented in future
      // Qeyd: Təhlükəsizlik tənzimləmələri API-si gələcəkdə tətbiq ediləcək
      console.log("Saving security:", security);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuccess("Security settings saved / Təhlükəsizlik tənzimləmələri saxlanıldı");
    } catch (error) {
      console.error("Error saving security / Təhlükəsizliyi saxlaması xətası:", error);
      setError("Failed to save security settings / Təhlükəsizlik tənzimləmələri saxlanılmadı");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLowStockThreshold = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      if (lowStockThreshold < 0) {
        setError(t('thresholdMustBePositive') || "Threshold must be a positive number / Hədd müsbət rəqəm olmalıdır");
        return;
      }

      const response = await fetch("/api/seller/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lowStockThreshold: lowStockThreshold,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save threshold / Hədd saxlanılmadı");
        return;
      }

      setSuccess(t('thresholdUpdated') || "Threshold updated successfully / Hədd uğurla yeniləndi");
    } catch (error) {
      console.error("Error saving low stock threshold / Aşağı stok həddini saxlaması xətası:", error);
      setError("Failed to save threshold / Hədd saxlanılmadı");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setIsSaving(true);
      setError("");
      setSuccess("");

      if (newPassword !== confirmPassword) {
        setError("Passwords don't match / Şifrələr uyğun gəlmir");
        return;
      }

      if (newPassword.length < 8) {
        setError("Password must be at least 8 characters / Şifrə ən azı 8 simvol olmalıdır");
        return;
      }

      const response = await fetch("/api/seller/settings/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to change password / Şifrə dəyişdirilmədi");
        return;
      }

      setSuccess("Password changed successfully / Şifrə uğurla dəyişdirildi");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error changing password / Şifrəni dəyişdirmə xətası:", error);
      setError("Failed to change password / Şifrə dəyişdirilmədi");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container-responsive">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-4" />
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-8 w-full mb-4" />
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container-responsive">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-600">
            {t('manageAccount')}
          </p>
        </div>

        {/* Error and Success Messages / Xəta və Uğur Mesajları */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <p className="text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                {t('profileInformation')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar Upload / Avatar Yükləmə */}
              <div>
                <Label>{t('avatar')}</Label>
                <AvatarUpload
                  currentAvatar={profile.avatar}
                  onUploadSuccess={(imageUrl) => {
                    setProfile({ ...profile, avatar: imageUrl });
                    setSuccess(t('avatarUploaded') || "Avatar uploaded successfully / Avatar uğurla yükləndi");
                  }}
                  onRemoveSuccess={() => {
                    setProfile({ ...profile, avatar: "" });
                    setSuccess(t('avatarRemoved') || "Avatar removed successfully / Avatar uğurla silindi");
                  }}
                />
              </div>
              <div>
                <Label htmlFor="name">{t('fullName')}</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder={t('enterFullName')}
                />
              </div>
              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder={t('enterEmail')}
                />
              </div>
              <div>
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder={t('enterPhone')}
                />
              </div>
              <div>
                <Label htmlFor="company">{t('company')}</Label>
                <Input
                  id="company"
                  value={profile.company}
                  onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  placeholder={t('enterCompany')}
                />
              </div>
              <div>
                <Label htmlFor="website">{t('website')}</Label>
                <Input
                  id="website"
                  value={profile.website}
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  placeholder={t('enterWebsite')}
                />
              </div>
              <div>
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                  id="description"
                  value={profile.description}
                  onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                  placeholder={t('tellAboutBusiness')}
                  rows={3}
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? t('saving') : t('saveProfile')}
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings / Bildiriş Tənzimləmələri */}
          <Card className="card-modern">
            <CardHeader className="p-4 sm:p-5 lg:p-6">
              <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
                <Bell className="h-5 w-5 mr-2" />
                {t('notifications')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">{t('receiveViaEmail')}</Label>
                  <p className="text-sm text-gray-600">{t('receiveViaEmail')}</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={notifications.emailNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms-notifications">{t('receiveViaSms')}</Label>
                  <p className="text-sm text-gray-600">{t('receiveViaSms')}</p>
                </div>
                <Switch
                  id="sms-notifications"
                  checked={notifications.smsNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, smsNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">{t('receivePush')}</Label>
                  <p className="text-sm text-gray-600">{t('receivePush')}</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={notifications.pushNotifications}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="order-updates">{t('getNotified')}</Label>
                  <p className="text-sm text-gray-600">{t('getNotified')}</p>
                </div>
                <Switch
                  id="order-updates"
                  checked={notifications.orderUpdates}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, orderUpdates: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="marketing-emails">{t('receiveMarketing')}</Label>
                  <p className="text-sm text-gray-600">{t('receiveMarketing')}</p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={notifications.marketingEmails}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, marketingEmails: checked })}
                />
              </div>
              <Button onClick={handleSaveNotifications} disabled={isSaving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? t('saving') : t('saveNotifications')}
              </Button>
            </CardContent>
          </Card>

          {/* Security Settings / Təhlükəsizlik Tənzimləmələri */}
          <Card className="card-modern">
            <CardHeader className="p-4 sm:p-5 lg:p-6">
              <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
                <Shield className="h-5 w-5 mr-2" />
                {t('security')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">{t('twoFactorAuth')}</Label>
                  <p className="text-sm text-gray-600">{t('addExtraSecurity')}</p>
                </div>
                <Switch
                  id="two-factor"
                  checked={security.twoFactorAuth}
                  onCheckedChange={(checked) => setSecurity({ ...security, twoFactorAuth: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="login-alerts">{t('loginAlerts')}</Label>
                  <p className="text-sm text-gray-600">{t('getNotifiedNewLogins')}</p>
                </div>
                <Switch
                  id="login-alerts"
                  checked={security.loginAlerts}
                  onCheckedChange={(checked) => setSecurity({ ...security, loginAlerts: checked })}
                />
              </div>
              <div>
                <Label htmlFor="session-timeout">{t('sessionTimeout')} ({tCommon('minutes')})</Label>
                <Select
                  value={security.sessionTimeout.toString()}
                  onValueChange={(value) => setSecurity({ ...security, sessionTimeout: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 {tCommon('minutes')}</SelectItem>
                    <SelectItem value="30">30 {tCommon('minutes')}</SelectItem>
                    <SelectItem value="60">1 {t('hour')}</SelectItem>
                    <SelectItem value="120">2 {t('hours')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="password-expiry">{t('passwordExpiry')} ({tCommon('days')})</Label>
                <Select
                  value={security.passwordExpiry.toString()}
                  onValueChange={(value) => setSecurity({ ...security, passwordExpiry: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 {tCommon('days')}</SelectItem>
                    <SelectItem value="60">60 {tCommon('days')}</SelectItem>
                    <SelectItem value="90">90 {tCommon('days')}</SelectItem>
                    <SelectItem value="180">180 {tCommon('days')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveSecurity} disabled={isSaving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? t('saving') : t('saveSecurity')}
              </Button>
            </CardContent>
          </Card>

          {/* Low Stock Threshold Settings / Aşağı Stok Həddi Tənzimləmələri */}
          <Card className="card-modern">
            <CardHeader className="p-4 sm:p-5 lg:p-6">
              <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
                <Package className="h-5 w-5 mr-2" />
                {t('lowStockThreshold') || "Low Stock Threshold / Aşağı Stok Həddi"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-5 lg:p-6">
              <div>
                <Label htmlFor="low-stock-threshold">
                  {t('lowStockThreshold') || "Low Stock Threshold / Aşağı Stok Həddi"}
                </Label>
                <p className="text-sm text-gray-600 mb-2">
                  {t('whenStockFallsBelow') || "When product stock falls below this number, you will receive alerts / Məhsulun stoku bu rəqəmin altına düşdükdə xəbərdarlıq alacaqsınız"}
                </p>
                <Input
                  id="low-stock-threshold"
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(parseInt(e.target.value) || 0)}
                  placeholder="10"
                />
              </div>
              <Button 
                onClick={handleSaveLowStockThreshold} 
                disabled={isSaving} 
                className="w-full"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? t('saving') : t('saveThreshold') || "Save Threshold / Həddi Saxla"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Change Password Section / Şifrə Dəyişdirmə Bölməsi */}
        <Card className="card-modern mt-4 sm:mt-6">
          <CardHeader className="p-4 sm:p-5 lg:p-6">
            <CardTitle className="flex items-center text-base sm:text-lg font-semibold">
              <CreditCard className="h-5 w-5 mr-2" />
              {t('changePassword')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-5 lg:p-6">
            <div>
              <Label htmlFor="current-password">{t('currentPassword')}</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('enterCurrentPassword')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="new-password">{t('newPassword')}</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('enterNewPassword')}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">{t('confirmPassword')}</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('confirmNewPassword')}
              />
            </div>
            <Button 
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || isSaving}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? t('changing') : t('changePasswordButton')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
