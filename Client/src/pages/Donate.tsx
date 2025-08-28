import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, HeartHandshake, Coins, CheckCircle } from "lucide-react";

const Donate = () => {
  const [donationType, setDonationType] = useState<"items" | "money">("items");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    itemName: "",
    description: "",
    category: "",
    size: "",
    condition: "",
    images: [] as string[],
  });

  const categories = [
    "Women's Clothing",
    "Men's Clothing",
    "Kids' Clothing",
    "Accessories",
    "Shoes",
    "Home Goods",
  ];

  const conditions = [
    "Like New",
    "Excellent",
    "Good",
    "Fair",
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log("Donation submitted:", formData);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Give Back with Style</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Donate your pre-loved items or make a monetary contribution to support sustainable fashion initiatives in Nepal.
          </p>
        </div>

        <Tabs defaultValue="items" className="w-full" onValueChange={(value) => setDonationType(value as "items" | "money")}>
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="items">Donate Items</TabsTrigger>
            <TabsTrigger value="money">Monetary Donation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="items">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Donation Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Item Donation Form
                  </CardTitle>
                  <CardDescription>
                    Tell us about the item you'd like to donate
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">Your Name</label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Full Name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">Email</label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Email Address"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium">Phone</label>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="Phone Number"
                          value={formData.phone}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="category" className="text-sm font-medium">Category</label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category.toLowerCase()}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="itemName" className="text-sm font-medium">Item Name</label>
                      <Input
                        id="itemName"
                        name="itemName"
                        placeholder="e.g. Denim Jacket, Silk Saree, etc."
                        value={formData.itemName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="description" className="text-sm font-medium">Description</label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Describe the item, including brand, material, and any notable features"
                        value={formData.description}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="size" className="text-sm font-medium">Size</label>
                        <Input
                          id="size"
                          name="size"
                          placeholder="S, M, L, etc."
                          value={formData.size}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="condition" className="text-sm font-medium">Condition</label>
                        <Select
                          value={formData.condition}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Condition" />
                          </SelectTrigger>
                          <SelectContent>
                            {conditions.map(condition => (
                              <SelectItem key={condition} value={condition.toLowerCase()}>
                                {condition}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="address" className="text-sm font-medium">Pickup Address</label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Your address for item pickup"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Item Photos</label>
                      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer">
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload photos of your item
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full">
                      Submit Donation
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Information Panel */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Why Donate Items?</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Reduce Fashion Waste</h4>
                        <p className="text-sm text-muted-foreground">
                          Extend the life of clothing and reduce environmental impact
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Support Local Communities</h4>
                        <p className="text-sm text-muted-foreground">
                          Your donations help provide affordable clothing options
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium">Tax Benefits</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive a tax receipt for your donated items
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>What We Accept</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Gently used clothing</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Shoes and accessories</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Home textiles (clean blankets, curtains)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Traditional wear in good condition</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Pickup Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      We offer free pickup services in Kathmandu and Pokhara valley. 
                      After submitting your donation, our team will contact you within 
                      2 business days to schedule a pickup.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="money">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Monetary Donation Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Make a Monetary Donation
                  </CardTitle>
                  <CardDescription>
                    Your financial support helps us sustain our operations and expand our impact
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="donationAmount" className="text-sm font-medium">Donation Amount (NPR)</label>
                      <div className="grid grid-cols-4 gap-2">
                        <Button type="button" variant="outline">500</Button>
                        <Button type="button" variant="outline">1000</Button>
                        <Button type="button" variant="outline">2000</Button>
                        <Button type="button" variant="outline">5000</Button>
                      </div>
                      <Input
                        id="donationAmount"
                        placeholder="Or enter custom amount"
                        type="number"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="donorName" className="text-sm font-medium">Your Name</label>
                      <Input
                        id="donorName"
                        placeholder="Full Name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="donorEmail" className="text-sm font-medium">Email</label>
                      <Input
                        id="donorEmail"
                        type="email"
                        placeholder="Email Address"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium">Message (Optional)</label>
                      <Textarea
                        id="message"
                        placeholder="Add a personal message with your donation"
                      />
                    </div>
                    
                    <Button type="submit" className="w-full">
                      Donate Now
                    </Button>
                  </form>
                </CardContent>
              </Card>
              
              {/* Information Panel */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>How Your Money Helps</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <HeartHandshake className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Clothing Distribution</h4>
                        <p className="text-sm text-muted-foreground">
                          NPR 1000 provides 5 outfits to people in need
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <HeartHandshake className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Educational Programs</h4>
                        <p className="text-sm text-muted-foreground">
                          Support our sustainable fashion workshops
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <HeartHandshake className="w-5 h-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-medium">Operational Costs</h4>
                        <p className="text-sm text-muted-foreground">
                          Help us maintain our pickup and distribution network
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>Credit/Debit Card</li>
                      <li>Mobile Banking (eSewa, Khalti)</li>
                      <li>Bank Transfer</li>
                      <li>Digital Wallet</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Tax Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      All monetary donations are tax-deductible. You will receive 
                      an official receipt for tax purposes after your donation is processed.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default Donate;