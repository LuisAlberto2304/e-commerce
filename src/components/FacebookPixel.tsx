"use client";
import Script from "next/script";
import { useEffect } from "react";
import { initFacebookPixel } from "@/app/lib/facebookPixel";

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

export default function FacebookPixel() {
  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (consent === "accepted" && FB_PIXEL_ID) {
      initFacebookPixel(FB_PIXEL_ID);
    }
  }, []);

  if (!FB_PIXEL_ID) return null;

  return (
    <Script
      id="fb-pixel-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s){
            if(f.fbq)return;n=f.fbq=function(){
              n.callMethod? n.callMethod.apply(n,arguments):n.queue.push(arguments)
            };
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;
            n.version='2.0';n.queue=[];
            t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)
          }(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
        `,
      }}
    />
  );
}
