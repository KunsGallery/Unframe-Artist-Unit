// Inquiry mail content. Kept free of imports so it can be tested in isolation.

export type InquiryMailInput = {
  artistName: string;
  artistSlug: string;
  subjectLabel: string;
  workTitle?: string;
  workMeta?: string;
  imageUrl?: string;
  message: string;
  requesterName: string;
  requesterEmail: string;
};

export type MailMessage = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
  bcc?: string[];
};

const paper = "#F4F0E8";
const ink = "#171817";
const muted = "#6D6A62";
const blue = "#1438EE";

export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function multiline(value: string) {
  return escapeHtml(value).replace(/\r?\n/g, "<br>");
}

function layout(body: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:${paper};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${paper};"><tr><td align="center" style="padding:32px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;color:${ink};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;"><tr><td style="padding-bottom:24px;border-bottom:1px solid ${ink};font-size:12px;letter-spacing:2px;color:${blue};">u.a.u / UNFRAME ARTIST UNIT</td></tr>${body}<tr><td style="padding-top:24px;border-top:1px solid ${ink};font-size:12px;color:${muted};">u.a.u — A gallery that stays connected.</td></tr></table></td></tr></table></body></html>`;
}

function workBlock(input: InquiryMailInput) {
  const image = /^https:\/\//.test(input.imageUrl || "") ? `<img src="${escapeHtml(input.imageUrl!)}" alt="" width="160" style="display:block;width:160px;max-width:100%;margin-bottom:12px;">` : "";
  const meta = input.workMeta ? `<div style="color:${muted};font-size:13px;">${escapeHtml(input.workMeta)}</div>` : "";
  return `<tr><td style="padding:20px 0;">${image}<div style="font-family:Baskerville,'Times New Roman',serif;font-size:20px;">${escapeHtml(input.workTitle || input.subjectLabel)}</div>${meta}</td></tr>`;
}

function button(href: string, label: string) {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 20px;background:${blue};color:#ffffff;text-decoration:none;font-size:14px;">${label}</a>`;
}

export function buildArtistMail(input: InquiryMailInput, opts: { from: string; to: string; copyTo?: string; siteUrl: string }): MailMessage {
  const dashboard = `${opts.siteUrl}/dashboard/inquiries`;
  const html = layout(`<tr><td style="padding-top:24px;font-family:Baskerville,'Times New Roman',serif;font-size:26px;line-height:1.3;">새 문의가 도착했습니다.</td></tr>
<tr><td style="color:${muted};font-size:13px;">A new inquiry has arrived on u.a.u.</td></tr>
${workBlock(input)}
<tr><td style="padding:16px;background:#ffffff;border:1px solid ${ink};">${multiline(input.message)}</td></tr>
<tr><td style="padding:16px 0;font-size:14px;">보낸 사람: ${escapeHtml(input.requesterName)} &lt;${escapeHtml(input.requesterEmail)}&gt;<br><span style="color:${muted};">이 메일에 답장하면 문의자에게 바로 전달됩니다. Reply to this email to answer directly.</span></td></tr>
<tr><td style="padding-bottom:24px;">${button(dashboard, "문의함에서 보기")}</td></tr>`);
  const text = [`새 문의가 도착했습니다. / A new inquiry has arrived on u.a.u.`, "", input.workTitle || input.subjectLabel, input.workMeta || "", "", input.message, "", `보낸 사람: ${input.requesterName} <${input.requesterEmail}>`, "이 메일에 답장하면 문의자에게 바로 전달됩니다.", "", `문의함: ${dashboard}`].join("\n");
  return { from: opts.from, to: [opts.to], subject: `[u.a.u] 새 문의 — ${input.subjectLabel}`, html, text, reply_to: input.requesterEmail, bcc: opts.copyTo ? [opts.copyTo] : undefined };
}

export function buildRequesterMail(input: InquiryMailInput, opts: { from: string; siteUrl: string }): MailMessage {
  const artistPage = `${opts.siteUrl}/artist/${encodeURIComponent(input.artistSlug)}`;
  const html = layout(`<tr><td style="padding-top:24px;font-family:Baskerville,'Times New Roman',serif;font-size:26px;line-height:1.3;">${escapeHtml(input.artistName)} 작가에게 문의가 전달되었습니다.</td></tr>
<tr><td style="color:${muted};font-size:13px;">Your inquiry has been delivered to the artist.</td></tr>
${workBlock(input)}
<tr><td style="padding:16px;background:#ffffff;border:1px solid ${ink};">${multiline(input.message)}</td></tr>
<tr><td style="padding:16px 0;font-size:14px;color:${muted};">작가가 답장하면 이 이메일 주소로 연락이 갑니다.</td></tr>
<tr><td style="padding-bottom:24px;">${button(artistPage, "작가 페이지 보기")}</td></tr>`);
  const text = [`${input.artistName} 작가에게 문의가 전달되었습니다. / Your inquiry has been delivered to the artist.`, "", input.workTitle || input.subjectLabel, "", input.message, "", "작가가 답장하면 이 이메일 주소로 연락이 갑니다.", "", `작가 페이지: ${artistPage}`].join("\n");
  return { from: opts.from, to: [input.requesterEmail], subject: `[u.a.u] ${input.artistName} 작가에게 문의가 전달되었습니다`, html, text };
}
