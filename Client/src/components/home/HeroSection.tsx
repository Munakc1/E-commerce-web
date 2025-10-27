import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Leaf, Recycle, Heart, ShoppingBag, TrendingUp, DollarSign } from "lucide-react";

export const HeroSection = () => {
  const [itemsSold, setItemsSold] = useState(0);
  const [happyBuyers, setHappyBuyers] = useState(0);
  const [itemsDonated, setItemsDonated] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const navigate = useNavigate();

  // Animate stats counting up
  useEffect(() => {
    const animateValue = (setter, end, duration) => {
      let start = 0;
      const increment = end / (duration / 16); // 16ms per frame for 60fps
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setter(end);
          clearInterval(timer);
        } else {
          setter(Math.floor(start));
        }
      }, 16);
      
      return timer;
    };

    const timer1 = animateValue(setItemsSold, 10000, 2000);
    const timer2 = animateValue(setHappyBuyers, 5000, 2000);
    const timer3 = animateValue(setItemsDonated, 2000, 2000);

    return () => {
      clearInterval(timer1);
      clearInterval(timer2);
      clearInterval(timer3);
    };
  }, []);

  const handleShopClick = () => {
    navigate('/shop');
  };

  const handleSellClick = () => {
    navigate('/sell');
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(0) + 'K+';
    }
    return num.toString();
  };

  return (
    <section className="relative bg-gradient-to-br from-thrift-cream via-background to-thrift-cream min-h-[80vh] flex items-center">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            {/* Badge */}
            <Badge className="bg-thrift-green/10 text-black border-thrift-green/20 hover:bg-thrift-green/20 transition-colors cursor-pointer">
              <Leaf className="w-4 h-4 mr-2" />
              Sustainable Fashion Platform
            </Badge>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Give Fashion a{" "}
                <span className="text-thrift-green relative">
                  Second Life
                  <div className="absolute -bottom-2 left-0 w-full h-1 bg-thrift-warm/30 rounded-full"></div>
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
                Discover unique pre-loved clothes, sell your unworn items, and contribute to a 
                sustainable future. Every purchase makes a difference.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center p-4 bg-white/50 rounded-lg transition-all hover:scale-105">
                <div className="text-xl sm:text-2xl font-bold text-thrift-green flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 mr-1" />
                  {formatNumber(itemsSold)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Items Sold</div>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-lg transition-all hover:scale-105">
                <div className="text-xl sm:text-2xl font-bold text-thrift-green flex items-center justify-center">
                  <Heart className="w-5 h-5 mr-1" />
                  {formatNumber(happyBuyers)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Happy Buyers</div>
              </div>
              <div className="text-center p-4 bg-white/50 rounded-lg transition-all hover:scale-105">
                <div className="text-xl sm:text-2xl font-bold text-thrift-green flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 mr-1" />
                  {formatNumber(itemsDonated)}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Items Donated</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-thrift-green hover:bg-thrift-green/90 text-white transition-all"
                onClick={handleShopClick}
              >
                Start Shopping
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-thrift-green text-thrift-green hover:bg-thrift-green hover:text-white transition-all"
                onClick={handleSellClick}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Sell Your Items
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-4 bg-card rounded-lg border text-center sm:text-left transition-all hover:shadow-md">
                <div className="w-10 h-10 bg-thrift-green/10 rounded-full flex items-center justify-center shrink-0">
                  <Recycle className="w-5 h-5 text-thrift-green" />
                </div>
                <div>
                  <div className="font-medium">Eco-Friendly</div>
                  <div className="text-sm text-muted-foreground">Reduce waste</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-4 bg-card rounded-lg border text-center sm:text-left transition-all hover:shadow-md">
                <div className="w-10 h-10 bg-thrift-green/10 rounded-full flex items-center justify-center shrink-0">
                  <Heart className="w-5 h-5 text-thrift-green" />
                </div>
                <div>
                  <div className="font-medium">Quality Items</div>
                  <div className="text-sm text-muted-foreground">Curated selection</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 p-4 bg-card rounded-lg border text-center sm:text-left transition-all hover:shadow-md">
                <div className="w-10 h-10 bg-thrift-green/10 rounded-full flex items-center justify-center shrink-0">
                  <Leaf className="w-5 h-5 text-thrift-green" />
                </div>
                <div>
                  <div className="font-medium">Give Back</div>
                  <div className="text-sm text-muted-foreground">Donate easily</div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Sustainable fashion collection"
                className={`rounded-2xl shadow-2xl w-full transition-opacity duration-500 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsImageLoaded(true)}
              />
              {!isImageLoaded && (
                <div className="rounded-2xl shadow-2xl w-full h-64 bg-gray-200 animate-pulse"></div>
              )}
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-2 -left-2 lg:-top-4 lg:-left-4 bg-white p-3 lg:p-4 rounded-xl shadow-lg border z-20 transition-all hover:scale-105">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-12 lg:h-12 bg-thrift-green rounded-full flex items-center justify-center">
                  <Leaf className="w-4 h-4 lg:w-6 lg:h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-thrift-green text-sm lg:text-base">100%</div>
                  <div className="text-xs lg:text-sm text-muted-foreground">Sustainable</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-2 -right-2 lg:-bottom-4 lg:-right-4 bg-white p-3 lg:p-4 rounded-xl shadow-lg border z-20 transition-all hover:scale-105">
              <div className="text-center">
                  <div className="text-xl lg:text-2xl font-bold text-thrift-green">50%</div>
                <div className="text-xs lg:text-sm text-muted-foreground">Less CO₂</div>
              </div>
            </div>

            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-thrift-green/5 rounded-full -z-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};