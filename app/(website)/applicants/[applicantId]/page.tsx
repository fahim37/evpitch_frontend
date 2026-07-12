import React from 'react'
import ApplicantDetails from './_components/applicant-details'

export default async function ApplicantDetailsPage({ params }: { params: Promise<{ applicantId: string }> }) {

    const resolvedParams = await params

    return (
        <main>
            <section className='py-8 lg:py-20'>
                <div className="container">
                    <ApplicantDetails applicantId={resolvedParams?.applicantId || ''} />
                </div>
            </section>
        </main>
    )
}
