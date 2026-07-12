import React from "react";

interface PageHeadersProps {
  title?: string;
  description?: string;
  subdescription?: string;
  align?: "left" | "center"; // New prop for alignment
}


const PageHeaders = ({
  title,
  description,
  subdescription,
  align = "center", // Default center alignment
}: PageHeadersProps) => {
  const alignmentClass = align === "left" ? "text-left" : "text-center";
  const marginClass = align === "left" ? "" : "mx-auto"; // Only center horizontally when text-center

  return (
    <div className={`${alignmentClass} mb-8 md:mb-12 lg:mb-16`}>
      <h1 className="text-[#131313] text-2xl md:text-3xl lg:text-5xl font-bold mb-2 md:mb-3 lg:mb-4 " style={{ color: "rgb(43, 127, 208)" }}>
        {title}
      </h1>
      <p
        className={`max-w-[90%] md:max-w-[668px] ${marginClass} text-sm md:text-base text-[#424242] font-normal`}
      >
        {description}
      </p>
      <p
        className={`max-w-[90%] md:max-w-[668px] ${marginClass} text-sm md:text-base text-[#424242] font-normal mt-2 md:mt-3`}
      >
        {subdescription}
      </p>
    </div>
  );
};

export default PageHeaders;
