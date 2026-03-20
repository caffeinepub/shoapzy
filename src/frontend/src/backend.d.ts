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
export interface UserProfile {
    shopDescription?: string;
    name: string;
    role: string;
    sellerApproved: boolean;
    shopName?: string;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface Order {
    id: string;
    status: OrderStatus;
    paymentMethod: Variant_cod_online;
    totalAmount: bigint;
    timestamp: bigint;
    buyer: Principal;
    items: Array<CartItem>;
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
export interface Product {
    id: string;
    title: string;
    description: string;
    seller: Principal;
    isActive: boolean;
    stock: bigint;
    category: string;
    image: ExternalBlob;
    price: bigint;
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
    delivered = "delivered"
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
    addToCart(item: CartItem): Promise<void>;
    approveSeller(seller: Principal): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    claimAdminRole(): Promise<void>;
    clearCallerCart(): Promise<void>;
    clearCart(): Promise<void>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    deleteProduct(productId: string): Promise<void>;
    getAllOrders(): Promise<Array<Order>>;
    getCallerCart(): Promise<Array<CartItem> | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getOrderCommissionBreakdown(orderId: string): Promise<{
        adminCommission: bigint;
        sellerPayments: Array<[Principal, bigint]>;
    } | null>;
    getPendingSellerRegistrations(): Promise<Array<Principal>>;
    getPlatformEarnings(): Promise<bigint>;
    getProducts(): Promise<Array<Product>>;
    getSellerOrders(seller: Principal): Promise<Array<Order>>;
    getSellerProducts(seller: Principal): Promise<Array<Product>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getUserOrders(user: Principal): Promise<Array<Order>>;
    getUserProducts(user: Principal): Promise<Array<Product>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isCallerSellerApproved(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    placeOrder(order: Order): Promise<void>;
    registerAsSeller(shopName: string, shopDescription: string | null): Promise<void>;
    rejectSeller(seller: Principal): Promise<void>;
    requestApproval(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateOrderStatus(orderId: string, status: OrderStatus): Promise<void>;
    updateProduct(product: Product): Promise<void>;
}
