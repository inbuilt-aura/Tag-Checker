'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePromoStore } from '@/lib/store'
import { formatTimestamp } from '@/lib/date-utils'
import { CheckCircle, XCircle, Clock, Filter, Code, ExternalLink, Check, X } from 'lucide-react'
import { toast } from 'sonner'

export function ResultTable() {
  const { filteredCodes, filter, setFilter, fetchCodes, currentBatch } = usePromoStore()
  
  const codes = filteredCodes()

  const updateCodeStatus = async (codeId: string, status: 'valid' | 'invalid', message?: string) => {
    try {
      const response = await fetch('/api/update-code-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          codeId, 
          status, 
          message: message || `Manually marked as ${status}` 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update code status');
      }

      // Refresh the codes data to show updated status
      if (currentBatch) {
        await fetchCodes(currentBatch.id);
      }
      toast.success(`Code marked as ${status}`);
    } catch (error) {
      console.error('Error updating code:', error);
      toast.error('Failed to update code status');
    }
  };

  const openCodeForVerification = (code: string) => {
    const url = `https://www.perplexity.ai/join/p/airtel?discount_code=${code}`;
    const newWindow = window.open(url, `verify-${code}`, 'width=800,height=600,scrollbars=yes');
    
    toast.info(
      'Window opened! The page will try to auto-detect the result. If not, use the action buttons below.',
      { duration: 5000 }
    );
    
    // Alternative: Show instructions for manual script injection
    setTimeout(() => {
      if (newWindow && !newWindow.closed) {
        console.log('=== AUTO-DETECTOR INSTRUCTIONS ===');
        console.log('If auto-detection fails, paste this in the browser console:');
        console.log('fetch("/auto-detector.js").then(r=>r.text()).then(eval)');
      }
    }, 5000);
  };

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
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/30">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-sm">Code</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Message</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Timestamp</th>
                    <th className="text-center py-3 px-4 font-medium text-sm w-32">Actions</th>
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
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0"
                              onClick={() => openCodeForVerification(code.code)}
                              title={`Open ${code.code} for verification`}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            {code.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0 text-green-600 hover:bg-green-50"
                                  onClick={() => updateCodeStatus(code.id, 'valid', 'Manually verified as valid')}
                                  title="Mark as Valid"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                                  onClick={() => updateCodeStatus(code.id, 'invalid', 'Manually verified as invalid')}
                                  title="Mark as Invalid"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card List */}
            <div className="lg:hidden space-y-3 p-4 border-t">
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
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        <span className="font-medium">{timestamp.primary}</span>
                        {timestamp.secondary && (
                          <span className="ml-1 opacity-70">{timestamp.secondary}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() => openCodeForVerification(code.code)}
                          title={`Open ${code.code} for verification`}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        {code.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 text-green-600 hover:bg-green-50"
                              onClick={() => updateCodeStatus(code.id, 'valid', 'Manually verified as valid')}
                              title="Mark as Valid"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 text-red-600 hover:bg-red-50"
                              onClick={() => updateCodeStatus(code.id, 'invalid', 'Manually verified as invalid')}
                              title="Mark as Invalid"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
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