import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component - when the route/location changes, scroll to top of the page.
 * This forces navigations (including from cards/explore links) to land at the page top.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch (e) {
      // fallback
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
