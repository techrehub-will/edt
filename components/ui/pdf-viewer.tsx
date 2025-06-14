"use client"

import React, { useState, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react'

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
  url: string
  fileName: string
}

export function PDFViewer({ url, fileName }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.2)
  const [rotation, setRotation] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)
  const [useIframe, setUseIframe] = useState<boolean>(false)

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoading(false)
  }, [])
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF with react-pdf:', error)
    setUseIframe(true)
    setLoading(false)
  }, [])

  const changePage = useCallback((offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset
      return Math.min(Math.max(1, newPageNumber), numPages)
    })
  }, [numPages])

  const changeScale = useCallback((delta: number) => {
    setScale(prevScale => Math.min(Math.max(0.5, prevScale + delta), 3.0))
  }, [])

  const rotate = useCallback(() => {
    setRotation(prevRotation => (prevRotation + 90) % 360)
  }, [])
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p>Loading PDF...</p>
        </div>
      </div>
    )
  }

  // If react-pdf failed, use iframe fallback
  if (useIframe) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
          <div className="text-sm font-medium">
            PDF Viewer (Browser Default)
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const link = document.createElement('a')
              link.href = url
              link.download = fileName
              link.target = '_blank'
              link.click()
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
        <div className="flex-1">
          <iframe
            src={url}
            className="w-full h-full border-0"
            title={`PDF Viewer - ${fileName}`}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* PDF Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium px-2">
            Page {pageNumber} of {numPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeScale(-0.2)}
            disabled={scale <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-sm font-medium px-2">
            {Math.round(scale * 100)}%
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => changeScale(0.2)}
            disabled={scale >= 3.0}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={rotate}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const link = document.createElement('a')
              link.href = url
              link.download = fileName
              link.target = '_blank'
              link.click()
            }}
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseIframe(!useIframe)}
          >
            {useIframe ? 'Enhanced View' : 'Simple View'}
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        <div className="flex justify-center">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Loading PDF...</p>
                </div>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-96">
                <div className="text-center text-red-600">
                  <p className="font-medium">Failed to load PDF</p>
                  <p className="text-sm mt-1">Please try downloading the file instead</p>
                </div>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              className="shadow-lg"
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      </div>
    </div>
  )
}
