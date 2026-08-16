/**
 * Transactional email for Bizim Kargo — a thin Resend wrapper plus the two
 * lead-flow templates (carrier notification + customer confirmation).
 *
 * When RESEND_API_KEY is unset the wrapper degrades gracefully: it logs the
 * email clearly to the server console and reports { sent: false }, so the
 * lead flow keeps working in local/demo environments.
 *
 * Templates are classic email HTML: table-based layout, every style inlined,
 * no external assets. Brand colours: navy #1a3f79, accent #e54848.
 */

import { Resend } from "resend";

import {
  COUNTRIES,
  SERVICE_TYPE_LABELS,
  type Carrier,
  type Currency,
  type LeadContact,
  type PriceLine,
  type QuoteResult,
  type ShipmentItem,
  type ShipmentRequest,
} from "./types";

// ---------------------------------------------------------------------------
// Send wrapper
// ---------------------------------------------------------------------------

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export interface SendEmailResult {
  sent: boolean;
  /** Resend message id when sent. */
  id?: string;
  /** Human-readable failure reason when a real send was attempted and failed. */
  error?: string;
}

/**
 * Sends an email via Resend, or logs it to the console when RESEND_API_KEY is
 * absent. Never throws — lead submission must not fail because email did.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Demo mode: make the "email" unmissable in the server console.
    console.log("─".repeat(72));
    console.log("[email] RESEND_API_KEY is not set — email NOT sent (logged instead).");
    console.log(`[email]   To:      ${to}`);
    console.log(`[email]   Subject: ${subject}`);
    console.log("─".repeat(72));
    return { sent: false };
  }

  const from = process.env.EMAIL_FROM ?? "Bizim Kargo <onboarding@resend.dev>";

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error(`[email] Resend rejected "${subject}" to ${to}: ${error.message}`);
      return { sent: false, error: error.message };
    }
    return { sent: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[email] Failed sending "${subject}" to ${to}: ${message}`);
    return { sent: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Shared building blocks
// ---------------------------------------------------------------------------

export interface EmailContent {
  subject: string;
  html: string;
}

const NAVY = "#1a3f79";
const ACCENT = "#e54848";
const INK = "#24303f";
const MUTED = "#5f6b7a";
const BORDER = "#e3e8ef";
const PAPER = "#f4f6f9";

const CURRENCY_SYMBOLS: Record<Currency, string> = { GBP: "£", EUR: "€", USD: "$" };

function money(amount: number, currency: Currency = "GBP"): string {
  return `${CURRENCY_SYMBOLS[currency]}${amount.toFixed(2)}`;
}

/** Escapes user-supplied text before it is interpolated into HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const PREFERRED_CONTACT_LABELS: Record<LeadContact["preferredContact"], string> = {
  phone: "Phone",
  email: "Email",
  whatsapp: "WhatsApp",
};

/** "United Kingdom (SW1A 1AA) → Turkey (İstanbul / Kadıköy)" */
function routeText(request: ShipmentRequest): string {
  const from = `${COUNTRIES[request.pickup.country].name} (${request.pickup.postcodeOrCity})`;
  const to = `${COUNTRIES[request.delivery.country].name} (${request.delivery.postcodeOrCity})`;
  return `${from} → ${to}`;
}

/** Outer frame: navy masthead, white card, small-print footer. */
function layout(preheader: string, bodyHtml: string): string {
  return `
<div style="margin:0;padding:24px 12px;background-color:${PAPER};font-family:Arial,Helvetica,sans-serif;">
  <!-- Hidden preview line shown by inbox list views -->
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;">
    <tr>
      <td style="background-color:${NAVY};border-radius:8px 8px 0 0;padding:20px 28px;">
        <span style="color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.5px;">Bizim Kargo</span>
        <span style="color:${ACCENT};font-size:20px;font-weight:bold;">.</span>
        <div style="color:#b9c6dc;font-size:12px;padding-top:4px;">UK ⇆ Turkey cargo marketplace</div>
      </td>
    </tr>
    <tr>
      <td style="background-color:#ffffff;border:1px solid ${BORDER};border-top:0;border-radius:0 0 8px 8px;padding:28px;">
        ${bodyHtml}
      </td>
    </tr>
    <tr>
      <td style="padding:16px 28px;color:${MUTED};font-size:11px;line-height:1.6;">
        Bizim Kargo is a quote marketplace: transport contracts are agreed directly between
        customer and carrier. Prices shown are the carrier's indicative quotation and may be
        adjusted once the shipment details are confirmed.
      </td>
    </tr>
  </table>
</div>`;
}

