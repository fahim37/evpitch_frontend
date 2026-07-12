import React from 'react'
import ArchivedJobList from './_components/archived-list'

export default function ArchivedJobsPage() {
    return (
        <main>
            <section className='py-8 lg:py-20'>
                <div className="container">
                    <div className="text-center lg:pb-20 pb-5">
                        <h2 className='text-xl lg:text-4xl font-bold'>Archived Jobs</h2>
                    </div>
                    <ArchivedJobList />
                </div>
            </section>
        </main>
    )
}
