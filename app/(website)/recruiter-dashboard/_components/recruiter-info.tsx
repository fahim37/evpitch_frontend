"use client"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getRecruiterAccount } from '@/lib/api-service';
import { useQuery } from '@tanstack/react-query';
import { CircleCheck } from 'lucide-react';
import { useSession } from 'next-auth/react'
import Link from 'next/link';
import React from 'react'


const benefits = [
    "View and hear each candidate’s unique pitch",
    "Initial screening from job candidates video pitch",
    "Update candidates through the recruitment journey easily",
    "Save costs on initial screening calls",
]

export default function RecruiterInfo() {

    const { data: session } = useSession();

    const { data: recruiter } = useQuery({
        queryKey: ['recruiter'],
        queryFn: () => getRecruiterAccount(session?.user?.id || ""),
        select: (data) => data?.data
    })



    return (
        <div className="lg:space-y-16 space-y-8">
            <div className='lg:py-16 py-8 grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className="col-span-1 space-y-2 lg:space-y-8">
                    <div className="flex justify-center lg:justify-start lg:pl-20">

                        <Avatar className="h-32 w-32 rounded-none aspect-square overflow-hidden">
                            <AvatarImage
                                src={recruiter?.companyId?.avatar?.url}
                                alt={recruiter?.companyId?.cname || ""}
                                className="rounded-none object-cover"
                            />
                            <AvatarFallback className="rounded-none">
                                {recruiter?.companyId?.cname
                                    ?.split(" ")
                                    .map((word: string) => word[0]?.toUpperCase())
                                    .join("") || "U"}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="lg:space-y-2 space-y-1">
                        <h2 className='text-xl lg:text-3xl font-bold'>{recruiter?.companyId?.cname}</h2>
                        <p className='text-lg'>{recruiter?.companyId?.aboutUs || "No description"}</p>
                    </div>
                </div>
                <div className="col-span-2">
                    <h2 className='text-2xl font-bold pb-2 mb-8 border-b-2'>Contact Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:gap-y-12 gap-y-4">
                        <div className="space-y-2">
                            <h3 className='font-semibold lg:text-2xl text-lg'>Location</h3>
                            <p>{recruiter?.zipCode}, {recruiter?.location}, {recruiter?.city}</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className='font-semibold lg:text-2xl text-lg'>Email</h3>
                            <p>{recruiter?.emailAddress}</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className='font-semibold lg:text-2xl text-lg'>Phone</h3>
                            <p>{recruiter?.phoneNumber}</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className='font-semibold lg:text-2xl text-lg'>Website</h3>
                            <Link href={recruiter?.website || ""}>
                                {recruiter?.website || "No website"}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <div className="max-w-5xl mx-auto text-center lg:space-y-12 space-y-6">
                <h2 className='text-2xl lg:text-4xl font-bold'>Why Recruit with Us?</h2>
                <div className="flex justify-center">
                    <ul className="lg:space-y-10 space-y-6">
                        {benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center space-x-1 lg:space-x-12">
                                <CircleCheck fill="green" className="text-white lg:w-8 w-6 lg:h-8 h-6 flex-shrink-0" />
                                <span className='lg:text-2xl text-base text-start lg:text-center'>{benefit}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="flex gap-8 items-center justify-center">
                    <Link href="/company-pricing">
                        <Button className='bg-[#2B7FD0] hover:bg-[#2B7FD0]/90 text-white w-40 h-12'>Post Your First Job</Button>
                    </Link>
                    <Link href="/recruiter-dashboard">
                        <Button variant="outline" className='hover:bg-[#2B7FD0]/90 hover:text-white w-40 h-12 border-[#2B7FD0]'>View Job Postings</Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
