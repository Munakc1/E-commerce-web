import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { CategorySection } from "@/components/home/CategorySection";

export const Home = () => {
  return (
    <div>
      <HeroSection />
      <CategorySection />
      <FeaturedProducts />
    </div>
  );
};