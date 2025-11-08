"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Store, User, Mail, Phone, MapPin, Building, Upload, Camera, FileImage, X } from "lucide-react";
import { toast } from "sonner";

/**
 * Seller Signup Page / Satıcı Qeydiyyat Səhifəsi
 * 
 * Bu səhifə seller-lərin qeydiyyatdan keçməsi üçün istifadə olunur.
 * Seller-lər burada öz məlumatlarını və sənədlərini yükləyə bilərlər.
 * 
 * Features / Xüsusiyyətlər:
 * - Personal information / Şəxsi məlumatlar
 * - Business information / Biznes məlumatları
 * - Document upload / Sənəd yükləmə
 * - Form validation / Form yoxlaması
 */

export default function SellerSignUp() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    businessName: "",
    businessType: "",
    businessAddress: "",
    businessDescription: "",
  });
  
  // Document upload states / Sənəd yükləmə state-ləri
  const [businessLicense, setBusinessLicense] = useState<File | null>(null);
  const [taxCertificate, setTaxCertificate] = useState<File | null>(null);
  const [businessLicensePreview, setBusinessLicensePreview] = useState<string | null>(null);
  const [taxCertificatePreview, setTaxCertificatePreview] = useState<string | null>(null);

  /**
   * Handle form submission / Form göndərmə funksiyası
   * Validates form data and creates seller account
   * Form məlumatlarını yoxlayır və seller hesabı yaradır
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required documents / Tələb olunan sənədləri yoxla
      if (!businessLicense || !taxCertificate) {
        toast.error("Please upload all required documents");
        return;
      }

      // Create FormData for file upload / Fayl yükləmə üçün FormData yarat
      const submitData = new FormData();
      
      // Add form data / Form məlumatlarını əlavə et
      Object.entries(formData).forEach(([key, value]) => {
        submitData.append(key, value);
      });
      
      // Add files / Faylları əlavə et
      submitData.append('businessLicense', businessLicense);
      submitData.append('taxCertificate', taxCertificate);

      // Seller qeydiyyat API-si
      const response = await fetch("/api/auth/seller/signup", {
        method: "POST",
        body: submitData,
      });

      if (response.ok) {
        toast.success("Seller account created successfully!");
        router.push("/auth/signin");
      } else {
        const error = await response.json();
        toast.error(error.message || "Registration failed");
      }
    } catch (error) {
      toast.error("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form input changes / Form input dəyişiklikləri
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  /**
   * Handle business license upload / Biznes lisenziyası yükləmə
   */
  const handleBusinessLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Business license must be less than 5MB");
        return;
      }
      setBusinessLicense(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBusinessLicensePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handle tax certificate upload / Vergi şəhadətnaməsi yükləmə
   */
  const handleTaxCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Tax certificate must be less than 5MB");
        return;
      }
      setTaxCertificate(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setTaxCertificatePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Remove business license image / Biznes lisenziyası şəklini sil
   */
  const removeBusinessLicenseImage = () => {
    setBusinessLicense(null);
    setBusinessLicensePreview(null);
  };

  /**
   * Remove tax certificate image / Vergi şəhadətnaməsi şəklini sil
   */
  const removeTaxCertificateImage = () => {
    setTaxCertificate(null);
    setTaxCertificatePreview(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="bg-white border-gray-200 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Store className="h-8 w-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Join as Seller / Satıcı Ol
            </CardTitle>
            <p className="text-gray-600">
              Start selling with Yusu. Reach millions of customers and grow your business.
              / Yusu ilə satışa başlayın. Milyonlarla müştəriyə çatın və biznesinizi inkişaf etdirin.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information / Şəxsi Məlumatlar */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information / Şəxsi Məlumatlar
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-gray-700 mb-2 block font-medium">
                      Full Name / Tam Ad
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-gray-700 mb-2 block font-medium">
                      Email Address / Email Ünvanı
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-gray-700 mb-2 block font-medium">
                      Phone Number / Telefon Nömrəsi
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="+994 XX XXX XX XX"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="businessName" className="text-gray-700 mb-2 block font-medium">
                      Business Name / Biznes Adı
                    </Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="businessName"
                        name="businessName"
                        type="text"
                        required
                        value={formData.businessName}
                        onChange={handleChange}
                        className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your business name"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Information / Biznes Məlumatları */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-blue-600" />
                  Business Information / Biznes Məlumatları
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="businessType" className="text-gray-700 mb-2 block font-medium">
                      Business Type / Biznes Növü
                    </Label>
                    <select
                      id="businessType"
                      name="businessType"
                      required
                      value={formData.businessType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select business type</option>
                      <option value="RETAIL">Retail Store / Pərakəndə Mağaza</option>
                      <option value="WHOLESALE">Wholesale / Topdan Satış</option>
                      <option value="ONLINE">Online Store / Onlayn Mağaza</option>
                      <option value="MANUFACTURER">Manufacturer / İstehsalçı</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="businessAddress" className="text-gray-700 mb-2 block font-medium">
                      Business Address / Biznes Ünvanı
                    </Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        id="businessAddress"
                        name="businessAddress"
                        type="text"
                        required
                        value={formData.businessAddress}
                        onChange={handleChange}
                        className="pl-10 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        placeholder="Enter your business address"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="businessDescription" className="text-gray-700 mb-2 block font-medium">
                    Business Description / Biznes Təsviri
                  </Label>
                  <textarea
                    id="businessDescription"
                    name="businessDescription"
                    required
                    value={formData.businessDescription}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Describe your business and products"
                  />
                </div>
              </div>

              {/* Password Section / Şifrə Bölməsi */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Security / Təhlükəsizlik
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password" className="text-gray-700 mb-2 block font-medium">
                      Password / Şifrə
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Create a strong password"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-gray-700 mb-2 block font-medium">
                      Confirm Password / Şifrəni Təsdiq Et
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Confirm your password"
                    />
                  </div>
                </div>
              </div>

              {/* Document Upload Section / Sənəd Yükləmə Bölməsi */}
              <div className="border-b pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileImage className="h-5 w-5 mr-2 text-blue-600" />
                  Required Documents / Tələb Olunan Sənədlər
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Business License Upload */}
                  <div>
                    <Label className="text-gray-700 mb-2 block font-medium">
                      Business License / Biznes Lisenziyası
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                      {businessLicensePreview ? (
                        <div className="relative">
                          <img
                            src={businessLicensePreview}
                            alt="Business License Preview"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={removeBusinessLicenseImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 mb-2">
                            Upload Business License
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleBusinessLicenseUpload}
                            className="hidden"
                            id="businessLicense"
                          />
                          <label
                            htmlFor="businessLicense"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tax Certificate Upload */}
                  <div>
                    <Label className="text-gray-700 mb-2 block font-medium">
                      Tax Certificate / Vergi Şəhadətnaməsi
                    </Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors">
                      {taxCertificatePreview ? (
                        <div className="relative">
                          <img
                            src={taxCertificatePreview}
                            alt="Tax Certificate Preview"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={removeTaxCertificateImage}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 mb-2">
                            Upload Tax Certificate
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleTaxCertificateUpload}
                            className="hidden"
                            id="taxCertificate"
                          />
                          <label
                            htmlFor="taxCertificate"
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Please ensure all documents are clearly visible and in good quality. 
                    Maximum file size: 5MB per image.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/auth/signin")}
                  className="border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Already have an account? / Hesabınız var?
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !businessLicense || !taxCertificate}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Account..." : "Create Account / Hesab Yarat"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}