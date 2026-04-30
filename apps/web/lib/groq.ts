// Re-exports for backwards-compatible imports.
// Correction logic lives in essayCorrection.ts; OCR lives in groqOcr.ts.
export type { RealError, StyleImprovement, CompetencyAnalysis, GroqCorrection } from './essayCorrection'
export { correctEssayWithGroq } from './essayCorrection'
