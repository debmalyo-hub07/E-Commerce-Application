import { Metadata } from "next";
import CheckoutClient from "./CheckoutClient";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/mongoose";
import Address from "@/models/Address";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const session = await auth();

  if (!session) {
    redirect("/login?callbackUrl=/checkout");
  }

  await connectDB();
  const addresses = await Address.find({ userId: session.user.id })
    .sort({ isDefault: -1 })
    .lean();

  const serialized = addresses.map((addr) => ({
    id: addr._id.toString(),
    label: addr.label,
    fullName: addr.fullName,
    phone: addr.phone,
    addressLine1: addr.addressLine1,
    addressLine2: addr.addressLine2,
    city: addr.city,
    state: addr.state,
    pincode: addr.pincode,
    country: addr.country,
    isDefault: addr.isDefault,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-black mb-10 tracking-tight">Secure Checkout</h1>
      <CheckoutClient initialAddresses={serialized} />
    </div>
  );
}
