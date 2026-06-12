import { FeatureSection } from "./feature-section";

export function KnowledgeIntelligenceSection() {
  return (
    <FeatureSection
      reversed
      overline="Knowledge Intelligence"
      title="Every answer grounded in"
      accent="your documents."
      description="Upload policies, guides, and product docs. Your AI employees retrieve relevant context before every response."
      bullets={[
        "Document upload with automatic chunking and embedding",
        "Semantic search across your knowledge base",
        "Citation-backed responses with source references",
        "Organization-scoped document isolation",
      ]}
      mockVariant="knowledge"
    />
  );
}
