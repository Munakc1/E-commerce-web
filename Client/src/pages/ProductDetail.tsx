import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();


  const product = {
    id: id,
    title: "Vintage Denim Jacket",
    price: 45.00,
    originalPrice: 89.00,
    condition: "Excellent",
    size: "M",
    brand: "Levi's",
    description: "Classic vintage denim jacket in excellent condition. Perfect for any season.",
    seller: "EcoFashionista",
    image: "/placeholder-product.jpg",
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        ← Back to Shop
      </Button>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Product Image */}
        <div>
          <img 
            src={product.image} 
            alt={product.title}
            className="w-full rounded-lg border"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">{product.title}</h1>
            <p className="text-gray-600">{product.brand}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-thrift-green">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-xl text-gray-400 line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <p><span className="font-semibold">Condition:</span> {product.condition}</p>
            <p><span className="font-semibold">Size:</span> {product.size}</p>
            <p><span className="font-semibold">Seller:</span> {product.seller}</p>
          </div>

          <p className="text-gray-700">{product.description}</p>

          <div className="flex gap-4">
            <Button className="flex-1 bg-thrift-green hover:bg-thrift-green/90">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add to Cart
            </Button>
            <Button variant="outline" size="icon">
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}