"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  // Calculate the range of items being displayed
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  // Helper to generate page numbers with ellipsis for large page counts
  const getPageNumbers = () => {
    const pageNumbers = []

    // Always show first page
    pageNumbers.push(1)

    if (totalPages <= 5) {
      // If 5 or fewer pages, show all pages
      for (let i = 2; i <= totalPages; i++) {
        pageNumbers.push(i)
      }
    } else {
      // For many pages, show current page with neighbors and ellipsis

      // Show ellipsis after page 1 if current page is far enough
      if (currentPage > 3) {
        pageNumbers.push("...")
      }

      // Calculate range around current page
      const rangeStart = Math.max(2, currentPage - 1)
      const rangeEnd = Math.min(totalPages - 1, currentPage + 1)

      // Add pages around current page
      for (let i = rangeStart; i <= rangeEnd; i++) {
        if (i !== 1 && i !== totalPages) {
          pageNumbers.push(i)
        }
      }

      // Show ellipsis before last page if needed
      if (currentPage < totalPages - 2) {
        pageNumbers.push("...")
      }

      // Always show last page if more than 1 page
      if (totalPages > 1) {
        pageNumbers.push(totalPages)
      }
    }

    return pageNumbers
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center w-full gap-4">
      <div className="text-sm text-white">
        Showing {startItem} to {endItem} of {totalItems} results
      </div>

      <div className="flex items-center">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-md border border-[#A8A8A8] text-white bg-[#A8A8A8]"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>

        <div className="flex items-center mx-1">
          {getPageNumbers().map((pageNumber, index) => {
            if (pageNumber === "...") {
              return (
                <div key={`ellipsis-${index}`} className="px-3 py-2 text-sm">
                  ...
                </div>
              )
            }

            return (
              <Button
                key={`page-${pageNumber}`}
                variant={pageNumber === currentPage ? "default" : "outline"}
                size="icon"
                className={`h-9 w-9 mx-0.5 rounded-md ${pageNumber === currentPage ? "bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 text-white" : "border border-gray-200"
                  }`}
                onClick={() => onPageChange(pageNumber as number)}
                disabled={isLoading}
              >
                {pageNumber}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-md border border-[#A8A8A8] text-white bg-[#A8A8A8]"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
        >
          <ArrowRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  )
}