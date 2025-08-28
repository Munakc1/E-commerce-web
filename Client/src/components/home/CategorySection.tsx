import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const CategorySection = () => {
  const categories = [
    {
      name: "Women's Fashion",
      count: "2,500+ items",
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      color: "from-pink-400/20 to-purple-400/20"
    },
    {
      name: "Men's Clothing",
      count: "1,800+ items", 
      image: "https://images.unsplash.com/photo-1506629905853-6e8f2bd2a040?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      color: "from-blue-400/20 to-cyan-400/20"
    },
    {
      name: "Traditional Wear",
      count: "800+ items",
      image: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      color: "from-orange-400/20 to-red-400/20"
    },
    {
      name: "Accessories",
      count: "1,200+ items",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      color: "from-green-400/20 to-emerald-400/20"
    },
    {
      name: "Shoes & Bags",
      count: "950+ items",
      image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      color: "from-yellow-400/20 to-orange-400/20"
    },
    {
      name: "Kids' Clothes",
      count: "600+ items",
      image: "https://images.unsplash.com/photo-1596638082942-8e9c1d50710c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      color: "from-teal-400/20 to-blue-400/20"
    },
  ];

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
            <Card key={index} className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-none">
              <div className="relative h-48 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${category.color} group-hover:opacity-80 transition-opacity`} />
                
                {/* Content Overlay */}
                <div className="absolute inset-0 flex items-end p-6">
                  <div className="text-white">
                    <h3 className="text-xl font-bold mb-1">{category.name}</h3>
                    <p className="text-white/90 mb-3">{category.count}</p>
                    <Button 
                      size="sm" 
                      className="bg-white/20 backdrop-blur text-white border-white/30 hover:bg-white hover:text-gray-900"
                      variant="outline"
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