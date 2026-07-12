"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function ScrollingInfoBar() {
  // Group data by role
  const roles = [
    {
      role: "candidate",
      buttonText: "Candidates Access",
      texts: [
        "Amplify your Profile",
        "IT",
        "Data",
        "AI",
        "Leadership",
        "Education",
        "Engineering",
        "Aviation",
        "Oil & Gas",
        "Health Care",
        "Social Care",
        "Legal",
        "Tradesmen",
        "Film & TV",
        "Marketing",
        "Catering",
        "Hospitality",
        "Content Creation",
        "Events Management",
        "Compères",
        "Multimedia",
        "Pharmaceutical",
        "Medical",
        "Leadership",
        "Admin",
        "Graduates",
        "Trainees",
        "Apprentices",
        "Experienced Professionals",
        "All Skills & All Levels Welcome",
        "Record Your Free 30-Second Elevator Pitch",
        "Apply to Jobs",
        "Start your Dream Job",
      ],
    },
    {
      role: "recruiter",
      buttonText: "Recruiters Access",
      texts: [
        "Post Job Adverts",
        "Hear the Pitch behind the Resume",
        "One-click Candidate feedback",
        "‘All job posts free until January 2027",
      ],
    },
    {
      role: "company",
      buttonText: "Companies Access",
      texts: [
        "60-Seconds Company Culture Pitch",
        "Post Job Adverts",
        "Hear the Pitch behind the Resume",
        "One-click Candidate feedback",
        "‘All job posts free until January 2027",
      ],
    },
  ];

  // Build the scrolling sequence: button + texts for each role
  const sequence = roles.flatMap((group) => [
    { type: "button", role: group.role, text: group.buttonText },
    ...group.texts.map((t) => ({ type: "text", role: group.role, text: t })),
  ]);

  // Duplicate the whole sequence to make it loop seamlessly
  const duplicatedItems = [...sequence, ...sequence];

  return (
    <div className="bg-primary text-white py-3 px-4 md:px-6 overflow-hidden relative">
      <motion.div
        className="flex items-center gap-8 whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration: 70,
            ease: "linear",
          },
        }}
        style={{ width: "max-content" }}
      >
        {duplicatedItems.map((item, index) => (
          <div key={index} className="flex items-center gap-4">
            {item.type === "button" ? (
              <Button
                asChild
                variant="secondary"
                className="bg-white text-v0-blue-500 hover:bg-gray-100 text-sm h-auto py-1.5 px-3"
              >
                <Link href={`/register?role=${item.role}`}>
                  {item.text}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <span className="flex items-center gap-2 text-sm">
                <span className="h-2 w-2 rounded-full bg-white" />
                {item.text}
              </span>
            )}
          </div>
        ))}
      </motion.div>
    </div>
  );
}
