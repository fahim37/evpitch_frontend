import { Linkedin, Twitter, Facebook, Instagram, Globe } from "lucide-react";

interface SocialIconProps {
  url: string;
  className?: string;
}

export function SocialIcon({ url, className = "h-5 w-5" }: SocialIconProps) {
  const getSocialIcon = (url: string) => {
    const domain = url.toLowerCase();

    if (domain.includes("linkedin.com")) {
      return <Linkedin className={className} />;
    }
    if (domain.includes("twitter.com") || domain.includes("x.com")) {
      return <Twitter className={className} />;
    }
    if (domain.includes("facebook.com")) {
      return <Facebook className={className} />;
    }
    if (domain.includes("instagram.com")) {
      return <Instagram className={className} />;
    }
    if (domain.includes("upwork.com")) {
      return (
        <div
          className={`${className} bg-green-600 text-white rounded flex items-center justify-center text-xs font-bold`}
        >
          Up
        </div>
      );
    }
    if (domain.includes("tiktok.com")) {
      return (
        <div
          className={`${className} bg-black text-white rounded flex items-center justify-center text-xs font-bold`}
        >
          TT
        </div>
      );
    }

    return <Globe className={className} />;
  };

  const normalizeUrl = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  return (
    <a
      href={normalizeUrl(url)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
    >
      {getSocialIcon(url)}
    </a>
  );
}
