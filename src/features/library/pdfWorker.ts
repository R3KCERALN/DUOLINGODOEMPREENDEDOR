import { pdfjs } from 'react-pdf'

// Vite copia o worker do PDF.js para o build e devolve a URL final.
pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
