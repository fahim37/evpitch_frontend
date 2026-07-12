// Utility function to convert MM/YYYY format to ISO date string
export function convertToISODate(dateString: string): string {
  if (!dateString || !dateString.includes("/")) {
    return ""
  }

  const [month, year] = dateString.split("/")
  if (!month || !year || month.length !== 2 || year.length !== 4) {
    return ""
  }

  // Create ISO date string for the first day of the month
  return `${year}-${month}-01T00:00:00.000Z`
}

// Utility function to convert ISO date string back to MM/YYYY format
export function convertFromISODate(isoString: string): string {
  if (!isoString) {
    return ""
  }

  try {
    const date = new Date(isoString)
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = String(date.getFullYear())
    return `${month}/${year}`
  } catch {
    return ""
  }
}
