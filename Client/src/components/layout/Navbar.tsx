import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ShoppingBag, 
  User, 
  Heart, 
  Menu, 
  X,
  Leaf
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartItems] = useState(3); // Mock cart count

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/sell", label: "Sell" },
    { href: "/donate", label: "Donate" },
    { href: "/about", label: "About" },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <img 
              src="/images/logo.png" 
              alt="ThriftSy Logo" 
              className="h-16 w-auto group-hover:scale-110 transition-transform"
            />
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search sustainable fashion..."
                className="pl-10 bg-thrift-cream border-none focus:ring-2 focus:ring-thrift-green-light"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-foreground hover:text-thrift-green transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="hover:bg-thrift-cream">
              <Heart className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-thrift-cream relative">
              <ShoppingBag className="w-5 h-5" />
              {cartItems > 0 && (
                <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 bg-thrift-warm text-xs">
                  {cartItems}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-thrift-cream">
              <User className="w-5 h-5" />
            </Button>
            <Button className="bg-thrift-green hover:bg-thrift-green/90">
              Sign In
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search sustainable fashion..."
              className="pl-10 bg-thrift-cream border-none"
            />
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur">
            <div className="py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="block px-4 py-2 text-foreground hover:bg-thrift-cream hover:text-thrift-green transition-colors rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center justify-around pt-4 border-t">
                <Button variant="ghost" size="sm">
                  <Heart className="w-5 h-5 mr-2" />
                  Wishlist
                </Button>
                <Button variant="ghost" size="sm" className="relative">
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  Cart
                  {cartItems > 0 && (
                    <Badge className="ml-2 w-5 h-5 p-0 bg-thrift-warm text-xs">
                      {cartItems}
                    </Badge>
                  )}
                </Button>
                <Button variant="ghost" size="sm">
                  <User className="w-5 h-5 mr-2" />
                  Profile
                </Button>
              </div>
              <div className="pt-2">
                <Button className="w-full bg-thrift-green hover:bg-thrift-green/90">
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};