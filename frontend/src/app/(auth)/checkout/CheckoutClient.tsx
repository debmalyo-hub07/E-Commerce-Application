"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/useCart";
import { Check, Loader2, MapPin, Plus, ShieldCheck } from "lucide-react";
import { toast } from "react-hot-toast";

interface AddressData {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

interface CheckoutClientProps {
  initialAddresses: AddressData[];
  userEmail: string;
  userName: string;
}

export function CheckoutClient({ initialAddresses, userEmail, userName }: CheckoutClientProps) {
  const router = useRouter();
  const { items, clearCart, subtotal, gstAmount, shipping, total } = useCart();
  const totals = { subtotal, totalGst: gstAmount, shipping, finalTotal: total };
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    initialAddresses.length > 0 ? initialAddresses[0].id : null
  );
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "UPI" | "COD">("UPI");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (items.length === 0 && !isProcessing) {
      router.push("/products");
    }
  }, [items.length, isProcessing, router]);

  const loadRazorpay = () => {
    return new Promise((resolve) => {
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

    try {
      const createOrderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address_id: selectedAddressId,
          payment_method: paymentMethod,
          cart_items: items,
        }),
      });

      const orderData = await createOrderRes.json();

      if (!createOrderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      if (paymentMethod === "COD") {
        clearCart();
        toast.success("Order placed successfully with Cash on Delivery!");
        router.push(`/account/orders/${orderData.order_id}`);
        return;
      }

      const isLoaded = await loadRazorpay();
      if (!isLoaded) {
        throw new Error("Razorpay SDK failed to load. Are you online?");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "StyleMart",
        description: `Order #${orderData.order_number}`,
        order_id: orderData.razorpay_order_id,
        handler: async function (response: Record<string, string>) {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          if (verifyRes.ok) {
            clearCart();
            toast.success("Payment successful! Order confirmed.");
            router.push(`/account/orders/${orderData.order_id}`);
          } else {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: "#4f46e5",
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            toast.error("Payment cancelled.");
          },
        },
      };

      const rzp = new (window as unknown as Record<string, unknown> & { Razorpay: new (opts: unknown) => { open: () => void; on: (event: string, cb: (response: unknown) => void) => void } }).Razorpay(options);
      rzp.on('payment.failed', function () {
        setIsProcessing(false);
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();

    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
      setIsProcessing(false);
    }
  };

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Checkout Forms */}
      <div className="lg:col-span-2 space-y-8">

        {/* Step 1: Address */}
        <section className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
              Delivery Address
            </h2>
            <button className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add New
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {initialAddresses.length === 0 ? (
              <p className="col-span-2 text-sm text-muted-foreground p-4 bg-muted/50 rounded-xl">No saved addresses found. Please add an address to continue.</p>
            ) : initialAddresses.map((addr) => (
              <div
                key={addr.id}
                onClick={() => setSelectedAddressId(addr.id)}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedAddressId === addr.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                }`}
              >
                {selectedAddressId === addr.id && (
                  <div className="absolute top-4 right-4 text-primary">
                    <Check className="w-5 h-5" />
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-sm">{addr.label}</span>
                </div>
                <p className="font-semibold text-sm">{addr.fullName}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br/>
                  {addr.city}, {addr.state} {addr.pincode}
                </p>
                <p className="text-xs text-muted-foreground mt-1 text-primary">Ph: {addr.phone}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Step 2: Payment Method */}
        <section className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
            Payment Method
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-border p-1 rounded-xl bg-muted/30">
            {[
              { id: "UPI", label: "UPI" },
              { id: "CARD", label: "Credit/Debit Card" },
              { id: "COD", label: "Cash on Delivery" },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as "CARD" | "UPI" | "COD")}
                className={`flex items-center justify-center py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                  paymentMethod === method.id
                    ? "bg-background border border-border shadow-sm text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {method.label}
              </button>
            ))}
          </div>
        </section>

      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm sticky top-24">
          <h2 className="text-lg font-bold mb-4 border-b border-border pb-4">Order Summary</h2>

          <div className="flex justify-between text-sm mb-4">
            <span className="text-muted-foreground">Items ({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
          </div>

          <div className="flex justify-between text-sm mb-4">
            <span className="text-muted-foreground">GST (Included)</span>
            <span className="font-medium">{formatCurrency(totals.totalGst)}</span>
          </div>

          {totals.shipping > 0 ? (
            <div className="flex justify-between text-sm mb-4">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium">{formatCurrency(totals.shipping)}</span>
            </div>
          ) : (
            <div className="flex justify-between text-sm mb-4">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-medium text-green-500">FREE</span>
            </div>
          )}

          <div className="border-t border-border pt-4 mb-6 flex justify-between">
            <span className="text-base font-bold">Total Pay</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(totals.finalTotal)}
            </span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={isProcessing || !selectedAddressId}
            className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 mr-2" />
                {paymentMethod === "COD" ? "Place Order" : `Pay ${formatCurrency(totals.finalTotal)}`}
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-muted-foreground mt-4 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Secure encrypted checkout powered by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
}
