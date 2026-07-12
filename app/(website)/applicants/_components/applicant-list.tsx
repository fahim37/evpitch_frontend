"use client"

import { getApplicationsByJobId } from '@/lib/api-service';
import { useQuery } from '@tanstack/react-query';
import { Loader, User } from 'lucide-react';
import { useSearchParams } from 'next/navigation'
import React, { useState } from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import Link from 'next/link';

interface Applicant {
    _id: string;
    jobId: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        image: string;
    };
    status: string;
    createdAt: string;
    updatedAt: string;
}

const ITEMS_PER_PAGE = 10;

export default function ApplicantsList() {
    const searchParams = useSearchParams();
    const jobId = searchParams.get('jobId');
    const [currentPage, setCurrentPage] = useState(1);

    const { data: applicants, isLoading, error } = useQuery({
        queryKey: ['applicants', jobId],
        queryFn: () => getApplicationsByJobId(jobId as string),
        select: (data) => data?.data
    })

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader className="animate-spin h-8 w-8" />
            </div>
        )
    }

    if (error) {
        return (
            <div className='flex justify-center items-center text-red-400 py-20'>
                Error: {error.message}
            </div>
        )
    }

    if (!applicants || applicants.length === 0) {
        return (
            <div className='flex justify-center items-center text-gray-500 py-20'>
                No applicants found for this job.
            </div>
        )
    }

    // Pagination logic
    const totalPages = Math.ceil(applicants.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentApplicants = applicants.slice(startIndex, endIndex);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    type BadgeVariant = "default" | "secondary" | "destructive";

    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    const goToPrevious = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const goToNext = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };


    return (
        <div className='py-8 lg:py-20 px-4 sm:px-6 lg:px-8'>
            <div className="w-full">
                {/* Mobile Card View */}
                <div className="block md:hidden space-y-4">
                    {currentApplicants.map((applicant: Applicant) => (
                        <div key={applicant._id} className="bg-white border rounded-lg p-4 shadow-sm">
                            <div className="flex items-center space-x-3 mb-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={applicant.userId.image} />
                                    <AvatarFallback>
                                        {(() => {
                                            const fullName = applicant.userId.name || "";
                                            const words = fullName.trim().split(" ");
                                            const firstInitial = words[0]?.charAt(0).toUpperCase() || "";
                                            const lastInitial = words.length > 1 ? words[words.length - 1]?.charAt(0).toUpperCase() : "";
                                            return `${firstInitial}${lastInitial}`;
                                        })()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-lg">{applicant.userId.name}</h3>
                                    <p className="text-sm text-gray-500">{applicant.userId.email}</p>
                                </div>
                            </div>

                            <div className="space-y-2 mb-3">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-gray-600 rounded-sm">Experience:</span>
                                    <span className="text-sm">5 Years</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium text-gray-600 rounded-sm">Applied:</span>
                                    <span className="text-sm">{formatDate(applicant.createdAt)}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link href={`/applicants/${applicant._id}`}>
                                    <Button className='bg-[#2B7FD0]/90 hover:bg-[#2B7FD0]'>Applicant Details</Button>
                                </Link>
                                <Button className='bg-green-500 hover:bg-green-600'>Shortlisted</Button>
                                <Button className='bg-red-500 hover:bg-red-600'>Not Selected</Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b">
                                <TableHead className="text-left font-semibold text-gray-700 py-4">Picture</TableHead>
                                <TableHead className="text-left font-semibold text-gray-700 py-4">Name</TableHead>
                                <TableHead className="text-left font-semibold text-gray-700 py-4">Experience</TableHead>
                                <TableHead className="text-left font-semibold text-gray-700 py-4">Applied</TableHead>
                                <TableHead className="text-center font-semibold text-gray-700 py-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentApplicants.map((applicant: Applicant) => (
                                <TableRow key={applicant._id} className="border-b hover:bg-gray-50">
                                    <TableCell className="py-4">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={applicant.userId.image} />
                                            <AvatarFallback className="bg-gray-200">
                                                {(() => {
                                                    const fullName = applicant.userId.name || "";
                                                    const words = fullName.trim().split(" ");
                                                    const firstInitial = words[0]?.charAt(0).toUpperCase() || "";
                                                    const lastInitial = words.length > 1 ? words[words.length - 1]?.charAt(0).toUpperCase() : "";
                                                    return `${firstInitial}${lastInitial}`;
                                                })()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div>
                                            <div className="font-semibold text-gray-900">{applicant.userId.name}</div>
                                            <div className="text-sm text-gray-500">{applicant.userId.email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4 text-gray-700">5 Years</TableCell>
                                    <TableCell className="py-4 text-gray-700">{formatDate(applicant.createdAt)}</TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex flex-wrap justify-center gap-2">
                                            <Link href={`/applicants/${applicant.userId._id}`}>
                                                <Button className='bg-[#2B7FD0]/90 hover:bg-[#2B7FD0]'>Applicant Details</Button>
                                            </Link>
                                            <Button className='bg-green-500 hover:bg-green-600'>Shortlisted</Button>
                                            <Button className='bg-red-500 hover:bg-red-600'>Not Selected</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                        <div className="text-sm text-gray-700">
                            Showing {startIndex + 1} to {Math.min(endIndex, applicants.length)} of {applicants.length} results
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToPrevious}
                                disabled={currentPage === 1}
                                className="px-3 py-1"
                            >
                                Previous
                            </Button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNumber;
                                    if (totalPages <= 5) {
                                        pageNumber = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNumber = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNumber = totalPages - 4 + i;
                                    } else {
                                        pageNumber = currentPage - 2 + i;
                                    }

                                    return (
                                        <Button
                                            key={pageNumber}
                                            variant={currentPage === pageNumber ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => goToPage(pageNumber)}
                                            className="w-8 h-8 p-0"
                                        >
                                            {pageNumber}
                                        </Button>
                                    );
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToNext}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1"
                            >
                                Next
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">Items per page:</span>
                            <Select value={ITEMS_PER_PAGE.toString()} onValueChange={() => { }}>
                                <SelectTrigger className="w-20 h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
