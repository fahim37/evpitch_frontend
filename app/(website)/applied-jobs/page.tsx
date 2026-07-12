import React from 'react'
import AppliedJobs from './_components/applied-jobs'

export default function AppliedJobsPage() {
    return (
        <main>
            <section className='py-8 lg:py-20'>
                <div className="container">
                    <div className="text-center lg:pb-20 pb-5">
                        <h2 className='text-xl lg:text-4xl font-bold'>Applied Jobs</h2>
                    </div>
                    <AppliedJobs />
                </div>
            </section>
        </main>
    )
}
