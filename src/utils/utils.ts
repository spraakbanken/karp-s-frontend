export const secondsToDate = (seconds: string): string => {
  const date = new Date(parseInt(seconds) * 1000)
  return date.toISOString().substring(0, 10)
}
