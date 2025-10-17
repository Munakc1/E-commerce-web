
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
  const [cartItems] = useState(0); // Mock cart count - in a real app, this would come from context or state management

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
            <Button asChild variant="ghost" size="sm" className="hover:bg-thrift-cream">
              <Link to="/wishlist">
                <Heart className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hover:bg-thrift-cream relative">
              <Link to="/cart">
                <ShoppingBag className="w-5 h-5" />
                {cartItems > 0 && (
                  <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 bg-thrift-warm text-xs">
                    {cartItems}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hover:bg-thrift-cream">
              <Link to="/profile">
                <User className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild className="bg-thrift-green hover:bg-thrift-green/90">
              <Link to="/Signin">
                Sign In
              </Link>
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
                <Button asChild variant="ghost" size="sm">
                  <Link to="/wishlist">
                    <Heart className="w-5 h-5 mr-2" />
                    Wishlist
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="relative">
                  <Link to="/cart">
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Cart
                    {cartItems > 0 && (
                      <Badge className="ml-2 w-5 h-5 p-0 bg-thrift-warm text-xs">
                        {cartItems}
                      </Badge>
                    )}
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/profile">
                    <User className="w-5 h-5 mr-2" />
                    Profile
                  </Link>
                </Button>
              </div>
              <div className="pt-2 px-4">
                <Button asChild className="w-full bg-thrift-green hover:bg-thrift-green/90">
                  <Link to="/signin">
                    Sign In
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  ); 
};
