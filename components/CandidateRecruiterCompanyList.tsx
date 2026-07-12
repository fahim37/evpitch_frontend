import React from "react";

import { Users } from "lucide-react";
import { Button } from "./ui/button";
import Link from "next/link";

// CandidateRecruiterCompanyList component
function CandidateRecruiterCompanyList() {
  const cards = [
    {
      name: "companies",
      title: "Company List",
      description:
        "Connecting people with trusted companies for better services.",
      button: "Explore Companies",
    },
    {
      name: "recruiters",
      title: "Recruiter List",
      description:
        "Find recruiters who can connect you with the right opportunities.",
      button: "Meet Recruiters",
    },
    {
      name: "candidates",
      title: "Candidate List",
      description: "Browse candidates to discover top talent for your company.",
      button: "Browse Candidates",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, i) => (
          <Link href={`/all?resource=${card.name}&title=${card.title}`} key={i}>
            <div className="flex flex-col items-center justify-center border border-[#D3D3D3] rounded-2xl p-8 space-y-4 shadow-sm hover:shadow-md transition">
              <Users className="w-[60px] h-[60px] text-[#2B7FD0]" />
              <h1 className="text-[24px] font-bold text-center">
                {card.title}
              </h1>
              <p className="w-[280px] text-center text-gray-600">
                {card.description}
              </p>
              <Button className="px-6">{card.button}</Button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default CandidateRecruiterCompanyList;
