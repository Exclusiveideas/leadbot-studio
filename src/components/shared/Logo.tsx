import React from "react";
import "./Logo.css";
import Link from "next/link";

interface LogoProps {
  size?: "normal" | "big";
}

const Logo: React.FC<LogoProps> = ({ size = "normal" }) => {
  const textSize = size === "big" ? "text-2xl" : "text-xl";

  return (
    <div className="logoWrapper">
      <Link
        href="/"
        className={`flex items-center ${textSize} font-semibold tracking-tight`}
      >
        <span className="text-brand-primary">Leadbot</span>
        <span className="text-gradient">Partners</span>
      </Link>
    </div>
  );
};

export default Logo;
