import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Heart, Users, Recycle, Target, Award, Globe, ArrowRight, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const About = () => {
  const stats = [
    { icon: Users, value: 10000, label: "Active Users", displayValue: "10,000+" },
    { icon: Recycle, value: 50000, label: "Items Recycled", displayValue: "50,000+" },
    { icon: Heart, value: 5000, label: "Items Donated", displayValue: "5,000+" },
    { icon: Globe, value: 7, label: "Cities Covered", displayValue: "7" },
  ];

  const values = [
    {
      icon: Leaf,
      title: "Sustainability First",
      description: "Every transaction on ThriftSy contributes to reducing textile waste and promoting circular fashion economy."
    },
    {
      icon: Heart,
      title: "Community Impact",
      description: "We believe in giving back. Our donation program ensures unworn clothes reach those who need them most."
    },
    {
      icon: Users,
      title: "Empowering Sellers",
      description: "We provide a platform for individuals to monetize their unused clothes while promoting sustainable practices."
    },
    {
      icon: Award,
      title: "Quality Assurance",
      description: "All items go through quality checks to ensure our buyers receive authentic, well-maintained pieces."
    }
  ];

  const [dynamicStats, setDynamicStats] = useState(stats);
  const [isVisible, setIsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    const donations = JSON.parse(localStorage.getItem("donations") || "[]");
    const donationCount = donations.filter((d: any) => d.type === "items").length;
    setDynamicStats((prev) =>
      prev.map((stat) =>
        stat.label === "Items Donated"
          ? { ...stat, value: donationCount, displayValue: `${donationCount.toLocaleString()}+` }
          : stat
      )
    );

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => {
      if (statsRef.current) {
        observer.unobserve(statsRef.current);
      }
    };
  }, []);

  const [animatedStats, setAnimatedStats] = useState(
    dynamicStats.map((stat) => ({ ...stat, current: 0 }))
  );

  useEffect(() => {
    if (isVisible) {
      const timers = dynamicStats.map((stat, index) => {
        const increment = stat.value / 50;
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= stat.value) {
            current = stat.value;
            clearInterval(timer);
          }
          setAnimatedStats((prev) =>
            prev.map((s, i) =>
              i === index
                ? { ...s, current: Math.round(current), displayValue: s.label === "Cities Covered" ? `${Math.round(current)}` : `${Math.round(current).toLocaleString()}+` }
                : s
            )
          );
        }, 40);

        return timer;
      });

      return () => timers.forEach((timer) => clearInterval(timer));
    }
  }, [isVisible, dynamicStats]);

  return (
    <>
      <section className="relative bg-gradient-to-br from-thrift-cream via-background to-thrift-cream min-h-[60vh] flex items-center">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div className="space-y-8">
              {/* Badge */}
              <Badge className="bg-thrift-warm/10 text-black border-thrift-warm/20 hover:bg-thrift-warm/20 transition-colors cursor-pointer">
                <Leaf className="w-4 h-4 mr-2" />
                About ThriftSy
              </Badge>

              {/* Heading */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Revolutionizing Fashion in
                  <span className="text-thrift-green relative ml-2">
                    Nepal
                    <div className="absolute -bottom-2 left-0 w-full h-1 bg-thrift-warm/30 rounded-full"></div>
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-lg">
                  ThriftSy is Nepal's first comprehensive platform for second-hand clothes,
                  combining e-commerce with social impact through our unique donation system.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-thrift-green hover:bg-thrift-green/90 text-white transition-all">
                  <Link to="/shop">
                    Start Shopping
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-thrift-green text-thrift-green hover:bg-thrift-green hover:text-white transition-all">
                  <Link to="/sell">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Become a Seller
                  </Link>
                </Button>
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
                  <div className="text-xl lg:text-2xl font-bold text-thrift-warm">85%</div>
                  <div className="text-xs lg:text-sm text-muted-foreground">Waste Reduced</div>
                </div>
              </div>

              {/* Background Decoration */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-thrift-green/5 rounded-full -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card" ref={statsRef}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {animatedStats.map((stat, index) => (
              <div
                key={index}
                className={cn(
                  "text-center opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  isVisible && "opacity-100"
                )}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[hsl(var(--thrift-green))]/15 dark:bg-[hsl(var(--thrift-green))]/25">
                  <stat.icon className="w-8 h-8 text-[hsl(var(--thrift-green))]" aria-hidden="true" />
                </div>
                <div className="text-3xl font-bold text-[hsl(var(--thrift-green))] mb-2">
                  {isVisible ? stat.displayValue : "0"}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                To create a sustainable fashion ecosystem in Nepal where every piece of clothing 
                gets a second chance, waste is minimized, and communities are empowered through 
                conscious consumption and giving.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                We envision a future where buying and selling pre-loved clothes is the norm, 
                not the exception, and where fashion contributes positively to society and the environment.
              </p>
              <Button
                asChild
                className="bg-thrift-green hover:bg-thrift-green/90"
                aria-label="Join our mission by donating"
              >
                <Link to="/donate">
                  Join Our Mission
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="relative">
              <img
                src="favicon.png"
                alt="Sustainable fashion mission"
                className="rounded-2xl shadow-lg"
              />
              <div className="absolute -bottom-6 -left-6 bg-card text-foreground p-6 rounded-xl shadow-lg border border-[hsl(var(--thrift-green))]/20">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[hsl(var(--thrift-green))] rounded-full flex items-center justify-center">
                    <Recycle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-[hsl(var(--thrift-green))]">85%</div>
                    <div className="text-sm text-muted-foreground">Waste Reduced</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-thrift-cream/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at ThriftSy
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className={cn(
                  "border-none shadow-sm hover:shadow-lg transition-shadow",
                  "opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  isVisible && "opacity-100"
                )}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-[hsl(var(--thrift-green))]/15 dark:bg-[hsl(var(--thrift-green))]/25">
                    <value.icon className="w-8 h-8 text-[hsl(var(--thrift-green))]" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How ThriftSy Works</h2>
            <p className="text-lg text-muted-foreground">Simple steps to sustainable fashion</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: "List Your Items",
                description: "Upload photos and details of clothes you no longer wear. Our team helps with quality checks.",
              },
              {
                step: 2,
                title: "Shop & Connect",
                description: "Browse unique pieces, connect with sellers, and find your perfect sustainable fashion match.",
              },
              {
                step: 3,
                title: "Donate & Impact",
                description: "Unsold items can be donated through our program, ensuring nothing goes to waste.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className={cn(
                  "text-center opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500",
                  isVisible && "opacity-100"
                )}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="w-20 h-20 bg-[hsl(var(--thrift-green))] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-thrift-green text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of Nepalis who are already making fashion more sustainable
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-thrift-green hover:bg-gray-100"
              aria-label="Start shopping for sustainable fashion"
            >
              <Link to="/shop">Start Shopping</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-thrift-green"
              aria-label="Become a seller on ThriftSy"
            >
              <Link to="/sell">Become a Seller</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;