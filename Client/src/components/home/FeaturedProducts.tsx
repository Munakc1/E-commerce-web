import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const FeaturedProducts = () => {
  const featuredProducts = [
    {
      id: "1",
      title: "Vintage Denim Jacket with Embroidered Details",
      price: 2500,
      originalPrice: 4000,
      brand: "Vintage Collection",
      size: "M",
      condition: "Excellent" as const,
      images: [
        "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      seller: "Sarah K.",
      location: "Kathmandu",
    },
    {
      id: "2", 
      title: "Handwoven Cotton Kurta Set",
      price: 1800,
      originalPrice: 3200,
      brand: "Local Artisan",
      size: "L",
      condition: "Good" as const,
      images: [
        "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      seller: "Rani T.",
      location: "Pokhara",
    },
    {
      id: "3",
      title: "Designer Wool Coat - Winter Collection",
      price: 4500,
      originalPrice: 8000,
      brand: "Winter Essentials",
      size: "S",
      condition: "Excellent" as const,
      images: [
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      seller: "Maya S.",
      location: "Lalitpur",
    },
    {
      id: "4",
      title: "Casual Summer Dress with Floral Print",
      price: 1200,
      originalPrice: 2000,
      brand: "Summer Vibes",
      size: "M",
      condition: "Good" as const,
      images: [
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
      ],
      seller: "Priya L.",
      location: "Bhaktapur",
    },
  ];

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Featured Pre-Loved Items
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover carefully curated, high-quality second-hand fashion items from our trusted sellers
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button size="lg" variant="outline" className="border-thrift-green text-thrift-green hover:bg-thrift-green hover:text-white">
            View All Products
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
};
// convert this code to next.js material ui typescript taiwndcss color theme shoud be same folder code content shoud be same 