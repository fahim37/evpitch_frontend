import React, { Suspense } from 'react'
import JobHistory from '../_components/job-history'

function Page() {
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <JobHistory />
      </Suspense>
    </div>
  )
}

export default Page