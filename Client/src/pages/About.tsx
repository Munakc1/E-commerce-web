import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Leaf, 
  Heart, 
  Users, 
  Recycle, 
  Target,
  Award,
  Globe,
  ArrowRight
} from "lucide-react";

const About = () => {
  const stats = [
    { icon: Users, value: "10,000+", label: "Active Users" },
    { icon: Recycle, value: "50,000+", label: "Items Recycled" },
    { icon: Heart, value: "5,000+", label: "Items Donated" },
    { icon: Globe, value: "7", label: "Cities Covered" },
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-thrift-cream to-background">
          <div className="container mx-auto px-4 text-center">
            <Badge className="bg-thrift-warm/10 text-thrift-earth border-thrift-warm/20 mb-6">
              <Leaf className="w-4 h-4 mr-2" />
              About ThriftSy
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Revolutionizing Fashion
              <span className="text-thrift-green block">in Nepal</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              ThriftSy is Nepal's first comprehensive platform for second-hand clothes, 
              combining e-commerce with social impact through our unique donation system.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-card">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-thrift-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-8 h-8 text-thrift-green" />
                  </div>
                  <div className="text-3xl font-bold text-thrift-green mb-2">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
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
                <Button className="bg-thrift-green hover:bg-thrift-green/90">
                  Join Our Mission
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1556911073-38141963c3c8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Sustainable fashion mission"
                  className="rounded-2xl shadow-lg"
                />
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-thrift-green rounded-full flex items-center justify-center">
                      <Recycle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-bold text-thrift-green">85%</div>
                      <div className="text-sm text-muted-foreground">Waste Reduced</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
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
                <Card key={index} className="border-none shadow-sm hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-thrift-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <value.icon className="w-8 h-8 text-thrift-green" />
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

        {/* How It Works */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How ThriftSy Works</h2>
              <p className="text-lg text-muted-foreground">Simple steps to sustainable fashion</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-thrift-green rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-bold mb-3">List Your Items</h3>
                <p className="text-muted-foreground">
                  Upload photos and details of clothes you no longer wear. Our team helps with quality checks.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-thrift-green rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Shop & Connect</h3>
                <p className="text-muted-foreground">
                  Browse unique pieces, connect with sellers, and find your perfect sustainable fashion match.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-20 h-20 bg-thrift-green rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-bold mb-3">Donate & Impact</h3>
                <p className="text-muted-foreground">
                  Unsold items can be donated through our program, ensuring nothing goes to waste.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-thrift-green text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of Nepalis who are already making fashion more sustainable
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-thrift-green hover:bg-gray-100">
                Start Shopping
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-thrift-green">
                Become a Seller
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default About;