import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster 
      position="top-right" 
      richColors 
      closeButton
      toastOptions={{
        duration: 4000,
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }}
    />
  )
}
