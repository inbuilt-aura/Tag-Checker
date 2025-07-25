'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePromoStore } from '@/lib/store'
import { formatBatchDate } from '@/lib/date-utils'
import { FolderOpen, Plus, Calendar, Trash2 } from 'lucide-react'

export function BatchSelector() {
  const { 
    batches, 
    currentBatch, 
    fetchBatches, 
    fetchCodes, 
    setCurrentBatch,
    createBatch,
    deleteBatch 
  } = usePromoStore()

  useEffect(() => {
    const loadBatches = async () => {
      await fetchBatches()
      // Auto-select the first batch if none is selected
      if (!currentBatch && batches.length > 0) {
        const firstBatch = batches[0]
        setCurrentBatch(firstBatch)
        await fetchCodes(firstBatch.id)
      }
    }
    loadBatches()
  }, [fetchBatches])

  // Auto-select first batch when batches are loaded
  useEffect(() => {
    if (!currentBatch && batches.length > 0) {
      const firstBatch = batches[0]
      setCurrentBatch(firstBatch)
      fetchCodes(firstBatch.id)
    }
  }, [batches, currentBatch, setCurrentBatch, fetchCodes])

  const handleSelectBatch = async (batch: any) => {
    console.log('=== BATCH SELECTOR DEBUG ===')
    console.log('Selected batch:', batch)
    console.log('Batch ID:', batch.id)
    setCurrentBatch(batch)
    await fetchCodes(batch.id)
  }

  const handleNewBatch = async () => {
    const batchName = window.prompt('Enter a name for the new batch:')
    if (batchName !== null) { // User didn't cancel
      const batch = await createBatch(batchName.trim() || null)
      if (batch) {
        await fetchCodes(batch.id)
      }
    }
  }

  const handleDeleteBatch = async (batch: any, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent batch selection when clicking delete
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the batch "${batch.name || 'Unnamed Batch'}"? This will also delete all promo codes in this batch. This action cannot be undone.`
    )
    
    if (confirmDelete) {
      await deleteBatch(batch.id)
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderOpen className="h-5 w-5" />
          Batches
        </CardTitle>
        <CardDescription className="text-sm">
          Select a batch to work with or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={handleNewBatch}
          variant="outline" 
          className="w-full justify-start hover:bg-primary/5 transition-colors"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Batch
        </Button>
        
        <div className="space-y-1">
          {batches.map((batch) => (
            <div key={batch.id} className="relative group">
              <Button
                variant={currentBatch?.id === batch.id ? 'default' : 'ghost'}
                className="w-full justify-start p-3 h-auto transition-colors pr-12"
                onClick={() => handleSelectBatch(batch)}
              >
                <div className="flex items-start gap-3 w-full">
                  <FolderOpen className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-medium truncate text-sm">{batch.name || 'Unnamed Batch'}</div>
                    <div className="flex items-center gap-1 text-xs mt-0.5">
                      <Calendar className="h-3 w-3" />
                      {formatBatchDate(batch.created_at)}
                    </div>
                  </div>
                </div>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 hover:text-red-600"
                onClick={(e) => handleDeleteBatch(batch, e)}
                title="Delete batch"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        
        {batches.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-muted rounded-lg">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="font-medium mb-1">No batches yet</p>
            <p className="text-xs">Create your first batch to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}