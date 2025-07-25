'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePromoStore } from '@/lib/store'
import { formatTimestamp } from '@/lib/date-utils'
import { CheckCircle, XCircle, Clock, Filter, Code } from 'lucide-react'

export function ResultTable() {
  const { filteredCodes, filter, setFilter } = usePromoStore()
  
  const codes = filteredCodes()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium"
    switch (status) {
      case 'valid':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400`
      case 'invalid':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400`
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400`
      default:
        return baseClasses
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Validation Results
        </CardTitle>
        <CardDescription>
          View and filter your promo code validation results
        </CardDescription>
        
        <div className="flex flex-wrap gap-2 pt-2">
          {(['all', 'valid', 'invalid', 'pending'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
              className="text-xs"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {codes.length === 0 ? (
          <div className="text-center py-12 px-4 text-muted-foreground border-t">
            <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-2">No codes to display</p>
            <p className="text-sm">Add some promo codes to get started</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-sm">Code</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Message</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((code) => {
                    const timestamp = formatTimestamp(code.timestamp)
                    return (
                      <tr key={code.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="py-4 px-4">
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                            {code.code}
                          </code>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(code.status)}
                            <span className={getStatusBadge(code.status)}>
                              {code.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground max-w-xs">
                          <div className="truncate" title={code.message || '-'}>
                            {code.message || '-'}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">
                          <div className="flex flex-col">
                            <span className="font-medium">{timestamp.primary}</span>
                            {timestamp.secondary && (
                              <span className="text-xs opacity-70">{timestamp.secondary}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3 p-4 border-t">
              {codes.map((code) => {
                const timestamp = formatTimestamp(code.timestamp)
                return (
                  <div key={code.id} className="border rounded-lg p-4 bg-card hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {code.code}
                      </code>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(code.status)}
                        <span className={getStatusBadge(code.status)}>
                          {code.status}
                        </span>
                      </div>
                    </div>
                    
                    {code.message && (
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground">
                          {code.message}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      <span className="font-medium">{timestamp.primary}</span>
                      {timestamp.secondary && (
                        <span className="ml-1 opacity-70">{timestamp.secondary}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}