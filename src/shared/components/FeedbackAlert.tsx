import { Alert } from '@mui/material'

type FeedbackAlertProps = {
  message?: string | null
  severity?: 'error' | 'success' | 'info' | 'warning'
}

export function FeedbackAlert({ message, severity = 'error' }: FeedbackAlertProps) {
  if (!message) return null
  return <Alert severity={severity} variant="filled" sx={{ borderRadius: 1 }}>{message}</Alert>
}
