"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { createCheckoutSession, orderHardwarePackage } from "../actions";
import { nfcHardwareProducts, subscriptionPlans } from "../plans";
import type {
  OrganizationBillingState,
  ShippingAddress,
  SubscriptionPlanId,
} from "../types";

interface Props {
  initialBilling: OrganizationBillingState;
  organizationName?: string;
  isPlatformAdmin?: boolean;
}

export function BillingOverview({
  initialBilling,
  organizationName = "MOMENTUS Studio",
  isPlatformAdmin = false,
}: Props) {
  const [billing, setBilling] = useState<OrganizationBillingState>(initialBilling);
  const [activeCategory, setActiveCategory] = useState<"event_pass" | "agency_subscription">("event_pass");
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlanId | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<"stripe" | "paymongo" | "simulated">("simulated");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Hardware order state
  const [selectedHardwareId, setSelectedHardwareId] = useState<string>("wood_cards_50");
  const [hardwareQty, setHardwareQty] = useState<number>(1);
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    recipientName: "Amara Santos",
    street: "14B Plaza San Luis, General Luna St",
    city: "Intramuros, Manila",
    stateProvince: "Metro Manila",
    postalCode: "1002",
    country: "Philippines",
    phone: "+63 917 555 0192",
  });

  const currentPlan =
    subscriptionPlans.find((p) => p.id === billing.currentPlanId) ??
    subscriptionPlans[0];

  const filteredPlans = subscriptionPlans.filter(
    (p) => p.category === activeCategory,
  );

  const selectedHardware =
    nfcHardwareProducts.find((p) => p.id === selectedHardwareId) ??
    nfcHardwareProducts[0];

  const handleCheckout = (planId: SubscriptionPlanId) => {
    setStatusMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      const res = await createCheckoutSession({
        planId,
        organizationId: billing.organizationId,
        paymentMethod: paymentProvider,
      });

      if (res.ok) {
        setStatusMessage(res.message || "Plan updated successfully!");
        setBilling((prev) => ({
          ...prev,
          currentPlanId: planId,
          eventLimit: subscriptionPlans.find((p) => p.id === planId)?.eventLimit ?? prev.eventLimit,
          guestLimit: subscriptionPlans.find((p) => p.id === planId)?.guestLimit ?? prev.guestLimit,
        }));
        setSelectedPlanForCheckout(null);
      } else {
        setErrorMessage(res.error || "Could not process checkout.");
      }
    });
  };

  const handleOrderHardware = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      const res = await orderHardwarePackage({
        productId: selectedHardwareId,
        quantity: hardwareQty,
        shippingAddress,
        organizationId: billing.organizationId,
      });

      if (res.ok) {
        setStatusMessage(res.message || "Hardware order confirmed!");
      } else {
        setErrorMessage(res.error || "Failed to submit hardware order.");
      }
    });
  };

  return (
    <div className="billing-saas-container">
      {/* Page Header */}
      <div className="billing-header-bar">
        <div>
          <div className="vintage-eyebrow">
            <span className="eyebrow-rule" aria-hidden="true" />
            <span className="eyebrow-pill">COMMERCIAL &amp; SUBSCRIPTION CONSOLE</span>
            <span className="eyebrow-rule" aria-hidden="true" />
          </div>
          <h1 className="billing-title">
            Plans &amp; Hardware Fulfillment
          </h1>
          <p className="billing-subtitle">
            Manage your organization tier, event licensing, and physical NFC card keepsake orders for{" "}
            <strong>{organizationName}</strong>.
          </p>
        </div>

        <div className="current-tier-pill">
          <span className="tier-tag">CURRENT PLAN</span>
          <strong className="tier-name">{currentPlan.name}</strong>
          <span className="tier-status">● {billing.subscriptionStatus.toUpperCase()}</span>
        </div>
      </div>

      {statusMessage && (
        <div className="billing-alert success" role="alert">
          <span className="alert-icon">✓</span>
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="billing-alert error" role="alert">
          <span className="alert-icon">✕</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Quota & Usage Overview Grid */}
      <section className="billing-usage-grid" aria-labelledby="usage-metrics-title">
        <h2 id="usage-metrics-title" className="sr-only">Account Usage &amp; Limits</h2>

        <div className="usage-card">
          <div className="usage-card-top">
            <span className="usage-kicker">ACTIVE EVENTS</span>
            <span className="usage-count">{billing.activeEventsCount} / {billing.eventLimit}</span>
          </div>
          <div className="usage-bar-track">
            <div
              className="usage-bar-fill"
              style={{
                width: `${Math.min(100, (billing.activeEventsCount / Math.max(1, billing.eventLimit)) * 100)}%`,
              }}
            />
          </div>
          <span className="usage-caption">
            {billing.activeEventsCount >= billing.eventLimit
              ? "Plan limit reached. Upgrade for more concurrent events."
              : `${billing.eventLimit - billing.activeEventsCount} event slots available.`}
          </span>
        </div>

        <div className="usage-card">
          <div className="usage-card-top">
            <span className="usage-kicker">ATTENDEE CAPACITY</span>
            <span className="usage-count">{billing.monthlyGuestsCount} / {billing.guestLimit}</span>
          </div>
          <div className="usage-bar-track">
            <div
              className="usage-bar-fill"
              style={{
                width: `${Math.min(100, (billing.monthlyGuestsCount / Math.max(1, billing.guestLimit)) * 100)}%`,
              }}
            />
          </div>
          <span className="usage-caption">
            Atomic verification active across all invitations.
          </span>
        </div>

        <div className="usage-card">
          <div className="usage-card-top">
            <span className="usage-kicker">GALLERY STORAGE</span>
            <span className="usage-count">{(billing.storageUsedMb / 1024).toFixed(1)} GB / {(billing.storageLimitMb / 1024).toFixed(0)} GB</span>
          </div>
          <div className="usage-bar-track">
            <div
              className="usage-bar-fill"
              style={{
                width: `${Math.min(100, (billing.storageUsedMb / Math.max(1, billing.storageLimitMb)) * 100)}%`,
              }}
            />
          </div>
          <span className="usage-caption">
            12-Month full-resolution hosting with host export tools.
          </span>
        </div>

        <div className="usage-card">
          <div className="usage-card-top">
            <span className="usage-kicker">CUSTOM DOMAINS</span>
            <span className="usage-count">{billing.customDomainCount} Active</span>
          </div>
          <div className="usage-bar-track">
            <div className="usage-bar-fill" style={{ width: "100%" }} />
          </div>
          <span className="usage-caption">
            SSL auto-provisioned via Cloudflare for SaaS.
          </span>
        </div>
      </section>

      {/* Plan Selection Section */}
      <section className="billing-plans-section" aria-labelledby="available-plans-title">
        <div className="plans-nav-toolbar">
          <div className="category-toggle" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "event_pass"}
              className={`cat-toggle-btn ${activeCategory === "event_pass" ? "is-active" : ""}`}
              onClick={() => setActiveCategory("event_pass")}
            >
              🎟️ Per-Event Passes (One-Off)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "agency_subscription"}
              className={`cat-toggle-btn ${activeCategory === "agency_subscription" ? "is-active" : ""}`}
              onClick={() => setActiveCategory("agency_subscription")}
            >
              🏢 Agency Subscriptions (Monthly)
            </button>
          </div>

          {activeCategory === "agency_subscription" && (
            <div className="interval-toggle">
              <span className={!isAnnual ? "is-selected" : ""}>Monthly</span>
              <button
                type="button"
                className={`switch-track ${isAnnual ? "is-checked" : ""}`}
                onClick={() => setIsAnnual(!isAnnual)}
                aria-label="Toggle annual billing discount"
                style={{
                  position: "relative",
                  width: "48px",
                  height: "24px",
                  borderRadius: "12px",
                  backgroundColor: isAnnual ? "#238636" : "#484f58",
                  border: "none",
                  cursor: "pointer",
                  padding: "2px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <span
                  className="switch-thumb"
                  style={{
                    display: "block",
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    transform: isAnnual ? "translateX(24px)" : "translateX(0px)",
                    transition: "transform 0.2s ease",
                  }}
                />
              </button>
              <span className={isAnnual ? "is-selected" : ""}>
                Annual <span className="discount-tag">Save 20%</span>
              </span>
            </div>
          )}
        </div>

        {/* Pricing Cards Grid */}
        <div className="plans-cards-grid">
          {filteredPlans.map((plan) => {
            const isCurrent = billing.currentPlanId === plan.id;
            const priceDisplay =
              plan.price === 0
                ? "Free"
                : isAnnual && plan.interval === "month"
                  ? `$${Math.round(plan.price * 0.8 * 12)}/yr`
                  : `$${plan.price}${plan.interval === "month" ? "/mo" : ""}`;

            return (
              <div
                key={plan.id}
                className={`plan-card ${isCurrent ? "is-current-plan" : ""} ${plan.popularBadge ? "has-badge" : ""}`}
              >
                {plan.popularBadge && (
                  <span className="plan-popular-ribbon">{plan.popularBadge}</span>
                )}

                <div className="plan-card-header">
                  <h3 className="plan-name">{plan.name}</h3>
                  <p className="plan-tagline">{plan.tagline}</p>
                  <div className="plan-price-row">
                    <span className="plan-price-num">{priceDisplay}</span>
                    {plan.price > 0 && plan.interval === "one_time" && (
                      <span className="plan-price-period">per event</span>
                    )}
                  </div>
                </div>

                <div className="plan-card-body">
                  <ul className="plan-features-list">
                    {plan.features.map((feat) => (
                      <li key={feat} className="plan-feature-item">
                        <span className="feature-check" aria-hidden="true">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="plan-card-footer">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      data-testid={`plan-btn-${plan.id}`}
                      className="plan-cta-btn is-current"
                    >
                      Current Active Plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      data-testid={`plan-btn-${plan.id}`}
                      className="plan-cta-btn is-upgrade"
                      onClick={() => handleCheckout(plan.id)}
                    >
                      {isPending ? "Processing..." : `Upgrade to ${plan.name} →`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hardware Keepsake Shop Section */}
      <section className="hardware-shop-section" aria-labelledby="hardware-shop-title">
        <div className="shop-header">
          <div className="vintage-eyebrow">
            <span className="eyebrow-rule" aria-hidden="true" />
            <span className="eyebrow-pill">TANGIBLE HARDWARE TOUCHPOINTS</span>
            <span className="eyebrow-rule" aria-hidden="true" />
          </div>
          <h2 id="hardware-shop-title" className="shop-title">
            NFC Keepsake Cards &amp; Encoder Hardware
          </h2>
          <p className="shop-desc">
            Order pre-calibrated, high-frequency NTAG213 cards, laser-engraved luxury wood credentials,
            or USB-C desktop encoders delivered straight to your studio.
          </p>
        </div>

        <div className="hardware-products-grid">
          {nfcHardwareProducts.map((prod) => {
            const isSelected = selectedHardwareId === prod.id;
            return (
              <div
                key={prod.id}
                className={`hardware-card ${isSelected ? "is-selected" : ""}`}
                onClick={() => setSelectedHardwareId(prod.id)}
              >
                <div className="prod-thumb-wrap">
                  <Image
                    src={prod.imageSrc}
                    alt={prod.name}
                    width={320}
                    height={180}
                    className="prod-thumb-img"
                  />
                  <span className="prod-qty-badge">Pack of {prod.quantity}</span>
                </div>
                <div className="prod-body">
                  <h3 className="prod-name">{prod.name}</h3>
                  <p className="prod-desc">{prod.description}</p>
                  <div className="prod-footer">
                    <strong className="prod-price">${prod.price} {prod.currency}</strong>
                    <button
                      type="button"
                      data-testid={`order-hw-${prod.id}`}
                      className={`prod-select-btn ${isSelected ? "is-active" : ""}`}
                    >
                      {isSelected ? "Selected ✓" : "Choose Item"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Fulfillment Form */}
        <div className="hardware-order-drawer">
          <form onSubmit={handleOrderHardware} className="order-form">
            <div className="order-summary-box">
              <span className="summary-label">ORDER SUMMARY</span>
              <h3 className="summary-prod-name">{selectedHardware.name}</h3>
              <div className="summary-calc-row">
                <div className="qty-picker">
                  <label htmlFor="hardware-qty-input">Packs:</label>
                  <input
                    id="hardware-qty-input"
                    type="number"
                    min={1}
                    max={20}
                    value={hardwareQty}
                    onChange={(e) => setHardwareQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="qty-input"
                  />
                </div>
                <div className="total-display">
                  <span>Total: </span>
                  <strong>${selectedHardware.price * hardwareQty} USD</strong>
                </div>
              </div>
            </div>

            <div className="shipping-fields-grid">
              <div className="field-group">
                <label htmlFor="ship-name">Recipient Name</label>
                <input
                  id="ship-name"
                  type="text"
                  required
                  value={shippingAddress.recipientName}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, recipientName: e.target.value })}
                />
              </div>
              <div className="field-group">
                <label htmlFor="ship-phone">Contact Phone</label>
                <input
                  id="ship-phone"
                  type="tel"
                  required
                  value={shippingAddress.phone}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                />
              </div>
              <div className="field-group span-2">
                <label htmlFor="ship-street">Street Address &amp; Unit</label>
                <input
                  id="ship-street"
                  type="text"
                  required
                  value={shippingAddress.street}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                />
              </div>
              <div className="field-group">
                <label htmlFor="ship-city">City</label>
                <input
                  id="ship-city"
                  type="text"
                  required
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                />
              </div>
              <div className="field-group">
                <label htmlFor="ship-country">Country</label>
                <input
                  id="ship-country"
                  type="text"
                  required
                  value={shippingAddress.country}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                />
              </div>
            </div>

            <div className="order-submit-row">
              <div className="payment-method-selector">
                <label>Payment Gateway:</label>
                <select
                  value={paymentProvider}
                  onChange={(e) => setPaymentProvider(e.target.value as any)}
                  className="payment-select"
                >
                  <option value="simulated">⚡ Sandbox Simulation (Instant Approval)</option>
                  <option value="stripe">💳 Stripe (Credit / Debit Card)</option>
                  <option value="paymongo">🇵🇭 PayMongo (GCash / Maya / PH Banking)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isPending}
                data-testid="submit-hardware-order"
                className="submit-order-btn"
              >
                {isPending ? "Confirming Order..." : `Place Hardware Order ($${selectedHardware.price * hardwareQty}) →`}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Previous Purchases & Hardware Shipment History */}
      <section className="order-history-section" aria-labelledby="history-title">
        <h2 id="history-title" className="history-title">Order &amp; License History</h2>
        
        <div className="history-tables-grid">
          <div className="history-card">
            <h3>Event License Passes</h3>
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Pass ID</th>
                    <th>Tier</th>
                    <th>Date</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.purchasedEventPasses.map((pass) => (
                    <tr key={pass.id}>
                      <td className="code-cell">{pass.id}</td>
                      <td>{subscriptionPlans.find((p) => p.id === pass.planId)?.name || pass.planId}</td>
                      <td>{new Date(pass.purchasedAt).toLocaleDateString()}</td>
                      <td>${pass.amount} {pass.currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="history-card">
            <h3>NFC Hardware Shipments</h3>
            <div className="history-table-wrap">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Item</th>
                    <th>Tracking</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.hardwareOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td className="code-cell">{ord.id}</td>
                      <td>{nfcHardwareProducts.find((p) => p.id === ord.productId)?.name || ord.productId}</td>
                      <td className="tracking-cell">{ord.trackingNumber || "Preparing"}</td>
                      <td>
                        <span className={`status-tag ${ord.status}`}>
                          {ord.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
