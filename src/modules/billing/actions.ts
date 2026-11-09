"use server";

import { revalidatePath } from "next/cache";
import { nfcHardwareProducts, subscriptionPlans } from "./plans";
import type {
  CheckoutResult,
  OrganizationBillingState,
  ShippingAddress,
  SubscriptionPlanId,
} from "./types";

// In-memory / storage fallback for local and synthetic development
const simulatedBillingStore = new Map<string, OrganizationBillingState>();

function getOrCreateDefaultBilling(orgId: string): OrganizationBillingState {
  const existing = simulatedBillingStore.get(orgId);
  if (existing) return existing;

  const initial: OrganizationBillingState = {
    organizationId: orgId,
    currentPlanId: "starter",
    subscriptionStatus: "active",
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    activeEventsCount: 2,
    eventLimit: 1,
    monthlyGuestsCount: 235,
    guestLimit: 50,
    storageUsedMb: 1420,
    storageLimitMb: 5000,
    customDomainCount: 1,
    purchasedEventPasses: [
      {
        id: "pass-01",
        eventId: "demo-amara-luca",
        planId: "bespoke",
        purchasedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        amount: 189,
        currency: "USD",
      },
    ],
    hardwareOrders: [
      {
        id: "ord-8291",
        productId: "wood_cards_50",
        quantity: 1,
        totalAmount: 120,
        currency: "USD",
        status: "delivered",
        orderedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        trackingNumber: "PH-NFC-8291-EXP",
      },
    ],
  };

  simulatedBillingStore.set(orgId, initial);
  return initial;
}

export async function getOrganizationBillingState(
  organizationId: string = "default-org",
): Promise<OrganizationBillingState> {
  return getOrCreateDefaultBilling(organizationId);
}

export async function createCheckoutSession(input: {
  planId: SubscriptionPlanId;
  organizationId: string;
  paymentMethod?: "stripe" | "paymongo" | "simulated";
}): Promise<CheckoutResult> {
  const plan = subscriptionPlans.find((p) => p.id === input.planId);
  if (!plan) {
    return { ok: false, error: "Selected subscription plan does not exist." };
  }

  // Update billing state
  const state = getOrCreateDefaultBilling(input.organizationId);
  state.currentPlanId = input.planId;
  state.eventLimit = plan.eventLimit;
  state.guestLimit = plan.guestLimit;
  state.subscriptionStatus = "active";
  state.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (plan.category === "event_pass") {
    state.purchasedEventPasses.unshift({
      id: `pass-${Date.now().toString(36)}`,
      planId: input.planId,
      purchasedAt: new Date().toISOString(),
      amount: plan.price,
      currency: plan.currency,
    });
  }

  simulatedBillingStore.set(input.organizationId, state);
  revalidatePath("/admin/billing");
  revalidatePath("/organizer/billing");

  return {
    ok: true,
    orderId: `ch_${Date.now().toString(36)}`,
    checkoutUrl: `/organizer/billing?success=true&plan=${encodeURIComponent(plan.name)}`,
    message: `Successfully activated ${plan.name} via ${input.paymentMethod || "standard checkout"}.`,
  };
}

export async function orderHardwarePackage(input: {
  productId: string;
  quantity: number;
  shippingAddress: ShippingAddress;
  organizationId: string;
}): Promise<CheckoutResult> {
  const product = nfcHardwareProducts.find((p) => p.id === input.productId);
  if (!product) {
    return { ok: false, error: "Selected NFC hardware package not found." };
  }

  if (input.quantity < 1 || input.quantity > 100) {
    return { ok: false, error: "Order quantity must be between 1 and 100 packs." };
  }

  if (!input.shippingAddress.recipientName || !input.shippingAddress.street) {
    return { ok: false, error: "Please provide a complete shipping address." };
  }

  const state = getOrCreateDefaultBilling(input.organizationId);
  const totalAmount = product.price * input.quantity;
  const orderId = `ord-${Date.now().toString(36).toUpperCase()}`;

  state.hardwareOrders.unshift({
    id: orderId,
    productId: product.id,
    quantity: input.quantity,
    totalAmount,
    currency: product.currency,
    status: "processing",
    orderedAt: new Date().toISOString(),
    trackingNumber: `PH-TRACK-${Math.floor(100000 + Math.random() * 900000)}`,
  });

  simulatedBillingStore.set(input.organizationId, state);
  revalidatePath("/admin/billing");
  revalidatePath("/organizer/billing");

  return {
    ok: true,
    orderId,
    message: `Hardware order placed for ${input.quantity}x ${product.name}. Tracking will be sent to your contact email.`,
  };
}

export async function cancelSubscription(
  organizationId: string,
): Promise<{ ok: boolean; message: string }> {
  const state = getOrCreateDefaultBilling(organizationId);
  state.subscriptionStatus = "canceled";
  simulatedBillingStore.set(organizationId, state);

  revalidatePath("/admin/billing");
  revalidatePath("/organizer/billing");

  return {
    ok: true,
    message: "Your subscription has been canceled. Access remains active until the end of the billing period.",
  };
}
