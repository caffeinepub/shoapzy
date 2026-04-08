import type { Principal } from "@icp-sdk/core/principal";
import { ExternalBlob } from "../backend";

export { ExternalBlob };

// User role enum equivalent
export const UserRole = {
  admin: "admin",
  seller: "seller",
  buyer: "buyer",
} as const;
export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export interface UserProfile {
  name: string;
  shopName?: string;
  shopDescription?: string;
  role: string;
  sellerApproved: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: bigint;
  mrp: bigint;
  discountPercent: bigint;
  category: string;
  stock: bigint;
  isActive: boolean;
  seller: Principal;
  image: ExternalBlob;
  variants?: ProductVariant[];
}

export interface CartItem {
  productId: string;
  seller: Principal;
  quantity: bigint;
  price: bigint;
}

export const OrderStatus = {
  pending: { pending: null },
  approved: { approved: null },
  shipped: { shipped: null },
  delivered: { delivered: null },
  cancelled: { cancelled: null },
  return_requested: { return_requested: null },
  return_approved: { return_approved: null },
  return_rejected: { return_rejected: null },
} as const;
export type OrderStatusType = (typeof OrderStatus)[keyof typeof OrderStatus];
// biome-ignore lint/suspicious/noExplicitAny: variant object
export type OrderStatus = any;

export interface ShoppingItem {
  productName: string;
  currency: string;
  quantity: bigint;
  priceInCents: bigint;
  productDescription: string;
}

export const Variant_cod_online = {
  online: { online: null },
  cod: { cod: null },
} as const;

export interface Order {
  id: string;
  buyer: Principal;
  items: CartItem[];
  totalAmount: bigint;
  paymentMethod: { online: null } | { cod: null };
  status: OrderStatus;
  timestamp: bigint;
  deliveryAddress?: string;
}

export interface SellerRegistration {
  principal: Principal;
  shopName: string;
  shopDescription?: string;
}

export interface Review {
  id: bigint;
  productId: string;
  buyerId: Principal;
  buyerName: string;
  rating: bigint;
  reviewText: string;
  timestamp: bigint;
}

export interface ReviewSummary {
  productId: string;
  averageRating: number;
  reviewCount: bigint;
}

export type ReturnRequestStatus = "pending" | "approved" | "rejected";

export interface ReturnRequest {
  id: string;
  orderId: string;
  buyerId: string;
  reason: string;
  status: ReturnRequestStatus;
  timestamp: bigint;
  adminComment: string | null;
}

export interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  stock: bigint;
  price: number | null;
}

// Batch 5 types

export type SavedAddressLabel = "home" | "office" | "other";

export interface SavedAddress {
  id: string;
  label: SavedAddressLabel;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ReferralStats {
  referralCode: string;
  totalReferrals: bigint;
  successfulReferrals: bigint;
  bonusPointsEarned: bigint;
}
