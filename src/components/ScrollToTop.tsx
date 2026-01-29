import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Instant scroll to top, bypassing smooth behavior to prevent lag
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "instant"
        });
    }, [pathname]);

    return null;
}
