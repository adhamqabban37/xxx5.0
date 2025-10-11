import { AdDraftBundle } from '@/types/ads';

export function toJSON(bundle: AdDraftBundle): string {
  return JSON.stringify(bundle, null, 2);
}

export function toCSV(bundle: AdDraftBundle): string {
  const rows: string[] = ['channel,field,variantIndex,text'];

  // Google ads
  bundle.google.headlines.forEach((text, index) => {
    rows.push(`google,headline,${index + 1},"${text.replace(/"/g, '""')}"`);
  });
  bundle.google.descriptions.forEach((text, index) => {
    rows.push(`google,description,${index + 1},"${text.replace(/"/g, '""')}"`);
  });
  if (bundle.google.longHeadline) {
    rows.push(`google,longHeadline,1,"${bundle.google.longHeadline.replace(/"/g, '""')}"`);
  }
  bundle.google.keywords?.forEach((text, index) => {
    rows.push(`google,keyword,${index + 1},"${text.replace(/"/g, '""')}"`);
  });
  bundle.google.callouts?.forEach((text, index) => {
    rows.push(`google,callout,${index + 1},"${text.replace(/"/g, '""')}"`);
  });

  // Bing ads
  bundle.bing.headlines.forEach((text, index) => {
    rows.push(`bing,headline,${index + 1},"${text.replace(/"/g, '""')}"`);
  });
  bundle.bing.descriptions.forEach((text, index) => {
    rows.push(`bing,description,${index + 1},"${text.replace(/"/g, '""')}"`);
  });
  bundle.bing.keywords?.forEach((text, index) => {
    rows.push(`bing,keyword,${index + 1},"${text.replace(/"/g, '""')}"`);
  });

  // Meta ads
  bundle.meta.primaryTexts.forEach((text, index) => {
    rows.push(`meta,primaryText,${index + 1},"${text.replace(/"/g, '""')}"`);
  });
  bundle.meta.headlines.forEach((text, index) => {
    rows.push(`meta,headline,${index + 1},"${text.replace(/"/g, '""')}"`);
  });
  bundle.meta.descriptions.forEach((text, index) => {
    rows.push(`meta,description,${index + 1},"${text.replace(/"/g, '""')}"`);
  });
  rows.push(`meta,callToAction,1,"${bundle.meta.callToAction}"`);

  // TikTok ads
  bundle.tiktok.primaryTexts.forEach((text, index) => {
    rows.push(`tiktok,primaryText,${index + 1},"${text.replace(/"/g, '""')}"`);
  });
  bundle.tiktok.hooks.forEach((text, index) => {
    rows.push(`tiktok,hook,${index + 1},"${text.replace(/"/g, '""')}"`);
  });
  bundle.tiktok.ctas.forEach((text, index) => {
    rows.push(`tiktok,cta,${index + 1},"${text.replace(/"/g, '""')}"`);
  });
  bundle.tiktok.hashtags.forEach((text, index) => {
    rows.push(`tiktok,hashtag,${index + 1},"${text.replace(/"/g, '""')}"`);
  });

  return rows.join('\n');
}

export function download(name: string, data: string, mime: string): void {
  const blob = new Blob([data], { type: mime });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<void> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers or non-HTTPS
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  } catch (err) {
    throw new Error('Failed to copy to clipboard');
  }
}
