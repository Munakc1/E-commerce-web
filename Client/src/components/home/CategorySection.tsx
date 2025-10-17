import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type Category = {
  name: string;
  count: string;
  image: string;
  color: string;
};

export const CategorySection = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);

  // Function to convert category name to URL-friendly slug
  const getCategorySlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // Handle navigation to category page
  const handleExplore = (categoryName: string) => {
    const slug = getCategorySlug(categoryName);
    navigate(`/category/${slug}`);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Try backend first
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Backend not available");
        const data = await res.json();
        setCategories(data.categories || []);
      } catch (err) {
        console.warn("Using mock categories:", err);
        const res = await fetch("/mock/data.json");
        const data = await res.json();
        setCategories(data.categories || []);
      }
    };

    fetchCategories();
  }, []);

  return (
    <section className="py-16 bg-thrift-cream/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-muted-foreground">
            Find exactly what you're looking for in our organized collections
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {categories.map((category, index) => (
            <Card
              key={index}
              className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-none"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${category.color} group-hover:opacity-80 transition-opacity`}
                />

                {/* Content Overlay */}
                <div className="absolute inset-0 flex items-end p-6">
                  <div className="text-white">
                    <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                    <p className="text-white/90 mb-3">{category.count}</p>
                    <Button
                      size="sm"
                      className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white hover:text-gray-900"
                      variant="outline"
                      onClick={() => handleExplore(category.name)}
                    >
                      Explore
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
