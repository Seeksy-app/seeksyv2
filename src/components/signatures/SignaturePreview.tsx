interface SignaturePreviewProps {
  formData: any;
  signatureId: string;
}

export function SignaturePreview({ formData, signatureId }: SignaturePreviewProps) {
  return (
    <div 
      className="bg-white rounded-md p-4 border"
      style={{ fontFamily: formData.font_family }}
    >
      {/* Quote */}
      {formData.quote_text && (
        <p className="italic mb-3" style={{ color: formData.secondary_color }}>
          "{formData.quote_text}"
        </p>
      )}

      {/* Profile */}
      <div className="flex items-center gap-3 mb-3">
        {formData.profile_photo_url && (
          <img 
            src={formData.profile_photo_url} 
            alt={formData.profile_name}
            className="w-14 h-14 rounded-full object-cover"
          />
        )}
        <div>
          {formData.profile_name && (
            <div className="font-bold" style={{ color: formData.primary_color }}>
              {formData.profile_name}
            </div>
          )}
          {formData.profile_title && (
            <div style={{ color: formData.secondary_color }}>
              {formData.profile_title}
            </div>
          )}
        </div>
      </div>

      {/* Company */}
      {(formData.company_name || formData.company_phone || formData.company_website) && (
        <div className="mb-3 text-sm" style={{ color: formData.secondary_color }}>
          {formData.company_name && <div className="font-semibold">{formData.company_name}</div>}
          {formData.company_phone && <div>{formData.company_phone}</div>}
          {formData.company_website && (
            <div>
              <a href={formData.company_website} style={{ color: formData.link_color }}>
                {formData.company_website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {formData.company_address && <div className="text-xs">{formData.company_address}</div>}
        </div>
      )}

      {/* Social */}
      {Object.entries(formData.social_links || {}).filter(([_, url]) => url).length > 0 && (
        <div className="flex gap-3 mb-3 flex-wrap">
          {Object.entries(formData.social_links).filter(([_, url]) => url).map(([platform]) => (
            <a 
              key={platform}
              href="#"
              className="text-sm hover:underline"
              style={{ color: formData.link_color }}
            >
              {getSocialLabel(platform)}
            </a>
          ))}
        </div>
      )}

      {/* Banner */}
      {formData.banner_image_url && (
        <div className="mt-3">
          <img 
            src={formData.banner_image_url} 
            alt={formData.banner_alt_text || "Banner"}
            className="max-w-full rounded"
            style={{ maxWidth: 400 }}
          />
        </div>
      )}
    </div>
  );
}

// Text labels for social platforms (matches HTML export)
function getSocialLabel(platform: string): string {
  const labels: Record<string, string> = {
    facebook: "Facebook",
    twitter: "𝕏",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    youtube: "YouTube",
    tiktok: "TikTok",
    pinterest: "Pinterest",
  };
  return labels[platform] || platform;
}
