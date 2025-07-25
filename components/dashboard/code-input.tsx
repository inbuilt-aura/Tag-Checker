'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePromoStore } from '@/lib/store'
import { Plus } from 'lucide-react'

export function CodeInput() {
  const [batchName, setBatchName] = useState('')
  const [codes, setCodes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { createBatch, addCodes, currentBatch } = usePromoStore()

  const handleAddCodes = async () => {
    if (!codes.trim()) return
    
    setIsLoading(true)
    
    try {
      let batch = currentBatch
      
      if (!batch) {
        batch = await createBatch(batchName.trim() || null)
        if (!batch) {
          throw new Error('Failed to create batch')
        }
      }
      
      const codeList = codes
        .split(/[,\n]/)
        .map(code => code.trim())
        .filter(code => code.length > 0)
      
      if (codeList.length > 0) {
        await addCodes(batch.id, codeList)
        setCodes('')
        setBatchName('')
      }
    } catch (error) {
      console.error('Error adding codes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plus className="h-5 w-5" />
          Add Promo Codes
        </CardTitle>
        <CardDescription className="text-sm">
          Enter promo codes to validate. You can paste multiple codes separated by commas or new lines.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="Batch name (optional)"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            disabled={!!currentBatch}
            className="text-sm"
          />
          {currentBatch && (
            <p className="text-xs text-muted-foreground mt-2 px-2 py-1 bg-muted/50 rounded">
              Adding to: <span className="font-medium">{currentBatch.name}</span>
            </p>
          )}
        </div>
        
        <div>
          <Textarea
            placeholder="Enter promo codes here (comma or line separated)&#10;Example:&#10;CODE123&#10;PROMO456, OFFER789"
            value={codes}
            onChange={(e) => setCodes(e.target.value)}
            rows={5}
            className="text-sm font-mono resize-none"
          />
          {codes.trim() && (
            <p className="text-xs text-muted-foreground mt-2">
              {codes.split(/[,\n]/).map(code => code.trim()).filter(code => code.length > 0).length} codes detected
            </p>
          )}
        </div>
        
        <Button 
          onClick={handleAddCodes}
          disabled={!codes.trim() || isLoading}
          className="w-full"
          size="sm"
        >
          {isLoading ? (
            <>
              <Plus className="h-4 w-4 mr-2 animate-pulse" />
              Adding Codes...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Codes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}