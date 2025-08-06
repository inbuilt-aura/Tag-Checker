'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePromoStore } from '@/lib/store'
import { formatBatchDate } from '@/lib/date-utils'
import { Play, Download, RefreshCw, BarChart3, TrendingUp } from 'lucide-react'
import { exportToCSV } from '@/lib/utils'
import { toast } from 'sonner'

export function ValidationControls() {
  const { 
    currentBatch, 
    codes, 
    isValidating,
    validationProgress,
    validateCodes, 
    filteredCodes 
  } = usePromoStore()

  const handleValidate = () => {
    if (currentBatch) {
      console.log('=== FRONTEND DEBUG ===')
      console.log('Current batch:', currentBatch)
      console.log('Batch ID being sent:', currentBatch.id)
      console.log('Codes in store:', codes)
      validateCodes(currentBatch.id)
    }
  }

  const handleEnhancedValidation = async () => {
    if (!currentBatch) return;
    
    const pendingCodes = codes.filter(code => code.status === 'pending').map(code => code.code);
    
    if (pendingCodes.length === 0) {
      toast.info("No pending codes to validate");
      return;
    }

    toast.info(`Starting enhanced validation for ${pendingCodes.length} codes...`);
    
    try {
      const response = await fetch('/api/enhanced-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: pendingCodes }),
      });

      if (!response.ok) {
        throw new Error('Enhanced validation failed');
      }

      const result = await response.json();
      toast.success(`Enhanced validation completed! Valid: ${result.summary.valid}, Invalid: ${result.summary.invalid}, Pending: ${result.summary.pending}`);
      
      // Refresh the batch data
      // You might need to add a refresh function to your store
      
    } catch (error) {
      console.error('Enhanced validation error:', error);
      toast.error('Enhanced validation failed. Try manual verification instead.');
    }
  };

  const handleManualVerify = () => {
    const pendingCodes = codes.filter(code => code.status === 'pending');
    if (pendingCodes.length === 0) {
      toast.info("No pending codes to verify manually");
      return;
    }

    // Open popup windows for manual verification
    pendingCodes.slice(0, 5).forEach((code, index) => { // Limit to 5 codes at once
      setTimeout(() => {
        const url = `https://www.perplexity.ai/join/p/airtel?discount_code=${code.code}`;
        window.open(url, `verify-${code.code}`, 'width=800,height=600,scrollbars=yes');
      }, index * 1000); // 1 second delay between popups
    });

    toast.success(`Opened ${Math.min(pendingCodes.length, 5)} codes for manual verification`);
  }

  const handleExport = () => {
    const data = filteredCodes()
    if (data.length > 0) {
      const filename = `promo-codes-${currentBatch?.name || 'export'}-${new Date().toISOString().split('T')[0]}.csv`
      exportToCSV(data, filename)
      toast.success(`Successfully exported ${data.length} codes to ${filename}!`)
    } else {
      toast.error("No data to export. Please validate some codes first.")
    }
  }

  const pendingCount = codes.filter(code => code.status === 'pending').length
  const validCount = codes.filter(code => code.status === 'valid').length
  const invalidCount = codes.filter(code => code.status === 'invalid').length
  const totalCount = codes.length

  const successRate = totalCount > 0 ? Math.round((validCount / (validCount + invalidCount)) * 100) : 0

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Play className="h-5 w-5" />
          Validation Controls
        </CardTitle>
        <CardDescription className="text-sm">
          Start validation process and export results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentBatch && (
          <div className="bg-gradient-to-r from-muted/50 to-muted/30 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm truncate">{currentBatch.name}</h4>
              <span className="text-xs text-muted-foreground">
                {formatBatchDate(currentBatch.created_at)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">{pendingCount}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{validCount}</div>
                <div className="text-xs text-muted-foreground">Valid</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">{invalidCount}</div>
                <div className="text-xs text-muted-foreground">Invalid</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{totalCount}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>

            {(validCount + invalidCount) > 0 && (
              <div className="mt-3 pt-3 border-t border-muted">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className={`font-medium ${successRate >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {successRate}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <Button 
            onClick={handleValidate}
            disabled={!currentBatch || pendingCount === 0 || isValidating}
            size="sm"
            className="w-full"
          >
            {isValidating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">
                  {validationProgress 
                    ? `Validating... (${validationProgress.current}/${validationProgress.total})`
                    : 'Validating...'
                  }
                </span>
                <span className="sm:hidden">
                  {validationProgress 
                    ? `${validationProgress.current}/${validationProgress.total}`
                    : 'Validating'
                  }
                </span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                <span>Standard</span>
              </>
            )}
          </Button>
          
          <Button 
            variant="secondary"
            onClick={handleEnhancedValidation}
            disabled={!currentBatch || codes.filter(code => code.status === 'pending').length === 0}
            size="sm"
            className="w-full"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            <span>Enhanced</span>
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleManualVerify}
            disabled={!currentBatch || codes.filter(code => code.status === 'pending').length === 0}
            size="sm"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            <span>Manual</span>
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleExport}
            disabled={codes.length === 0}
            size="sm"
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            <span>Export</span>
          </Button>
        </div>

        {!currentBatch && (
          <div className="text-center py-4 text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg">
            <BarChart3 className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p>Select a batch to start validating codes</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}