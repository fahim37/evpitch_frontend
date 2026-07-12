import React, { Suspense } from 'react'
import ApplicantsList from './_components/applicant-list'

export default function page() {
    return (
        <main>
            <section className="py-8 lg:py-20">
                <div className="container">
                    <div className="text-center max-w-5xl mx-auto space-y-5">
                        <h2 className='text-xl lg:text-4xl font-bold'>Applicant List</h2>
                        <p>Please ease the job application journey for our members by updating each candidate promptly at every stage of the recruitment process. To update applicants, click on the relevant status button at each decision point.</p>
                    </div>
                    <Suspense fallback={<div>Loading...</div>}>
                        <ApplicantsList />
                    </Suspense>
                </div>
            </section>
        </main>
    )
}
