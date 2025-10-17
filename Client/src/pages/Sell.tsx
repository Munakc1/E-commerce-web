import { useState, useEffect, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const Sell = () => {
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [size, setSize] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [location, setLocation] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "success" | "error">("idle");
  const [isVisible, setIsVisible] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (formRef.current) {
      observer.observe(formRef.current);
    }

    return () => {
      if (formRef.current) {
        observer.unobserve(formRef.current);
      }
    };
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (images.length + files.length > 8) {
      setSubmissionStatus("error");
      setErrors({ images: "You can upload a maximum of 8 images." });
      return;
    }

    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newImages.push(event.target.result as string);
          if (newImages.length === files.length) {
            setImages([...images, ...newImages]);
            setErrors((prev) => ({ ...prev, images: "" }));
          }
        }
      };
      reader.readAsDataURL(files[i]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, images: "" }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!title.trim()) newErrors.title = "Title is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!category) newErrors.category = "Category is required";
    if (!condition) newErrors.condition = "Condition is required";
    if (!size) newErrors.size = "Size is required";
    if (!price || parseFloat(price) <= 0) newErrors.price = "Valid price is required";
    if (!location.trim()) newErrors.location = "Location is required";
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setSubmissionStatus("error");
      return;
    }

    const listing = {
      id: Date.now().toString(),
      title,
      description,
      category,
      brand,
      condition,
      size,
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      location,
      images,
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage
    const existingListings = JSON.parse(localStorage.getItem("listings") || "[]");
    localStorage.setItem("listings", JSON.stringify([...existingListings, listing]));

    // Reset form
    setImages([]);
    setTitle("");
    setDescription("");
    setCategory("");
    setBrand("");
    setCondition("");
    setSize("");
    setPrice("");
    setOriginalPrice("");
    setLocation("");
    setErrors({});
    setSubmissionStatus("success");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className={cn(
          "mb-8 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500",
          isVisible && "opacity-100"
        )}>
          <h1 className="text-3xl font-bold mb-2">Sell Your Item</h1>
          <p className="text-muted-foreground">
            List your pre-loved fashion items for sale in just a few steps
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" ref={formRef}>
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form
              onSubmit={handleSubmit}
              className={cn(
                "bg-card rounded-lg border p-6 space-y-6",
                "opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500",
                isVisible && "opacity-100"
              )}
            >
              {/* Submission Status */}
              {submissionStatus === "success" && (
                <div className="bg-thrift-green/10 text-thrift-green p-4 rounded-lg animate-in fade-in duration-500">
                  Item successfully listed for sale!
                </div>
              )}
              {submissionStatus === "error" && (
                <div className="bg-thrift-warm/10 text-thrift-warm p-4 rounded-lg animate-in fade-in duration-500">
                  Please fix the errors below and try again.
                </div>
              )}

              {/* Image Upload Section */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Item Images</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                  {images.map((img, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${index + 1}`}
                        className="h-32 w-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Upload Images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      aria-label="Upload item images"
                    />
                  </label>
                </div>
                {errors.images && (
                  <p className="text-sm text-destructive">{errors.images}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Add up to 8 photos. Include different angles and close-ups of any details or flaws.
                </p>
              </div>

              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <Input
                      placeholder="e.g., Vintage Denim Jacket with Embroidered Details"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      aria-invalid={!!errors.title}
                      aria-describedby={errors.title ? "title-error" : undefined}
                    />
                    {errors.title && (
                      <p className="text-sm text-destructive" id="title-error">
                        {errors.title}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description</label>
                    <Textarea
                      placeholder="Describe your item in detail..."
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      aria-invalid={!!errors.description}
                      aria-describedby={errors.description ? "description-error" : undefined}
                    />
                    {errors.description && (
                      <p className="text-sm text-destructive" id="description-error">
                        {errors.description}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <Select
                        value={category}
                        onValueChange={setCategory}
                        required
                        aria-invalid={!!errors.category}
                        aria-describedby={errors.category ? "category-error" : undefined}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="women">Women's Clothing</SelectItem>
                          <SelectItem value="men">Men's Clothing</SelectItem>
                          <SelectItem value="kids">Kids' Clothing</SelectItem>
                          <SelectItem value="accessories">Accessories</SelectItem>
                          <SelectItem value="shoes">Shoes</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-destructive" id="category-error">
                          {errors.category}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">Brand</label>
                      <Input
                        placeholder="Brand name"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Condition</label>
                    <Select
                      value={condition}
                      onValueChange={setCondition}
                      required
                      aria-invalid={!!errors.condition}
                      aria-describedby={errors.condition ? "condition-error" : undefined}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New with tags</SelectItem>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.condition && (
                      <p className="text-sm text-destructive" id="condition-error">
                        {errors.condition}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Size</label>
                    <Select
                      value={size}
                      onValueChange={setSize}
                      required
                      aria-invalid={!!errors.size}
                      aria-describedby={errors.size ? "size-error" : undefined}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xs">XS</SelectItem>
                        <SelectItem value="s">S</SelectItem>
                        <SelectItem value="m">M</SelectItem>
                        <SelectItem value="l">L</SelectItem>
                        <SelectItem value="xl">XL</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.size && (
                      <p className="text-sm text-destructive" id="size-error">
                        {errors.size}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Price (NPR)</label>
                    <Input
                      type="number"
                      placeholder="2500"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      aria-invalid={!!errors.price}
                      aria-describedby={errors.price ? "price-error" : undefined}
                    />
                    {errors.price && (
                      <p className="text-sm text-destructive" id="price-error">
                        {errors.price}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Original Price (NPR)</label>
                    <Input
                      type="number"
                      placeholder="4000"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Location</h3>
                <Input
                  placeholder="Enter your city"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                  aria-invalid={!!errors.location}
                  aria-describedby={errors.location ? "location-error" : undefined}
                />
                {errors.location && (
                  <p className="text-sm text-destructive" id="location-error">
                    {errors.location}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full bg-thrift-green hover:bg-thrift-green/90">
                List Item for Sale
              </Button>
            </form>
          </div>

          {/* Sidebar Tips */}
          <div className={cn(
            "space-y-6 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500",
            isVisible && "opacity-100"
          )}>
            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Selling Tips</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Badge className="mt-1">1</Badge>
                  <span>Use natural lighting for clear, bright photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge className="mt-1">2</Badge>
                  <span>Be honest about the condition of your item</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge className="mt-1">3</Badge>
                  <span>Include measurements for better fit information</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge className="mt-1">4</Badge>
                  <span>Price competitively based on similar items</span>
                </li>
              </ul>
            </div>
            <div className="bg-card rounded-lg border p-6">
              <h3 className="font-semibold mb-4">Why Sell With Us?</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-thrift-green" />
                  <span>Zero listing fees</span>
                </li>
                <li className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-thrift-green" />
                  <span>Reach eco-conscious buyers</span>
                </li>
                <li className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-thrift-green" />
                  <span>Secure payment processing</span>
                </li>
                <li className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-thrift-green" />
                  <span>Seller protection policy</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Sell;