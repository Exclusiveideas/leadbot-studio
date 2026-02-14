import React from "react";
import "./Logo.css";
import Link from "next/link";

interface LogoProps {
  size?: "normal" | "big";
}

const Logo: React.FC<LogoProps> = ({ size = "normal" }) => {
  return (
    <div className="logoWrapper">
      {/* Using a simple text logo for now - can be replaced with actual logo image */}
       <Link
            href="/"
            className="flex items-center space-x-2 text-4xl font-bold"
          >
            <span
              className={`transition-colors text-white`}
            >
              LeadBotStudio
            </span>
          </Link>
    </div>
  );
}; 

export default Logo;