function sectionTitle(title: string): string {
  return `<h2 style="margin:26px 0 10px;font-size:13px;color:${NAVY};text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid ${ACCENT};display:inline-block;padding-bottom:3px;">${escapeHtml(
    title,
  )}</h2>`;
}

/** Two-column label/value rows used for contact and shipment details. */
function detailRows(rows: Array<[label: string, valueHtml: string]>): string {
  const tr = rows
    .map(
      ([label, valueHtml]) => `
      <tr>
        <td style="padding:6px 12px 6px 0;color:${MUTED};font-size:13px;white-space:nowrap;vertical-align:top;">${escapeHtml(
          label,
        )}</td>
        <td style="padding:6px 0;color:${INK};font-size:13px;">${valueHtml}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">${tr}</table>`;
}

/** Items table with per-piece dimensions/weight and a totals row. */
function itemsTable(items: ShipmentItem[]): string {
  const th = (text: string, align: "left" | "right" = "left") =>
    `<th align="${align}" style="padding:8px 10px;background-color:${NAVY};color:#ffffff;font-size:12px;font-weight:bold;">${text}</th>`;
  const td = (html: string, align: "left" | "right" = "left") =>
    `<td align="${align}" style="padding:8px 10px;border-bottom:1px solid ${BORDER};color:${INK};font-size:13px;">${html}</td>`;

  const rows = items
    .map(
      (item) => `
      <tr>
        ${td(String(item.quantity), "right")}
        ${td(`${item.lengthCm} × ${item.widthCm} × ${item.heightCm}`)}
        ${td(item.weightKg.toString(), "right")}
        ${td(item.description ? escapeHtml(item.description) : `<span style="color:${MUTED};">—</span>`)}
      </tr>`,
    )
    .join("");

  const totalPieces = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalWeight = items.reduce((sum, item) => sum + item.quantity * item.weightKg, 0);

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid ${BORDER};border-collapse:collapse;">
    <tr>
      ${th("Qty", "right")}${th("Dimensions (cm)")}${th("Weight (kg each)", "right")}${th("Contents")}
    </tr>
    ${rows}
    <tr>
      <td colspan="4" style="padding:8px 10px;background-color:${PAPER};color:${INK};font-size:12px;">
        <strong>${totalPieces}</strong> piece${totalPieces === 1 ? "" : "s"} ·
        <strong>${totalWeight.toFixed(1)} kg</strong> actual weight in total
      </td>
    </tr>
  </table>`;
}

/** Price build-up: one row per PriceLine, then a navy total band. */
function priceBreakdown(result: QuoteResult): string {
  if (result.requiresManualQuote) {
    const indication =
      result.total > 0
        ? `Prices for this service start from ${money(result.total, result.currency)}.`
        : "The carrier will advise the price.";
    return `
    <div style="border:1px solid ${BORDER};border-left:4px solid ${ACCENT};padding:14px 16px;color:${INK};font-size:13px;line-height:1.6;">
      <strong>Price on application.</strong> This request needs a tailored quotation,
      which the carrier will confirm after reviewing the details. ${indication}
    </div>`;
  }

  const lineRow = (line: PriceLine) => `
    <tr>
      <td style="padding:7px 12px;border-bottom:1px solid ${BORDER};color:${INK};font-size:13px;">
        ${escapeHtml(line.label)}${
          line.note ? `<div style="color:${MUTED};font-size:11px;padding-top:2px;">${escapeHtml(line.note)}</div>` : ""
        }
      </td>
      <td align="right" style="padding:7px 12px;border-bottom:1px solid ${BORDER};color:${INK};font-size:13px;white-space:nowrap;">
        ${money(line.amount, result.currency)}
      </td>
    </tr>`;

  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border:1px solid ${BORDER};border-collapse:collapse;">
    ${result.lines.map(lineRow).join("")}
    <tr>
      <td style="padding:10px 12px;background-color:${NAVY};color:#ffffff;font-size:14px;font-weight:bold;">Total</td>
      <td align="right" style="padding:10px 12px;background-color:${NAVY};color:#ffffff;font-size:16px;font-weight:bold;white-space:nowrap;">
        ${money(result.total, result.currency)}
      </td>
    </tr>
    <tr>
      <td colspan="2" style="padding:8px 12px;background-color:${PAPER};color:${MUTED};font-size:11px;line-height:1.5;">
        ${escapeHtml(result.basis.explanation)}
      </td>
    </tr>
  </table>`;
}

/** Shipment facts shared by both templates (route, service, dates, insurance). */
function shipmentSection(request: ShipmentRequest, result: QuoteResult): string {
  const rows: Array<[string, string]> = [
    ["Service", escapeHtml(SERVICE_TYPE_LABELS[request.serviceType])],
    ["Route", escapeHtml(routeText(request))],
    [
      "Carrier service",
      `${escapeHtml(result.serviceName)} — ${escapeHtml(result.mode)} freight, ` +
        `${result.transitDaysMin}–${result.transitDaysMax} days`,
    ],
  ];
  if (request.readyDate) {
    rows.push(["Ready to collect", escapeHtml(request.readyDate)]);
  }
  if (typeof request.declaredValueGbp === "number") {
    rows.push(["Declared value", money(request.declaredValueGbp, "GBP")]);
  }
  rows.push(["Insurance requested", request.wantsInsurance ? "Yes" : "No"]);
  if (request.vehicleDescription) {
    rows.push(["Vehicle", escapeHtml(request.vehicleDescription)]);
  }

  const itemsHtml =
    request.items.length > 0
      ? itemsTable(request.items)
      : `<p style="margin:0;color:${MUTED};font-size:13px;">No individual pieces listed for this request.</p>`;

  return `
    ${sectionTitle("Shipment details")}
    ${detailRows(rows)}
    <div style="height:10px;"></div>
    ${itemsHtml}`;
}

// ---------------------------------------------------------------------------
// Template: lead notification → carrier
// ---------------------------------------------------------------------------

/**
 * Email sent to the carrier when a customer submits a lead against one of
 * their quoted services. Includes the customer's contact details, the full
 * shipment, and the price the customer saw (frozen snapshot).
 */
export function leadEmailToCarrier(params: {
  carrier: Carrier;
  contact: LeadContact;
  request: ShipmentRequest;
  result: QuoteResult;
  /** Optional lead uuid, shown as a booking reference. */
  leadId?: string;
}): EmailContent {
  const { carrier, contact, request, result, leadId } = params;

  const subject = `New lead — ${SERVICE_TYPE_LABELS[request.serviceType]}, ${
    COUNTRIES[request.pickup.country].name
  } → ${COUNTRIES[request.delivery.country].name} (${contact.name})`;

  const contactRows: Array<[string, string]> = [
    ["Name", `<strong>${escapeHtml(contact.name)}</strong>`],
    ["Phone", `<a href="tel:${escapeHtml(contact.phone)}" style="color:${NAVY};">${escapeHtml(contact.phone)}</a>`],
    [
      "Email",
      `<a href="mailto:${escapeHtml(contact.email)}" style="color:${NAVY};">${escapeHtml(contact.email)}</a>`,
    ],
    ["Prefers", escapeHtml(PREFERRED_CONTACT_LABELS[contact.preferredContact])],
  ];
  if (contact.notes) {
    contactRows.push(["Notes", escapeHtml(contact.notes)]);
  }

  const body = `
    <h1 style="margin:0 0 6px;font-size:20px;color:${INK};">You have a new lead</h1>
    <p style="margin:0;color:${MUTED};font-size:13px;line-height:1.6;">
      A customer has chosen <strong style="color:${INK};">${escapeHtml(carrier.companyName)}</strong>
      through Bizim Kargo${leadId ? ` — reference <strong style="color:${INK};">${escapeHtml(leadId)}</strong>` : ""}.
      Please contact them within one working day to confirm the booking.
    </p>

    ${sectionTitle("Customer contact details")}
    ${detailRows(contactRows)}

    ${shipmentSection(request, result)}

    ${sectionTitle(result.requiresManualQuote ? "Requested quotation" : "Price quoted to the customer")}
    ${priceBreakdown(result)}

    <p style="margin:22px 0 0;color:${MUTED};font-size:12px;line-height:1.6;">
      This price was calculated from the tariff you configured for
      &ldquo;${escapeHtml(result.serviceName)}&rdquo;. If anything about the shipment differs on
      collection, agree any changes with the customer before you proceed.
    </p>`;

  return {
    subject,
    html: layout(`New lead from ${contact.name} — ${routeText(request)}`, body),
  };
}

// ---------------------------------------------------------------------------
// Template: confirmation → customer
// ---------------------------------------------------------------------------

/**
 * Email sent to the customer confirming their request has been passed to the
 * carrier, with the carrier's contact details and the quoted price.
 */
export function confirmationEmailToCustomer(params: {
  carrier: Carrier;
  contact: LeadContact;
  request: ShipmentRequest;
  result: QuoteResult;
  /** Optional lead uuid, shown as a booking reference. */
  leadId?: string;
}): EmailContent {
  const { carrier, contact, request, result, leadId } = params;

  const subject = `Your quote request has been sent to ${carrier.companyName}`;

  const ratingText =
    carrier.reviewCount > 0
      ? `${carrier.rating.toFixed(1)} / 5 from ${carrier.reviewCount} review${
          carrier.reviewCount === 1 ? "" : "s"
        }`
      : "No reviews yet";

  const carrierRows: Array<[string, string]> = [
    ["Company", `<strong>${escapeHtml(carrier.companyName)}</strong>`],
    ["Based in", escapeHtml(COUNTRIES[carrier.baseCountry].name)],
    [
      "Phone",
      `<a href="tel:${escapeHtml(carrier.contactPhone)}" style="color:${NAVY};">${escapeHtml(
        carrier.contactPhone,
      )}</a>`,
    ],
    [
      "Email",
      `<a href="mailto:${escapeHtml(carrier.contactEmail)}" style="color:${NAVY};">${escapeHtml(
        carrier.contactEmail,
      )}</a>`,
    ],
    ["Rating", escapeHtml(ratingText)],
    [
      "Status",
      carrier.verified
        ? `<span style="color:${NAVY};font-weight:bold;">Verified carrier</span>`
        : "Not yet verified by Bizim Kargo",
    ],
  ];
  if (carrier.yearsOperating !== null && carrier.yearsOperating !== undefined) {
    carrierRows.push([
      "Experience",
      `${carrier.yearsOperating} year${carrier.yearsOperating === 1 ? "" : "s"} operating`,
    ]);
  }

  const nextStep = result.requiresManualQuote
    ? `Because this is a ${escapeHtml(
        SERVICE_TYPE_LABELS[request.serviceType].toLowerCase(),
      )} request, the carrier will review the details and come back to you with a tailored price.`
    : `The carrier will contact you by ${escapeHtml(
        PREFERRED_CONTACT_LABELS[contact.preferredContact],
      )} to confirm collection. The final price will be confirmed by the carrier before collection.`;

  const body = `
    <h1 style="margin:0 0 6px;font-size:20px;color:${INK};">Thank you, ${escapeHtml(contact.name)}</h1>
    <p style="margin:0;color:${MUTED};font-size:13px;line-height:1.6;">
      Your request${leadId ? ` (reference <strong style="color:${INK};">${escapeHtml(leadId)}</strong>)` : ""}
      has been sent to <strong style="color:${INK};">${escapeHtml(carrier.companyName)}</strong>.
      ${nextStep}
    </p>

    ${sectionTitle("Your carrier")}
    ${detailRows(carrierRows)}

    ${shipmentSection(request, result)}

    ${sectionTitle(result.requiresManualQuote ? "Price" : "Estimated price")}
    ${priceBreakdown(result)}

    <p style="margin:22px 0 0;color:${MUTED};font-size:12px;line-height:1.6;">
      Keep this email — it contains everything you and the carrier agreed at the time of your
      request. If you need to change the shipment, contact the carrier directly using the
      details above.
    </p>`;

  return {
    subject,
    html: layout(
      `Your request is with ${carrier.companyName} — ${routeText(request)}`,
      body,
    ),
  };
}
