import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function asRowArray(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => x && typeof x === "object") as Record<string, unknown>[];
}

function money(v: unknown): string {
  if (v == null || v === "") return "—";
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : esc(v);
}

/**
 * Simple printable summary (not the ERP print format). Used with expo-print → PDF → share sheet.
 */
export function buildSalarySlipHtml(doc: Record<string, unknown>): string {
  const title = esc(doc.name ?? "Salary Slip");
  const employee = esc(doc.employee_name ?? doc.employee ?? "");
  const period = `${esc(doc.start_date)} – ${esc(doc.end_date)}`;
  const posting = esc(doc.posting_date ?? "");
  const currency = esc(doc.currency ?? "");
  const gross = money(doc.gross_pay ?? doc.total_earning ?? doc.rounded_total ?? "");
  const net = money(doc.net_pay ?? doc.net_pay_amount ?? "");
  const earnings = asRowArray(doc.earnings);
  const deductions = asRowArray(doc.deductions);

  const earnRows = earnings
    .map(
      (r) =>
        `<tr><td>${esc(r.salary_component ?? r.component ?? r.name)}</td><td style="text-align:right">${money(
          r.amount ?? r.default_amount
        )}</td></tr>`
    )
    .join("");
  const dedRows = deductions
    .map(
      (r) =>
        `<tr><td>${esc(r.salary_component ?? r.component ?? r.name)}</td><td style="text-align:right">${money(
          r.amount ?? r.default_amount
        )}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; font-size: 13px; }
    h1 { font-size: 18px; margin: 0 0 4px; color: #00a865; }
    .sub { color: #6b7280; margin-bottom: 20px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #e5e7eb; padding: 8px 4px; text-align: left; }
    th { font-size: 11px; text-transform: uppercase; color: #6b7280; }
    .tot { font-weight: 700; margin-top: 16px; }
    .foot { margin-top: 28px; font-size: 10px; color: #9ca3af; }
  </style></head><body>
    <h1>${title}</h1>
    <div class="sub">${employee} · ${period}${posting ? ` · Posted ${posting}` : ""}${currency ? ` · ${currency}` : ""}</div>
    <p class="tot">Gross: ${gross} &nbsp;·&nbsp; Net: ${net}</p>
    <h2 style="font-size:14px;margin-top:20px">Earnings</h2>
    <table><thead><tr><th>Component</th><th style="text-align:right">Amount</th></tr></thead><tbody>${earnRows || "<tr><td colspan='2'>—</td></tr>"}</tbody></table>
    <h2 style="font-size:14px;margin-top:20px">Deductions</h2>
    <table><thead><tr><th>Component</th><th style="text-align:right">Amount</th></tr></thead><tbody>${dedRows || "<tr><td colspan='2'>—</td></tr>"}</tbody></table>
    <p class="foot">Generated in Centy Mobile from Pay Hub HR data. Official statutory figures remain in Frappe HRMS.</p>
  </body></html>`;
}

export async function shareSalarySlipPdf(doc: Record<string, unknown>): Promise<void> {
  const html = buildSalarySlipHtml(doc);
  const { uri } = await Print.printToFileAsync({ html });
  const available = await Sharing.isAvailableAsync();
  if (available) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: "Share payslip",
      UTI: "com.adobe.pdf",
    });
  }
}
