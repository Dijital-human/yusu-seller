"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Package, 
  ArrowLeft, 
  Save, 
  Loader2,
  Upload,
  X,
  Image,
  Video,
  Plus,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Camera,
  FileVideo
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/Alert";

// Product creation schema / Məhsul yaratma sxemi
const productSchema = z.object({
  name: z.string().min(1, "Product name is required / Məhsul adı tələb olunur"),
  description: z.string().min(10, "Description must be at least 10 characters / Təsvir ən azı 10 simvol olmalıdır"),
  price: z.number().positive("Price must be positive / Qiymət müsbət olmalıdır"),
  stock: z.number().int().min(0, "Stock cannot be negative / Stok mənfi ola bilməz"),
  categoryId: z.string().min(1, "Category is required / Kateqoriya tələb olunur"),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  brand: z.string().optional(),
  sku: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface Category {
  id: string;
  name: string;
}

interface MediaFile {
  id: string;
  file: File;
  type: 'image' | 'video';
  url: string;
  isMain: boolean;
}

export default function NewProductPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
  });

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

  // Load categories / Kateqoriyaları yüklə
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      // For testing purposes, use mock data
      // Test məqsədləri üçün mock məlumat istifadə et
      const mockCategories: Category[] = [
        { id: "1", name: "Electronics / Elektronika" },
        { id: "2", name: "Fashion / Moda" },
        { id: "3", name: "Home & Garden / Ev və Bağ" },
        { id: "4", name: "Sports / İdman" },
        { id: "5", name: "Books / Kitablar" },
        { id: "6", name: "Beauty / Gözəllik" },
        { id: "7", name: "Toys / Oyuncaqlar" },
        { id: "8", name: "Automotive / Avtomobil" },
      ];
      setCategories(mockCategories);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const id = Math.random().toString(36).substr(2, 9);
        const url = URL.createObjectURL(file);
        
        const newMediaFile: MediaFile = {
          id,
          file,
          type: 'image',
          url,
          isMain: mediaFiles.length === 0, // First image is main by default
        };
        
        setMediaFiles(prev => [...prev, newMediaFile]);
      }
    });
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('video/')) {
        const id = Math.random().toString(36).substr(2, 9);
        const url = URL.createObjectURL(file);
        
        const newMediaFile: MediaFile = {
          id,
          file,
          type: 'video',
          url,
          isMain: false,
        };
        
        setMediaFiles(prev => [...prev, newMediaFile]);
      }
    });
  };

  const removeMediaFile = (id: string) => {
    setMediaFiles(prev => {
      const updated = prev.filter(file => file.id !== id);
      // If we removed the main image, make the first remaining image main
      if (updated.length > 0 && !updated.some(file => file.isMain)) {
        updated[0].isMain = true;
      }
      return updated;
    });
  };

  const setMainImage = (id: string) => {
    setMediaFiles(prev => 
      prev.map(file => ({
        ...file,
        isMain: file.id === id && file.type === 'image'
      }))
    );
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Check if at least one image is uploaded
      const hasImages = mediaFiles.some(file => file.type === 'image');
      if (!hasImages) {
        setError("At least one image is required / Ən azı bir şəkil tələb olunur");
        return;
      }

      // Prepare form data
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description);
      formData.append('price', data.price.toString());
      formData.append('stock', data.stock.toString());
      formData.append('categoryId', data.categoryId);
      
      if (data.weight) formData.append('weight', data.weight.toString());
      if (data.dimensions) formData.append('dimensions', data.dimensions);
      if (data.brand) formData.append('brand', data.brand);
      if (data.sku) formData.append('sku', data.sku);

      // Add media files
      mediaFiles.forEach((mediaFile, index) => {
        formData.append(`media_${index}`, mediaFile.file);
        formData.append(`media_type_${index}`, mediaFile.type);
        formData.append(`media_isMain_${index}`, mediaFile.isMain.toString());
      });

      // Simulate API call
      console.log("Creating product with data:", data);
      console.log("Media files:", mediaFiles);
      
      // Simulate upload progress
      setIsUploading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsUploading(false);

      setSuccess("Product created successfully! / Məhsul uğurla yaradıldı!");
      
      // Redirect to products page after 2 seconds
      setTimeout(() => {
        router.push("/seller/products");
      }, 2000);

    } catch (error) {
      console.error("Error creating product:", error);
      setError("Failed to create product. Please try again. / Məhsul yaratmaq uğursuz oldu. Yenidən cəhd edin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.push("/seller/products")}
              className="flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products / Məhsullara Qayıt
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Add New Product / Yeni Məhsul Əlavə Et
          </h1>
          <p className="text-gray-600">
            Create a new product listing with images and videos.
            / Şəkil və videolarla yeni məhsul elanı yaradın.
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Error / Xəta</AlertTitle>
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success / Uğur</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Basic Information / Əsas Məlumatlar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name">Product Name / Məhsul Adı *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="Enter product name"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="categoryId">Category / Kateqoriya *</Label>
                  <Select onValueChange={(value) => setValue("categoryId", value)}>
                    <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && (
                    <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description / Təsvir *</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Describe your product in detail"
                  rows={4}
                  className={errors.description ? "border-red-500" : ""}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="price">Price / Qiymət *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    {...register("price", { valueAsNumber: true })}
                    placeholder="0.00"
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && (
                    <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="stock">Stock / Stok *</Label>
                  <Input
                    id="stock"
                    type="number"
                    {...register("stock", { valueAsNumber: true })}
                    placeholder="0"
                    className={errors.stock ? "border-red-500" : ""}
                  />
                  {errors.stock && (
                    <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="sku">SKU / Məhsul Kodu</Label>
                  <Input
                    id="sku"
                    {...register("sku")}
                    placeholder="Product SKU"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="brand">Brand / Marka</Label>
                  <Input
                    id="brand"
                    {...register("brand")}
                    placeholder="Product brand"
                  />
                </div>

                <div>
                  <Label htmlFor="weight">Weight (kg) / Çəki (kq)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.01"
                    {...register("weight", { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="dimensions">Dimensions / Ölçülər</Label>
                  <Input
                    id="dimensions"
                    {...register("dimensions")}
                    placeholder="L x W x H"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Media / Media Fayllar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Buttons */}
              <div className="flex flex-wrap gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex items-center"
                >
                  <Image className="h-4 w-4 mr-2" />
                  Upload Images / Şəkil Yüklə
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => videoInputRef.current?.click()}
                  className="flex items-center"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Upload Video / Video Yüklə
                </Button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoUpload}
                className="hidden"
              />

              {/* Media Preview */}
              {mediaFiles.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">
                    Uploaded Media / Yüklənmiş Media ({mediaFiles.length} files)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {mediaFiles.map((mediaFile) => (
                      <div key={mediaFile.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                          {mediaFile.type === 'image' ? (
                            <img
                              src={mediaFile.url}
                              alt="Product media"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <video
                              src={mediaFile.url}
                              className="w-full h-full object-cover"
                              controls
                            />
                          )}
                        </div>
                        
                        {/* Overlay with actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex space-x-2">
                            {mediaFile.type === 'image' && (
                              <Button
                                type="button"
                                size="sm"
                                variant={mediaFile.isMain ? "default" : "outline"}
                                onClick={() => setMainImage(mediaFile.id)}
                                className="text-xs"
                              >
                                {mediaFile.isMain ? "Main" : "Set Main"}
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeMediaFile(mediaFile.id)}
                              className="text-xs"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Main image indicator */}
                        {mediaFile.isMain && (
                          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            Main
                          </div>
                        )}

                        {/* File type indicator */}
                        <div className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          {mediaFile.type === 'image' ? (
                            <Image className="h-3 w-3" />
                          ) : (
                            <Video className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  Upload Requirements / Yükləmə Tələbləri
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Images:</strong> At least 1 image required (max 10) / Ən azı 1 şəkil tələb olunur (maksimum 10)</li>
                  <li>• <strong>Videos:</strong> Optional, max 3 videos / İstəyə bağlı, maksimum 3 video</li>
                  <li>• <strong>Formats:</strong> JPG, PNG, GIF for images; MP4, MOV for videos / Formatlar: Şəkillər üçün JPG, PNG, GIF; Videolar üçün MP4, MOV</li>
                  <li>• <strong>Size:</strong> Max 10MB per file / Fayl başına maksimum 10MB</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/seller/products")}
            >
              Cancel / Ləğv Et
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isUploading || mediaFiles.length === 0}
              className="min-w-[120px]"
            >
              {isLoading || isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isUploading ? "Uploading..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Product / Məhsul Yarat
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}