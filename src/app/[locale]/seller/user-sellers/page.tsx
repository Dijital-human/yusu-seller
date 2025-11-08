/**
 * User Sellers Management Page / İstifadəçi Satıcılar İdarəetmə Səhifəsi
 * This page allows Super Sellers to manage their User Sellers
 * Bu səhifə Super Seller-lərə öz User Seller-lərini idarə etməyə imkan verir
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { 
  UserCog, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Users,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Package,
  Warehouse,
  Scan,
  ShoppingCart,
  BarChart,
  Target,
  DollarSign,
  Eye,
  EyeOff,
  Zap
} from "lucide-react";
import { Switch } from "@/components/ui/Switch";
import { getPermissionConfig, permissionConfigs } from "@/lib/permission-helpers";
import { AvatarDisplay } from "@/components/avatar/AvatarDisplay";

interface UserSeller {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string | null;
  permissions: {
    viewPurchasePrice?: boolean;
    publishProducts?: boolean;
    unpublishProducts?: boolean;
    manageWarehouse?: boolean;
    useBarcode?: boolean;
    usePOS?: boolean;
    manageOrders?: boolean;
    viewAnalytics?: boolean;
    manageMarketing?: boolean;
  };
  isActive: boolean;
  createdAt: string;
}

export default function UserSellersPage() {
  const router = useRouter();
  const t = useTranslations('userSellers');
  const tCommon = useTranslations('common');
  
  const [userSellers, setUserSellers] = useState<UserSeller[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserSeller | null>(null);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    permissions: {
      viewPurchasePrice: false,
      publishProducts: false,
      unpublishProducts: false,
      manageWarehouse: false,
      useBarcode: true,
      usePOS: true,
      manageOrders: false,
      viewAnalytics: false,
      manageMarketing: false,
    },
  });

  // Load user sellers / İstifadəçi satıcıları yüklə
  useEffect(() => {
    loadUserSellers();
  }, []);

  const loadUserSellers = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await fetch("/api/seller/user-sellers");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('loadError') || "Failed to load user sellers / İstifadəçi satıcıları yükləmək uğursuz oldu");
      }

      setUserSellers(data.userSellers || []);
    } catch (error: any) {
      console.error("Error loading user sellers:", error);
      setError(error.message || t('loadError') || "Failed to load user sellers / İstifadəçi satıcıları yükləmək uğursuz oldu");
    } finally {
      setIsLoading(false);
    }
  };

  // Create user seller / İstifadəçi satıcı yarat
  const handleCreateUserSeller = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      setError(t('requiredFields') || "Name, email, and password are required / Ad, email və şifrə tələb olunur");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/seller/user-sellers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('createError') || "Failed to create user seller / İstifadəçi satıcı yaratmaq uğursuz oldu");
      }

      setSuccess(t('userSellerCreated') || "User seller created successfully / İstifadəçi satıcı uğurla yaradıldı");
      setNewUser({
        name: "",
        email: "",
        phone: "",
        password: "",
        permissions: {
          viewPurchasePrice: false,
          publishProducts: false,
          unpublishProducts: false,
          manageWarehouse: false,
          useBarcode: true,
          usePOS: true,
          manageOrders: false,
          viewAnalytics: false,
          manageMarketing: false,
        },
      });
      setShowAddForm(false);
      loadUserSellers();
    } catch (error: any) {
      console.error("Error creating user seller:", error);
      setError(error.message || t('createError') || "Failed to create user seller / İstifadəçi satıcı yaratmaq uğursuz oldu");
    } finally {
      setIsLoading(false);
    }
  };

  // Update permissions / İcazələri yenilə
  const handleUpdatePermissions = async (userId: string, permissions: any) => {
    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/seller/user-sellers", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          permissions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('updateError') || "Failed to update permissions / İcazələri yeniləmək uğursuz oldu");
      }

      setSuccess(t('permissionsUpdated') || "Permissions updated successfully / İcazələr uğurla yeniləndi");
      loadUserSellers();
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      setError(error.message || t('updateError') || "Failed to update permissions / İcazələri yeniləmək uğursuz oldu");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user seller / İstifadəçi satıcı sil
  const handleDeleteUserSeller = async (userId: string) => {
    if (!confirm(t('confirmDelete') || "Are you sure you want to delete this user seller? / Bu istifadəçi satıcını silmək istədiyinizə əminsiniz?")) {
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(`/api/seller/user-sellers?userId=${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t('deleteError') || "Failed to delete user seller / İstifadəçi satıcı silmək uğursuz oldu");
      }

      setSuccess(t('userSellerDeleted') || "User seller deleted successfully / İstifadəçi satıcı uğurla silindi");
      loadUserSellers();
    } catch (error: any) {
      console.error("Error deleting user seller:", error);
      setError(error.message || t('deleteError') || "Failed to delete user seller / İstifadəçi satıcı silmək uğursuz oldu");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && userSellers.length === 0) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>{tCommon('loading') || "Loading... / Yüklənir..."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push("/seller/dashboard")}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back') || "Back / Geri"}
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('title') || "User Sellers / İstifadəçi Satıcılar"}
              </h1>
              <p className="text-gray-600">
                {t('description') || "Manage your user sellers and their permissions / İstifadəçi satıcılarınızı və onların icazələrini idarə edin"}
              </p>
            </div>
            <Button onClick={() => setShowAddForm(!showAddForm)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('addUserSeller') || "Add User Seller / İstifadəçi Satıcı Əlavə Et"}
            </Button>
          </div>
        </div>

        {/* Error and Success Messages / Xəta və Uğur Mesajları */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{t('error') || "Error / Xəta"}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>{t('success') || "Success / Uğur"}</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Add User Seller Form / İstifadəçi Satıcı Əlavə Etmə Formu */}
        {showAddForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t('newUserSeller') || "New User Seller / Yeni İstifadəçi Satıcı"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">{t('name') || "Name / Ad"} *</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    placeholder={t('enterName') || "Enter name / Ad daxil edin"}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('email') || "Email"} *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    placeholder={t('enterEmail') || "Enter email / Email daxil edin"}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">{t('phone') || "Phone / Telefon"}</Label>
                  <Input
                    id="phone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    placeholder={t('enterPhone') || "Enter phone / Telefon daxil edin"}
                  />
                </div>
                <div>
                  <Label htmlFor="password">{t('password') || "Password / Şifrə"} *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder={t('enterPassword') || "Enter password / Şifrə daxil edin"}
                  />
                </div>
              </div>
              
              {/* Permissions Section / İcazələr Bölməsi - Organized by categories / Kateqoriyalara görə təşkil edilmiş */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-4 text-gray-900">{t('permissions') || "Permissions / İcazələr"}</h3>
                
                {/* Product Management / Məhsul İdarəetməsi */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-blue-600" />
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {t('productManagement') || "Product Management / Məhsul İdarəetməsi"}
                    </h4>
                  </div>
                  <div className="space-y-3 pl-6">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Eye className={`h-4 w-4 ${newUser.permissions.viewPurchasePrice ? 'text-green-600' : 'text-gray-400'}`} />
                        <Label htmlFor="viewPurchasePrice" className="cursor-pointer">
                          {t('viewPurchasePrice') || "View Purchase Price / Alış Qiymətini Gör"}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        {newUser.permissions.viewPurchasePrice && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Active / Aktiv</Badge>
                        )}
                        <Switch
                          id="viewPurchasePrice"
                          checked={newUser.permissions.viewPurchasePrice}
                          onCheckedChange={(checked) => setNewUser({
                            ...newUser,
                            permissions: { ...newUser.permissions, viewPurchasePrice: checked }
                          })}
                          className={newUser.permissions.viewPurchasePrice ? "data-[state=checked]:bg-green-600" : ""}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Package className={`h-4 w-4 ${newUser.permissions.publishProducts ? 'text-green-600' : 'text-gray-400'}`} />
                        <Label htmlFor="publishProducts" className="cursor-pointer">
                          {t('publishProducts') || "Publish Products / Məhsul Yayımla"}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        {newUser.permissions.publishProducts && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Active / Aktiv</Badge>
                        )}
                        <Switch
                          id="publishProducts"
                          checked={newUser.permissions.publishProducts}
                          onCheckedChange={(checked) => setNewUser({
                            ...newUser,
                            permissions: { ...newUser.permissions, publishProducts: checked }
                          })}
                          className={newUser.permissions.publishProducts ? "data-[state=checked]:bg-green-600" : ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Warehouse & Tools / Anbar & Alətlər */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Warehouse className="h-4 w-4 text-purple-600" />
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {t('warehouseTools') || "Warehouse & Tools / Anbar & Alətlər"}
                    </h4>
                  </div>
                  <div className="space-y-3 pl-6">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Warehouse className={`h-4 w-4 ${newUser.permissions.manageWarehouse ? 'text-green-600' : 'text-gray-400'}`} />
                        <Label htmlFor="manageWarehouse" className="cursor-pointer">
                          {t('manageWarehouse') || "Manage Warehouse / Anbar İdarə Et"}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        {newUser.permissions.manageWarehouse && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Active / Aktiv</Badge>
                        )}
                        <Switch
                          id="manageWarehouse"
                          checked={newUser.permissions.manageWarehouse}
                          onCheckedChange={(checked) => setNewUser({
                            ...newUser,
                            permissions: { ...newUser.permissions, manageWarehouse: checked }
                          })}
                          className={newUser.permissions.manageWarehouse ? "data-[state=checked]:bg-green-600" : ""}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Scan className={`h-4 w-4 ${newUser.permissions.useBarcode ? 'text-green-600' : 'text-gray-400'}`} />
                        <Label htmlFor="useBarcode" className="cursor-pointer">
                          {t('useBarcode') || "Use Barcode / Barkod İstifadə Et"}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        {newUser.permissions.useBarcode && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Active / Aktiv</Badge>
                        )}
                        <Switch
                          id="useBarcode"
                          checked={newUser.permissions.useBarcode}
                          onCheckedChange={(checked) => setNewUser({
                            ...newUser,
                            permissions: { ...newUser.permissions, useBarcode: checked }
                          })}
                          className={newUser.permissions.useBarcode ? "data-[state=checked]:bg-green-600" : ""}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Zap className={`h-4 w-4 ${newUser.permissions.usePOS ? 'text-green-600' : 'text-gray-400'}`} />
                        <Label htmlFor="usePOS" className="cursor-pointer">
                          {t('usePOS') || "Use POS / Kassa İstifadə Et"}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        {newUser.permissions.usePOS && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Active / Aktiv</Badge>
                        )}
                        <Switch
                          id="usePOS"
                          checked={newUser.permissions.usePOS}
                          onCheckedChange={(checked) => setNewUser({
                            ...newUser,
                            permissions: { ...newUser.permissions, usePOS: checked }
                          })}
                          className={newUser.permissions.usePOS ? "data-[state=checked]:bg-green-600" : ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sales & Analytics / Satış & Analitika */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart className="h-4 w-4 text-blue-600" />
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {t('salesAnalytics') || "Sales & Analytics / Satış & Analitika"}
                    </h4>
                  </div>
                  <div className="space-y-3 pl-6">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <ShoppingCart className={`h-4 w-4 ${newUser.permissions.manageOrders ? 'text-green-600' : 'text-gray-400'}`} />
                        <Label htmlFor="manageOrders" className="cursor-pointer">
                          {t('manageOrders') || "Manage Orders / Sifarişləri İdarə Et"}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        {newUser.permissions.manageOrders && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Active / Aktiv</Badge>
                        )}
                        <Switch
                          id="manageOrders"
                          checked={newUser.permissions.manageOrders}
                          onCheckedChange={(checked) => setNewUser({
                            ...newUser,
                            permissions: { ...newUser.permissions, manageOrders: checked }
                          })}
                          className={newUser.permissions.manageOrders ? "data-[state=checked]:bg-green-600" : ""}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <BarChart className={`h-4 w-4 ${newUser.permissions.viewAnalytics ? 'text-green-600' : 'text-gray-400'}`} />
                        <Label htmlFor="viewAnalytics" className="cursor-pointer">
                          {t('viewAnalytics') || "View Analytics / Analitikaya Bax"}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        {newUser.permissions.viewAnalytics && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Active / Aktiv</Badge>
                        )}
                        <Switch
                          id="viewAnalytics"
                          checked={newUser.permissions.viewAnalytics}
                          onCheckedChange={(checked) => setNewUser({
                            ...newUser,
                            permissions: { ...newUser.permissions, viewAnalytics: checked }
                          })}
                          className={newUser.permissions.viewAnalytics ? "data-[state=checked]:bg-green-600" : ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Marketing / Marketinq */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-pink-600" />
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {t('marketing') || "Marketing / Marketinq"}
                    </h4>
                  </div>
                  <div className="space-y-3 pl-6">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <Target className={`h-4 w-4 ${newUser.permissions.manageMarketing ? 'text-green-600' : 'text-gray-400'}`} />
                        <Label htmlFor="manageMarketing" className="cursor-pointer">
                          {t('manageMarketing') || "Manage Marketing / Marketinq İdarə Et"}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        {newUser.permissions.manageMarketing && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Active / Aktiv</Badge>
                        )}
                        <Switch
                          id="manageMarketing"
                          checked={newUser.permissions.manageMarketing}
                          onCheckedChange={(checked) => setNewUser({
                            ...newUser,
                            permissions: { ...newUser.permissions, manageMarketing: checked }
                          })}
                          className={newUser.permissions.manageMarketing ? "data-[state=checked]:bg-green-600" : ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateUserSeller} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {t('create') || "Create / Yarat"}
                </Button>
                <Button onClick={() => setShowAddForm(false)} variant="outline">
                  {tCommon('cancel') || "Cancel / Ləğv Et"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Sellers List / İstifadəçi Satıcılar Siyahısı */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userSellers.map((userSeller) => (
            <Card key={userSeller.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AvatarDisplay
                      avatar={userSeller.avatar}
                      name={userSeller.name}
                      size="md"
                    />
                    <CardTitle className="flex items-center gap-2">
                      {userSeller.name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push(`/seller/user-sellers/${userSeller.id}`)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {t('viewDetails')}
                    </Button>
                    <Button
                      onClick={() => handleDeleteUserSeller(userSeller.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {userSeller.email}
                  </div>
                  {userSeller.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {userSeller.phone}
                    </div>
                  )}
                  
                  {/* Permissions Display / İcazələrin Görüntüsü - Organized with icons / İkonlarla təşkil edilmiş */}
                  <div className="border-t pt-3">
                    <h4 className="text-sm font-semibold mb-3 text-gray-900">{t('permissions') || "Permissions / İcazələr"}</h4>
                    <div className="space-y-2">
                      {permissionConfigs.map((config) => {
                        const value = userSeller.permissions[config.key as keyof typeof userSeller.permissions];
                        if (value === undefined) return null;
                        
                        const Icon = config.icon;
                        const isActive = value === true;
                        
                        return (
                          <div key={config.key} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                              <span className="text-xs text-gray-700 truncate">
                                {t(config.labelKey) || config.key}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isActive && (
                                <Badge className="bg-green-100 text-green-800 text-xs px-1.5 py-0.5">Active / Aktiv</Badge>
                              )}
                              <Switch
                                checked={isActive}
                                onCheckedChange={(checked) => {
                                  handleUpdatePermissions(userSeller.id, {
                                    ...userSeller.permissions,
                                    [config.key]: checked,
                                  });
                                }}
                                className={isActive ? "data-[state=checked]:bg-green-600" : ""}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {userSellers.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('noUserSellers') || "No User Sellers / İstifadəçi Satıcı Yoxdur"}
              </h3>
              <p className="text-gray-500 mb-4">
                {t('createFirstUserSeller') || "Create your first user seller to get started / Başlamaq üçün ilk istifadəçi satıcınızı yaradın"}
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('addUserSeller') || "Add User Seller / İstifadəçi Satıcı Əlavə Et"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

