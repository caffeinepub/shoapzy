import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Product {
    id: string;
    mrp: bigint;
    title: string;
    description: string;
    discountPercent: bigint;
    seller: Principal;
    isActive: boolean;
    stock: bigint;
    category: string;
    image: ExternalBlob;
    price: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface SellerRegistration {
    principal: Principal;
    shopDescription?: string;
    shopName: string;
}
export interface SellerInfo {
    status: string;
    principal: Principal;
    shopDescription?: string;
    shopName: string;
}
export interface ReturnRequest {
    id: string;
    status: ReturnStatus;
    orderId: string;
    adminComment?: string;
    buyerId: Principal;
    timestamp: bigint;
    reason: string;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface ReviewSummary {
    productId: string;
    averageRating: number;
    reviewCount: bigint;
}
export interface Order {
    id: string;
    status: OrderStatus;
    deliveryAddress?: string;
    paymentMethod: Variant_cod_online;
    totalAmount: bigint;
    timestamp: bigint;
    buyer: Principal;
    items: Array<CartItem>;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface CartItem {
    productId: string;
    seller: Principal;
    quantity: bigint;
    price: bigint;
}
export interface UserProfile {
    shopDescription?: string;
    name: string;
    role: string;
    sellerApproved: boolean;
    shopName?: string;
}
export interface Review {
    id: bigint;
    reviewText: string;
    productId: string;
    buyerId: Principal;
    timestamp: bigint;
    rating: bigint;
    buyerName: string;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum OrderStatus {
    shipped = "shipped",
    cancelled = "cancelled",
    pending = "pending",
    paid = "paid",
    approved = "approved",
    return_requested = "return_requested",
    return_approved = "return_approved",
    delivered = "delivered",
    return_rejected = "return_rejected"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_cod_online {
    cod = "cod",
    online = "online"
}
export interface backendInterface {
    addProduct(product: Product): Promise<void>;
    addReview(productId: string, rating: bigint, reviewText: string): Promise<{
        __kind__: "ok";
        ok: string;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addToCart(item: CartItem): Promise<void>;
    addToWishlist(productId: string): Promise<boolean>;
    approveReturn(requestId: string, adminComment: string | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    approveSeller(seller: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimAdminRole(): Promise<void>;
    clearCallerCart(): Promise<void>;
    clearCart(): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteProduct(productId: string): Promise<void>;
    getAllOrders(): Promise<Array<Order>>;
    getAllReturnRequests(): Promise<Array<ReturnRequest>>;
    getAllSellers(): Promise<Array<SellerInfo>>;
    getCallerCart(): Promise<Array<CartItem> | null>;
    getCallerSellerStatus(): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCallerWishlist(): Promise<Array<string>>;
    getMyReturnRequests(): Promise<Array<ReturnRequest>>;
    getOrderCommissionBreakdown(orderId: string): Promise<{
        adminCommission: bigint;
        sellerPayments: Array<[Principal, bigint]>;
    } | null>;
    getPendingSellerDetails(): Promise<Array<SellerRegistration>>;
    getPendingSellerRegistrations(): Promise<Array<Principal>>;
    getPlatformEarnings(): Promise<bigint>;
    getProductAverageRating(productId: string): Promise<number>;
    getProductReviews(productId: string): Promise<Array<Review>>;
    getProducts(): Promise<Array<Product>>;
    getReturnRequestByOrder(orderId: string): Promise<ReturnRequest | null>;
    getReviewSummaries(): Promise<Array<ReviewSummary>>;
    getSellerOrders(seller: Principal): Promise<Array<Order>>;
    getSellerProducts(seller: Principal): Promise<Array<Product>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserOrders(user: Principal): Promise<Array<Order>>;
    getUserProducts(user: Principal): Promise<Array<Product>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isCallerSellerApproved(): Promise<boolean>;
    isInWishlist(productId: string): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    placeOrder(order: Order): Promise<void>;
    registerAsSeller(shopName: string, shopDescription: string | null): Promise<void>;
    rejectReturn(requestId: string, adminComment: string | null): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    rejectSeller(seller: Principal): Promise<void>;
    removeFromWishlist(productId: string): Promise<boolean>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    submitReturnRequest(orderId: string, reason: string): Promise<{
        __kind__: "ok";
        ok: ReturnRequest;
    } | {
        __kind__: "err";
        err: string;
    }>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
    updateProduct(product: Product): Promise<void>;
    updateSellerOrderStatus(orderId: string, newStatus: OrderStatus): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
}
