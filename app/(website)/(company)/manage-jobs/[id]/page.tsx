import React from 'react'
import ManagePage from '../_components/manage-jobs'

async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id: companyId } = await params;
  
  return (
    <div>
        <ManagePage userId={companyId} />
    </div>
  )
}

export default Page
