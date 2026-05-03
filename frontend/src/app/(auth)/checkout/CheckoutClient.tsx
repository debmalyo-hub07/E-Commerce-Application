"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "@/hooks/useCart";
import { formatCurrency } from "@nexmart/shared/utils";
import { 
  Check, 
  MapPin, 
  CreditCard, 
  ChevronRight, 
  Plus, 
  ShoppingCart,
  ShieldCheck,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface Address {
  id: string;
  label: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

interface CheckoutClientProps {
  initialAddresses: Address[];
}

export default function CheckoutClient({ initialAddresses }: CheckoutClientProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, clearCart, subtotal, gstAmount, shipping, total } = useCart();
  
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    initialAddresses.find(a => a.label === "Home")?.id || initialAddresses[0]?.id || ""
  );
  const [paymentMethod, setPaymentMethod] = useState<"RAZORPAY" | "COD">("RAZORPAY");
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState("");

  // Redirect if cart is empty and NOT currently processing a payment
  useEffect(() => {
    if (items.length === 0 && !isProcessing) {
      const timer = setTimeout(() => {
        if (items.length === 0 && !isProcessing) {
          router.push("/products");
        }
      }, 1500); // Small grace period for hydration
      return () => clearTimeout(timer);
    }
  }, [items.length, isProcessing, router]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      toast.error("Please select a delivery address.");
      return;
    }

    setIsProcessing(true);
    const loadingToast = toast.loading("Preparing your order...");

    try {
      const createOrderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod,
          couponCode: couponCode || undefined,
          items: items.map(item => ({
            productId: item.product.id,
            variantId: item.variant?.id,
            quantity: item.quantity,
          })),
        }),
      });

      const responseData = await createOrderRes.json();

      if (!createOrderRes.ok) {
        throw new Error(responseData.error || "Failed to create order");
      }

      const orderData = responseData.data;

      if (paymentMethod === "COD") {
        toast.success("Order placed successfully!", { id: loadingToast });
        clearCart();
        router.push(`/account/orders/${orderData.orderId}`);
      } else {
        // Ensure Razorpay script is loaded
        const isScriptLoaded = await loadRazorpayScript();
        if (!isScriptLoaded) {
          throw new Error("Razorpay SDK failed to load. Please check your connection.");
        }

        // Razorpay flow
        const options = {
          key: orderData.keyId,
          name: "NexMart",
          description: `Order #${orderData.orderNumber}`,
          order_id: orderData.razorpayOrderId,
          handler: async function (response: any) {
            toast.loading("Verifying payment...", { id: loadingToast });
            try {
              const verifyRes = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              });

              if (verifyRes.ok) {
                toast.success("Payment successful!", { id: loadingToast });
                clearCart();
                router.push(`/account/orders/${orderData.orderId}`);
              } else {
                const err = await verifyRes.json();
                throw new Error(err.error || "Verification failed");
              }
            } catch (err: any) {
              toast.error(err.message, { id: loadingToast });
              setIsProcessing(false);
            }
          },
          prefill: {
            name: session?.user?.name,
            email: session?.user?.email,
          },
          theme: { color: "#4f46e5" },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              toast.dismiss(loadingToast);
              toast.error("Payment cancelled.");
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          toast.error(resp.error.description || "Payment failed", { id: loadingToast });
          setIsProcessing(false);
        });
        rzp.open();
      }
    } catch (error: any) {
      toast.error(error.message, { id: loadingToast });
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isProcessing) return null;

  return (
    <>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Forms */}
        <div className="lg:col-span-2 space-y-8">

          {/* Step 1: Address */}
          <section className="bg-card border border-border p-8 rounded-3xl shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                Delivery Address
              </h2>
              <button 
                onClick={() => router.push("/account/addresses/new")}
                className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add New
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {initialAddresses.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center p-12 bg-muted/30 rounded-3xl border-2 border-dashed border-border">
                  <MapPin className="w-10 h-10 text-muted-foreground mb-4" />
                  <p className="text-sm font-bold text-muted-foreground">No saved addresses found.</p>
                  <button onClick={() => router.push("/account/addresses/new")} className="mt-4 text-primary font-bold hover:underline">Click here to add one</button>
                </div>
              ) : initialAddresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedAddressId === addr.id ? "border-primary bg-primary/5 shadow-md scale-[1.02]" : "border-border hover:border-primary/30"
                  }`}
                >
                  {selectedAddressId === addr.id && (
                    <div className="absolute top-4 right-4 text-primary">
                      <Check className="w-5 h-5" />
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground px-2 py-0.5 bg-muted rounded-md">{addr.label}</span>
                  </div>
                  <p className="font-black text-base">{addr.fullName}</p>
                  <p className="text-sm text-muted-foreground mt-2 font-medium leading-relaxed">
                    {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br/>
                    {addr.city}, {addr.state} {addr.pincode}
                  </p>
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-2 text-xs font-bold text-primary">
                    <ShieldCheck className="w-3.5 h-3.5" /> Contact: {addr.phone}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Step 2: Payment Method */}
          <section className="bg-card border border-border p-8 rounded-3xl shadow-sm">
            <h2 className="text-2xl font-black flex items-center gap-3 mb-6">
              <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
              Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1.5 rounded-2xl bg-muted/40 border border-border">
              {[
                { id: "RAZORPAY", label: "Pay Online", icon: CreditCard, sub: "UPI, Cards, Netbanking" },
                { id: "COD", label: "Cash on Delivery", icon: ShoppingCart, sub: "Pay when you receive" },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as "RAZORPAY" | "COD")}
                  className={`flex items-start gap-4 p-4 rounded-xl text-left transition-all ${
                    paymentMethod === method.id
                      ? "bg-background border border-border shadow-md text-foreground scale-[1.01]"
                      : "text-muted-foreground hover:bg-background/50"
                  }`}
                >
                  <div className={`p-2.5 rounded-lg ${paymentMethod === method.id ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                    <method.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{method.label}</p>
                    <p className="text-[11px] font-medium opacity-70 mt-0.5">{method.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card border-2 border-primary/10 p-8 rounded-3xl shadow-xl sticky top-24 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            
            <h2 className="text-xl font-black mb-8 border-b border-border pb-6 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-primary" /> Summary
            </h2>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                <span className="text-foreground">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">GST (Included)</span>
                <span className="text-foreground">{formatCurrency(gstAmount)}</span>
              </div>

              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Shipping</span>
                {shipping === 0 ? (
                  <span className="text-green-500 font-bold uppercase tracking-tight">Free</span>
                ) : (
                  <span className="text-foreground">{formatCurrency(shipping)}</span>
                )}
              </div>
            </div>

            <div className="pt-6 border-t-2 border-border border-dashed space-y-6">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground mb-1">Total Amount</p>
                  <p className="text-3xl font-black text-primary">{formatCurrency(total)}</p>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isProcessing || items.length === 0}
                className="w-full py-7 text-lg font-black rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98]"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {paymentMethod === "COD" ? "Place Order" : "Pay Securely"} <ChevronRight className="w-5 h-5" />
                  </div>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3" /> Secure Payment via Razorpay
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
