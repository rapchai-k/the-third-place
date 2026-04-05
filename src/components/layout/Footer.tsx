'use client';

import { Link } from "@/lib/nextRouterAdapter";

export const Footer = () => {
  return (
    <footer className="border-t-2 border-foreground bg-background mb-20 md:mb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Brand */}
          <div>
            <p className="font-extrabold uppercase tracking-wider text-base">My Third Place</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Your community, your space.</p>
          </div>

          {/* Legal links */}
          <div className="flex gap-6">
            <Link
              to="/terms"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/privacy"
              className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>

        <div className="border-t border-foreground/20 mt-6 pt-4">
          <p className="text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} My Third Place. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
