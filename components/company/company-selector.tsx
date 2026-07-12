"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchCompanies, Company } from "@/lib/api-service";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CompanySelectorProps {
  selectedCompany?: string; // ✅ just one company id, not array
  onCompanyChange: (companyId: string) => void;
}

export function CompanySelector({
  selectedCompany = "",
  onCompanyChange,
}: CompanySelectorProps) {
  const [open, setOpen] = useState(false);

  const { data: companies = [], isLoading } = useQuery<Company[]>({
    queryKey: ["companies"],
    queryFn: fetchCompanies,
  });

  // Find currently selected company
  const selectedCompanyObject = companies.find(
    (company: Company) => company.id === selectedCompany
  );

  const handleSelect = (companyId: string) => {
    if (companyId === selectedCompany) {
      onCompanyChange(""); // ✅ clear selection if clicked again
    } else {
      onCompanyChange(companyId); // ✅ set new selection
    }
    setOpen(false); // close dropdown
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900">
          Select Company
        </label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between bg-white"
            >
              {selectedCompanyObject ? (
                <div className="flex items-center gap-2">
                  {selectedCompanyObject.clogo && (
                    <Image
                      src={selectedCompanyObject.clogo}
                      alt={selectedCompanyObject.cname}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  {selectedCompanyObject.cname}
                </div>
              ) : (
                "Select Company"
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder="Search companies..." />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? "Loading..." : "No companies found."}
                </CommandEmpty>
                <CommandGroup>
                  {companies.map((company: Company) => (
                    <CommandItem
                      key={company.id}
                      value={company.id}
                      onSelect={(val) => handleSelect(val)}
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${
                          selectedCompany === company.id
                            ? "opacity-100"
                            : "opacity-0"
                        }`}
                      />
                      {company.clogo && (
                        <Image
                          src={company.clogo}
                          alt={company.cname}
                          width={24}
                          height={24}
                          className="rounded-full mr-2"
                        />
                      )}
                      {company.cname}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
