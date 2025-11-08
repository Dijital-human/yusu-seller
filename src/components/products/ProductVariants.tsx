"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/AlertDialog";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/Alert";

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: number | null;
  stock: number;
  attributes: string; // JSON string
  image: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductVariantsProps {
  productId: string;
}

export function ProductVariants({ productId }: ProductVariantsProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    price: "",
    stock: "0",
    attributes: {} as Record<string, any>,
    image: "",
    isActive: true,
  });

  // Load variants
  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/seller/products/${productId}/variants`
      );
      if (!response.ok) throw new Error("Failed to fetch variants");
      const data = await response.json();
      setVariants(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    setFormData({
      name: "",
      sku: "",
      price: "",
      stock: "0",
      attributes: {},
      image: "",
      isActive: true,
    });
    setError(null);
    setSuccess(null);
  };

  const handleEdit = (variant: ProductVariant) => {
    setIsEditing(variant.id);
    setFormData({
      name: variant.name,
      sku: variant.sku || "",
      price: variant.price?.toString() || "",
      stock: variant.stock.toString(),
      attributes: JSON.parse(variant.attributes || "{}"),
      image: variant.image || "",
      isActive: variant.isActive,
    });
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(null);
    setFormData({
      name: "",
      sku: "",
      price: "",
      stock: "0",
      attributes: {},
      image: "",
      isActive: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        name: formData.name,
        sku: formData.sku || undefined,
        price: formData.price ? parseFloat(formData.price) : undefined,
        stock: parseInt(formData.stock, 10),
        attributes: formData.attributes,
        image: formData.image || undefined,
        isActive: formData.isActive,
      };

      let response;
      if (isEditing) {
        // Update variant
        response = await fetch(
          `/api/seller/products/${productId}/variants/${isEditing}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      } else {
        // Create variant
        response = await fetch(
          `/api/seller/products/${productId}/variants`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save variant");
      }

      setSuccess(
        isEditing
          ? "Variant updated successfully"
          : "Variant created successfully"
      );
      handleCancel();
      fetchVariants();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteVariantId) return;

    try {
      const response = await fetch(
        `/api/seller/products/${productId}/variants/${deleteVariantId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete variant");

      setSuccess("Variant deleted successfully");
      setDeleteVariantId(null);
      fetchVariants();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const addAttribute = () => {
    const key = prompt("Attribute key (e.g., 'color', 'size'):");
    if (!key) return;
    const value = prompt("Attribute value:");
    if (!value) return;

    setFormData({
      ...formData,
      attributes: {
        ...formData.attributes,
        [key]: value,
      },
    });
  };

  const removeAttribute = (key: string) => {
    const newAttributes = { ...formData.attributes };
    delete newAttributes[key];
    setFormData({
      ...formData,
      attributes: newAttributes,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product Variants</CardTitle>
            {!isAdding && !isEditing && (
              <Button onClick={handleAdd} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {(isAdding || isEditing) && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Variant Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Color: Red, Size: Large"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      setFormData({ ...formData, sku: e.target.value })
                    }
                    placeholder="e.g., TSHIRT-RED-L"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (optional)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="Leave empty to use product price"
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Stock *</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({ ...formData, stock: e.target.value })
                    }
                    required
                    min="0"
                  />
                </div>
              </div>

              <div>
                <Label>Attributes</Label>
                <div className="space-y-2">
                  {Object.entries(formData.attributes).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <Badge variant="outline">
                        {key}: {value}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttribute(key)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAttribute}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Attribute
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="image">Image URL (optional)</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) =>
                    setFormData({ ...formData, image: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="isActive">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Update" : "Create"} Variant
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {variants.length === 0 && !isAdding && !isEditing ? (
            <div className="text-center py-8 text-gray-500">
              No variants yet. Click "Add Variant" to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Attributes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant) => (
                  <TableRow key={variant.id}>
                    <TableCell className="font-medium">
                      {variant.name}
                    </TableCell>
                    <TableCell>{variant.sku || "-"}</TableCell>
                    <TableCell>
                      {variant.price
                        ? `$${variant.price.toFixed(2)}`
                        : "Product price"}
                    </TableCell>
                    <TableCell>{variant.stock}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(
                          JSON.parse(variant.attributes || "{}")
                        ).map(([key, value]) => (
                          <Badge key={key} variant="outline">
                            {key}: {value as string}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={variant.isActive ? "default" : "secondary"}
                      >
                        {variant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(variant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteVariantId(variant.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteVariantId}
        onOpenChange={(open) => !open && setDeleteVariantId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this variant? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

