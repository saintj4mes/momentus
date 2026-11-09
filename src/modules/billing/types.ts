export type SubscriptionPlanId =
  | "starter"
  | "bespoke"
  | "grand"
  | "agency_pro"
  | "enterprise";

export type BillingInterval = "one_time" | "month" | "year";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  category: "event_pass" | "agency_subscription";
  tagline: string;
  price: number;
  currency: string;
  interval: BillingInterval;
  guestLimit: number;
  eventLimit: number;
  turnstileLimit: number;
  customDomainAllowed: boolean;
  whiteLabel: boolean;
  hardwareCardsIncluded: number;
  features: string[];
  popularBadge?: string;
}

export interface NfcHardwareProduct {
  id: string;
  name: string;
  material: "wood" | "metal" | "acrylic" | "wristband" | "reader";
  price: number;
  currency: string;
  quantity: number;
  description: string;
  imageSrc: string;
}

export interface ShippingAddress {
  recipientName: string;
  street: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface OrganizationBillingState {
  organizationId: string;
  currentPlanId: SubscriptionPlanId;
  subscriptionStatus: SubscriptionStatus;
  currentPeriodEnd: string;
  activeEventsCount: number;
  eventLimit: number;
  monthlyGuestsCount: number;
  guestLimit: number;
  storageUsedMb: number;
  storageLimitMb: number;
  customDomainCount: number;
  purchasedEventPasses: Array<{
    id: string;
    eventId?: string;
    planId: SubscriptionPlanId;
    purchasedAt: string;
    amount: number;
    currency: string;
  }>;
  hardwareOrders: Array<{
    id: string;
    productId: string;
    quantity: number;
    totalAmount: number;
    currency: string;
    status: "processing" | "shipped" | "delivered";
    orderedAt: string;
    trackingNumber?: string;
  }>;
}

export interface CheckoutResult {
  ok: boolean;
  orderId?: string;
  checkoutUrl?: string;
  message?: string;
  error?: string;
}

