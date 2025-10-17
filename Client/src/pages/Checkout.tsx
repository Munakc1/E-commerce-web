import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

// Product interface to match WishlistContext
interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  images: string[];
  brand: string;
  size: string;
  condition: "Excellent" | "Good";
  seller: string;
  location: string;
}

interface CartItem {
  id: string;
  quantity: number;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  payment: "cod" | "esewa" | "bank";
  bankAccount?: string;
  bankName?: string;
}

const mockProducts: Product[] = [
  {
    id: "1",
    title: "Vintage Denim Jacket with Embroidered Details",
    price: 2500,
    originalPrice: 4000,
    brand: "Vintage Collection",
    size: "M",
    condition: "Excellent",
    images: [
      "https://i.pinimg.com/1200x/c5/e4/0f/c5e40f10ee42695a6754e2511192f0e2.jpg",
    ],
    seller: "Sarah K.",
    location: "Kathmandu",
  },
  {
    id: "2",
    title: "Handwoven Cotton Kurta Set",
    price: 1800,
    originalPrice: 3200,
    brand: "Local Artisan",
    size: "L",
    condition: "Good",
    images: [
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    seller: "Rani T.",
    location: "Pokhara",
  },
  {
    id: "3",
    title: "Designer Wool Coat - Winter Collection",
    price: 4500,
    originalPrice: 8000,
    brand: "Winter Essentials",
    size: "S",
    condition: "Excellent",
    images: [
      "https://i.pinimg.com/736x/89/59/2d/89592db9afe519ba2a7325f248d34445.jpg",
    ],
    seller: "Maya S.",
    location: "Lalitpur",
  },
  {
    id: "4",
    title: "Casual Summer Dress with Floral Print",
    price: 1200,
    originalPrice: 2000,
    brand: "Summer Vibes",
    size: "M",
    condition: "Good",
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    seller: "Priya L.",
    location: "Bhaktapur",
  },
  {
    id: "5",
    title: "Handmade Woolen Shawl",
    price: 1500,
    originalPrice: 2500,
    brand: "Himalayan Weaves",
    size: "Free",
    condition: "Excellent",
    images: [
      "https://images.unsplash.com/photo-1586351012965-861624544334?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    ],
    seller: "Kiran D.",
    location: "Patan",
  },
  {
    id: "6",
    title: "Trendy Crop Top",
    price: 800,
    originalPrice: 1500,
    brand: "Street Wear",
    size: "S",
    condition: "Good",
    images: [
      "https://i.pinimg.com/736x/57/01/b7/5701b7785d7fff222259c43862842642.jpg",
    ],
    seller: "Anita G.",
    location: "Kathmandu",
  },
];

export const Checkout = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Form setup with react-hook-form
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm<FormData>({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      payment: "cod",
      bankAccount: "",
      bankName: "",
    },
    mode: "onChange",
  });

  const paymentMethod = watch("payment");

  // Redirect to eSewa device activation when eSewa is selected
  // useEffect(() => {
  //   if (paymentMethod === "esewa") {
  //     window.location.href = "https://esewa.com.np/#/activate/device";
  //   }
  // }, [paymentMethod]);

  // Load cart from localStorage
  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cartItems") || "[]");
    const initializedCart = storedCart.map((id: string) => ({
      id,
      quantity: 1,
    }));
    setCartItems(initializedCart);
  }, []);

  // Authentication check
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/signin", { state: { from: "/checkout" } });
    }
  }, [navigate]);

  // Mock authentication check
  const isAuthenticated = () => {
    return !!localStorage.getItem("authToken");
  };

  const getProductById = (id: string) => mockProducts.find((p) => p.id === id);

  const subtotal = cartItems.reduce((sum, item) => {
    const product = getProductById(item.id);
    return product ? sum + product.price * item.quantity : sum;
  }, 0);

  const taxes = subtotal * 0.13;
  const shipping = 200;
  const total = subtotal + taxes + shipping;

  const simulateEsewaPayment = async (data: FormData) => {
    // Simulate eSewa API call with QR code scan behavior
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate for simulation
          console.log("Processing eSewa payment for", data.email);
          alert("QR code scanned for eSewa payment... Payment successful!");
          resolve({ success: true, transactionId: `ESW-${Math.random().toString(36).substr(2, 9)}` });
        } else {
          reject(new Error("eSewa payment failed"));
        }
      }, 1500);
    });
  };

  const simulateBankPayment = async (data: FormData) => {
    // Simulate bank transfer verification
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1 && data.bankAccount && data.bankName) { // 90% success rate for simulation
          console.log("Processing bank transfer for", data.bankAccount, data.bankName);
          resolve({ success: true, transactionId: `BNK-${Math.random().toString(36).substr(2, 9)}` });
        } else {
          reject(new Error("Bank payment failed"));
        }
      }, 1500);
    });
  };

  const simulateCOD = async (data: FormData) => {
    // Simulate COD order confirmation
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("Processing COD for", data.email);
        resolve({ success: true, transactionId: `COD-${Math.random().toString(36).substr(2, 9)}` });
      }, 1000);
    });
  };

  const onSubmit = async (data: FormData) => {
    // Check if this is the first checkout attempt
    const isFirstCheckout = !localStorage.getItem("hasCheckedOut");
    if (isFirstCheckout) {
      localStorage.setItem("hasCheckedOut", "true");
      navigate("/signup", { state: { from: "/checkout" } });
      return;
    }

    setIsSubmitting(true);
    try {
      let paymentResult;
      if (data.payment === "esewa") {
        paymentResult = await simulateEsewaPayment(data);
      } else if (data.payment === "bank") {
        paymentResult = await simulateBankPayment(data);
      } else {
        paymentResult = await simulateCOD(data);
      }
      // Save order to localStorage
      const order = { ...data, cartItems, total, paymentResult };
      localStorage.setItem("lastOrder", JSON.stringify(order));
      // Clear cart
      localStorage.setItem("cartItems", JSON.stringify([]));
      setCartItems([]);
      alert("🎉 Order placed successfully! You'll be redirected to the home page.");
      navigate("/");
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-thrift-cream">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex-grow">
          <Alert className="max-w-md mx-auto border-thrift-warm/20">
            <AlertDescription className="text-center">
              Your cart is empty.{' '}
              <a href="/shop" className="text-thrift-green hover:underline">
                Browse products
              </a>{' '}
              to start shopping.
            </AlertDescription>
          </Alert>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-thrift-cream">
      <Navbar />
      <section className="py-16 flex-grow">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-12 text-thrift-green">
            Checkout
          </h1>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Checkout Form */}
            <Card className="lg:col-span-2 border-none shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-thrift-green">Shipping & Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-thrift-green">Full Name</Label>
                    <Input
                      id="name"
                      {...register("name", { required: "Name is required" })}
                      className={errors.name ? "border-thrift-warm" : ""}
                    />
                    {errors.name && <p className="text-sm text-thrift-warm mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-thrift-green">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email", {
                        required: "Email is required",
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: "Invalid email address",
                        },
                      })}
                      className={errors.email ? "border-thrift-warm" : ""}
                    />
                    {errors.email && <p className="text-sm text-thrift-warm mt-1">{errors.email.message}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone" className="text-thrift-green">Phone</Label>
                    <Input
                      id="phone"
                      {...register("phone", {
                        required: "Phone is required",
                        pattern: {
                          value: /^\+?\d{10,15}$/,
                          message: "Invalid phone number",
                        },
                      })}
                      className={errors.phone ? "border-thrift-warm" : ""}
                    />
                    {errors.phone && <p className="text-sm text-thrift-warm mt-1">{errors.phone.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="city" className="text-thrift-green">City</Label>
                    <Input
                      id="city"
                      {...register("city", { required: "City is required" })}
                      className={errors.city ? "border-thrift-warm" : ""}
                    />
                    {errors.city && <p className="text-sm text-thrift-warm mt-1">{errors.city.message}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="address" className="text-thrift-green">Address</Label>
                  <Input
                    id="address"
                    {...register("address", { required: "Address is required" })}
                    className={errors.address ? "border-thrift-warm" : ""}
                  />
                  {errors.address && <p className="text-sm text-thrift-warm mt-1">{errors.address.message}</p>}
                </div>
                <div>
                  <Label className="text-thrift-green">Payment Method</Label>
                  <RadioGroup
                    defaultValue="cod"
                    onValueChange={(value) => setValue("payment", value as "cod" | "esewa" | "bank")}
                    className="flex gap-6 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod" className="text-foreground">Cash on Delivery</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="esewa" id="esewa" />
                      <Label htmlFor="esewa" className="text-foreground">eSewa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bank" id="bank" />
                      <Label htmlFor="bank" className="text-foreground">Bank Account</Label>
                    </div>
                  </RadioGroup>
                </div>
                {paymentMethod === "bank" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bankName" className="text-thrift-green">Bank Name</Label>
                        <Input
                          id="bankName"
                          {...register("bankName", {
                            required: paymentMethod === "bank" ? "Bank name is required" : false,
                          })}
                          className={errors.bankName ? "border-thrift-warm" : ""}
                        />
                        {errors.bankName && <p className="text-sm text-thrift-warm mt-1">{errors.bankName.message}</p>}
                      </div>
                      <div>
                        <Label htmlFor="bankAccount" className="text-thrift-green">Account Number</Label>
                        <Input
                          id="bankAccount"
                          {...register("bankAccount", {
                            required: paymentMethod === "bank" ? "Account number is required" : false,
                            pattern: {
                              value: /^\d{10,20}$/,
                              message: "Invalid account number",
                            },
                          })}
                          className={errors.bankAccount ? "border-thrift-warm" : ""}
                        />
                        {errors.bankAccount && <p className="text-sm text-thrift-warm mt-1">{errors.bankAccount.message}</p>}
                      </div>
                    </div>
                    <div>
                      <Label className="text-thrift-green">Scan QR Code for Bank Payment</Label>
                      <div className="mt-2">
                        <img
                          src="/images/bank.jpg"
                          alt="Bank QR Code"
                          className="w-32 h-32 mx-auto border border-thrift-warm/20"
                          onError={(e) => {
                            e.currentTarget.src = "/images/bank.jpg"; // Fallback to same local image
                          }}
                        />
                        <p className="text-sm text-muted-foreground mt-2 text-center">
                          Scan this QR code to make a payment to our bank account.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {paymentMethod === "esewa" && (
                  <div>
                    <Label className="text-thrift-green">Redirecting to eSewa</Label>
                    <div className="mt-2">
                      <img
                        src="/images/esewa.jpg"
                        alt="eSewa QR Code"
                        className="w-32 h-32 mx-auto border border-thrift-warm/20"
                        onError={(e) => {
                          e.currentTarget.src = "/images/esewa.jpg"; // Fallback to same local image
                        }}
                      />
                      <p className="text-sm text-muted-foreground mt-2 text-center">
                        You are being redirected to eSewa for device activation. Please complete the activation to proceed with payment.
                      </p>
                    </div>
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-thrift-green hover:bg-thrift-green/90 text-white text-lg py-6"
                  disabled={!isValid || isSubmitting || paymentMethod === "esewa"}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    "Place Order"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="border-none shadow-sm bg-thrift-cream">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-thrift-green">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => {
                  const product = getProductById(item.id);
                  if (!product) return null;
                  return (
                    <div key={item.id} className="flex justify-between text-sm border-b py-2">
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <p className="text-muted-foreground">× {item.quantity}</p>
                        <p className="text-xs text-gray-600">
                          {product.brand} | Size: {product.size} | {product.condition}
                        </p>
                      </div>
                      <p className="font-medium">NPR {(product.price * item.quantity).toLocaleString()}</p>
                    </div>
                  );
                })}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>NPR {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxes (13%)</span>
                    <span>NPR {taxes.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>NPR {shipping.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-thrift-green">NPR {total.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </div>
      </section>
      <Footer />
    </div>
  );
};