"use client";
import { useEffect, useState } from "react";

export function PortalContainer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Create portal container if it doesn't exist
    if (!document.getElementById('window-portal')) {
      const portal = document.createElement('div');
      portal.id = 'window-portal';
      portal.style.position = 'fixed';
      portal.style.top = '0';
      portal.style.left = '0';
      portal.style.width = '100vw';
      portal.style.height = '100vh';
      portal.style.pointerEvents = 'none';
      portal.style.zIndex = '1000';
      portal.style.overflow = 'visible';
      document.body.appendChild(portal);
      console.log('Portal container created');
    }
    return () => {
      const portal = document.getElementById('window-portal');
      if (portal && portal.parentNode) {
        portal.parentNode.removeChild(portal);
      }
    };
  }, []);
  return null;
}
