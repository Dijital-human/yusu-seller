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
import { MOCK_CATEGORIES } from "@/lib/constants/categories";

const productSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.number().positive("Price must be positive"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  categoryId: z.string().min(1, "Category is required"),
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
  const [isMounted, setIsMounted] = useState(false);
  
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

  useEffect(() => {
    setIsMounted(true);
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      const errorMessage = event.reason instanceof Error 
        ? event.reason.message 
        : event.reason instanceof Event
          ? "An unexpected error occurred"
          : String(event.reason);
      setError(errorMessage);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (isMounted) {
      loadCategories().catch((error) => {
        console.error("Error in loadCategories:", error);
      });
    }
  }, [isMounted]);

  useEffect(() => {
    return () => {
      mediaFiles.forEach(file => {
        if (file.url && file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, [mediaFiles]);

  const loadCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCategories(result.data);
          return;
        }
      }
      setCategories(MOCK_CATEGORIES);
    } catch (error) {
      console.error("Error loading categories:", error);
      setCategories(MOCK_CATEGORIES);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        try {
          if (file.type.startsWith('image/')) {
            const id = Math.random().toString(36).substr(2, 9);
            const url = URL.createObjectURL(file);
            
            setMediaFiles(prev => {
              const isFirstImage = prev.filter(f => f.type === 'image').length === 0;
              const newMediaFile: MediaFile = {
                id,
                file,
                type: 'image',
                url,
                isMain: isFirstImage,
              };
              return [...prev, newMediaFile];
            });
          }
        } catch (fileError) {
          console.error("Error processing image file:", fileError);
          setError(`Failed to process image: ${file.name}`);
        }
      });
    } catch (error) {
      console.error("Error in handleImageUpload:", error);
      setError("Failed to upload images. Please try again.");
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = event.target.files;
      if (!files) return;

      Array.from(files).forEach((file) => {
        try {
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
        } catch (fileError) {
          console.error("Error processing video file:", fileError);
          setError(`Failed to process video: ${file.name}`);
        }
      });
    } catch (error) {
      console.error("Error in handleVideoUpload:", error);
      setError("Failed to upload videos. Please try again.");
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const removeMediaFile = (id: string) => {
    try {
      setMediaFiles(prev => {
        const fileToRemove = prev.find(f => f.id === id);
        if (fileToRemove?.url && fileToRemove.url.startsWith('blob:')) {
          URL.revokeObjectURL(fileToRemove.url);
        }
        
        const updated = prev.filter(file => file.id !== id);
        if (updated.length > 0 && !updated.some(file => file.isMain && file.type === 'image')) {
          const firstImage = updated.find(file => file.type === 'image');
          if (firstImage) {
            firstImage.isMain = true;
          }
        }
        return updated;
      });
    } catch (error) {
      console.error("Error removing media file:", error);
      setError("Failed to remove media file");
    }
  };

  const setMainImage = (id: string) => {
    try {
      setMediaFiles(prev => 
        prev.map(file => ({
          ...file,
          isMain: file.id === id && file.type === 'image'
        }))
      );
    } catch (error) {
      console.error("Error setting main image:", error);
      setError("Failed to set main image");
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const hasImages = mediaFiles.some(file => file.type === 'image');
      if (!hasImages) {
        setError("At least one image is required");
        setIsLoading(false);
        return;
      }

      setIsUploading(true);
      const uploadedImages: string[] = [];
      
      try {
        for (const mediaFile of mediaFiles) {
          if (mediaFile.type === 'image' && mediaFile.file) {
            const uploadFormData = new FormData();
            uploadFormData.append('file', mediaFile.file);
            uploadFormData.append('type', 'image');

            const uploadResponse = await fetch('/api/upload', {
              method: 'POST',
              body: uploadFormData,
            });

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json().catch(() => ({}));
              throw new Error(errorData.error || 'Failed to upload image');
            }

            const uploadData = await uploadResponse.json().catch(() => ({}));
            if (uploadData.fileUrl || uploadData.url) {
              uploadedImages.push(uploadData.fileUrl || uploadData.url);
            }
          }
        }
      } catch (uploadError: any) {
        console.error("Error uploading images:", uploadError);
        setError(uploadError.message || "Failed to upload images. Please try again.");
        setIsLoading(false);
        setIsUploading(false);
        return;
      }

      setIsUploading(false);

      const productData = {
        name: data.name,
        description: data.description,
        price: data.price,
        stock: data.stock,
        categoryId: data.categoryId,
        images: uploadedImages,
        isActive: true,
      };

      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.message || 'Failed to create product';
        const errorDetails = errorData.details ? ` Details: ${JSON.stringify(errorData.details)}` : '';
        throw new Error(`${errorMessage}${errorDetails}`);
      }

      const result = await response.json().catch(() => ({}));
      setSuccess("Product created successfully!");
      
      setTimeout(() => {
        router.push("/seller/products");
      }, 2000);

    } catch (error: any) {
      console.error("Error creating product:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage || "Failed to create product. Please try again.");
    } finally {
      setIsLoading(false);
      setIsUploading(false);
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

        <form onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e).catch((error) => {
            console.error("Form submission error:", error);
            const errorMessage = error instanceof Error 
              ? error.message 
              : error instanceof Event 
                ? "An unexpected error occurred"
                : String(error);
            setError(errorMessage);
          });
        }} className="space-y-8">
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
                  {!isMounted ? (
                    <Input
                      id="categoryId"
                      placeholder="Loading categories..."
                      disabled
                    />
                  ) : (
                    <Select 
                      value={watch("categoryId") || undefined}
                      onValueChange={(value) => {
                        setValue("categoryId", value, { shouldValidate: true });
                      }}
                    >
                      <SelectTrigger 
                        id="categoryId"
                        className={errors.categoryId ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select category / Kateqoriya seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.length === 0 ? (
                          <SelectItem value="loading" disabled>
                            Loading categories...
                          </SelectItem>
                        ) : (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
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