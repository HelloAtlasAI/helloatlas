import { useState, useMemo, useCallback, useEffect } from 'react';
import { useDebouncedValue } from './useDebouncedValue';
import { useAtlasKnowledge } from './useAtlasKnowledge';
import { useAtlasResearch } from './useAtlasResearch';

export type BrainResultType = 'knowledge' | 'research' | 'finding';

export interface BrainSearchResult {
  id: string;
  type: BrainResultType;
  title: string;
  preview: string;
  category?: string;
  confidence?: number;
  status?: string;
  createdAt: string;
  metadata: Record<string, unknown>;
  matchScore: number;
}

export interface BrainSearchOptions {
  types?: BrainResultType[];
  categories?: string[];
  minConfidence?: number;
  limit?: number;
}

const highlightMatch = (text: string, query: string): string => {
  if (!query || !text) return text;
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  let result = text;
  words.forEach(word => {
    const regex = new RegExp(`(${word})`, 'gi');
    result = result.replace(regex, '**$1**');
  });
  return result;
};

const calculateMatchScore = (item: { title: string; content: string }, query: string): number => {
  if (!query) return 0;
  
  const queryLower = query.toLowerCase();
  const titleLower = item.title.toLowerCase();
  const contentLower = item.content.toLowerCase();
  
  let score = 0;
  
  // Exact title match = highest score
  if (titleLower === queryLower) score += 100;
  else if (titleLower.includes(queryLower)) score += 50;
  
  // Word matches
  const words = queryLower.split(/\s+/).filter(Boolean);
  words.forEach(word => {
    if (titleLower.includes(word)) score += 20;
    if (contentLower.includes(word)) score += 5;
  });
  
  return score;
};

const extractContent = (content: unknown): string => {
  if (typeof content === 'string') return content;
  if (typeof content === 'object' && content !== null) {
    const obj = content as Record<string, unknown>;
    // Try common content fields
    if (typeof obj.summary === 'string') return obj.summary;
    if (typeof obj.text === 'string') return obj.text;
    if (typeof obj.description === 'string') return obj.description;
    // Stringify for searching
    return JSON.stringify(content).slice(0, 500);
  }
  return '';
};

export const useBrainSearch = (options: BrainSearchOptions = {}) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 200);
  
  const { knowledge, isLoading: knowledgeLoading, categories: knowledgeCategories } = useAtlasKnowledge();
  const { topics, isLoading: researchLoading } = useAtlasResearch();
  
  const { types = ['knowledge', 'research', 'finding'], categories, minConfidence = 0, limit = 50 } = options;
  
  const isLoading = knowledgeLoading || researchLoading;
  
  const results = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    
    const allResults: BrainSearchResult[] = [];
    const queryLower = debouncedQuery.toLowerCase();
    
    // Search knowledge entries
    if (types.includes('knowledge')) {
      knowledge.forEach(entry => {
        const contentStr = extractContent(entry.content);
        const searchableText = `${entry.topic} ${contentStr} ${entry.category}`.toLowerCase();
        
        if (!searchableText.includes(queryLower)) {
          // Check for partial word matches
          const words = queryLower.split(/\s+/).filter(Boolean);
          const hasMatch = words.some(word => searchableText.includes(word));
          if (!hasMatch) return;
        }
        
        if (categories && categories.length > 0 && !categories.includes(entry.category)) return;
        if (entry.confidence < minConfidence) return;
        
        const matchScore = calculateMatchScore({ title: entry.topic, content: contentStr }, debouncedQuery);
        
        allResults.push({
          id: entry.id,
          type: 'knowledge',
          title: entry.topic,
          preview: highlightMatch(contentStr.slice(0, 200), debouncedQuery),
          category: entry.category,
          confidence: entry.confidence,
          createdAt: entry.created_at,
          metadata: {
            source: entry.source,
            accessCount: entry.access_count,
            relevanceScore: entry.relevance_score,
          },
          matchScore,
        });
      });
    }
    
    // Search research topics
    if (types.includes('research')) {
      topics.forEach(topic => {
        const searchableText = `${topic.topic} ${topic.description || ''}`.toLowerCase();
        
        if (!searchableText.includes(queryLower)) {
          const words = queryLower.split(/\s+/).filter(Boolean);
          const hasMatch = words.some(word => searchableText.includes(word));
          if (!hasMatch) return;
        }
        
        const matchScore = calculateMatchScore({ 
          title: topic.topic, 
          content: topic.description || '' 
        }, debouncedQuery);
        
        allResults.push({
          id: topic.id,
          type: 'research',
          title: topic.topic,
          preview: highlightMatch(topic.description?.slice(0, 200) || 'No description', debouncedQuery),
          status: topic.status,
          createdAt: topic.created_at,
          metadata: {
            findings: topic.findings,
            sources: topic.sources,
            depthLevel: topic.depth_level,
          },
          matchScore,
        });
      });
    }
    
    // Search findings within research topics
    if (types.includes('finding')) {
      topics.forEach(topic => {
        const findings = topic.findings as unknown[];
        if (!Array.isArray(findings)) return;
        
        findings.forEach((finding, index) => {
          const findingStr = typeof finding === 'string' 
            ? finding 
            : JSON.stringify(finding);
          
          if (!findingStr.toLowerCase().includes(queryLower)) {
            const words = queryLower.split(/\s+/).filter(Boolean);
            const hasMatch = words.some(word => findingStr.toLowerCase().includes(word));
            if (!hasMatch) return;
          }
          
          const matchScore = calculateMatchScore({ 
            title: `Finding from: ${topic.topic}`, 
            content: findingStr 
          }, debouncedQuery);
          
          allResults.push({
            id: `${topic.id}-finding-${index}`,
            type: 'finding',
            title: `Finding from: ${topic.topic}`,
            preview: highlightMatch(findingStr.slice(0, 200), debouncedQuery),
            createdAt: topic.created_at,
            metadata: {
              parentTopicId: topic.id,
              parentTopic: topic.topic,
              findingIndex: index,
            },
            matchScore,
          });
        });
      });
    }
    
    // Sort by match score and limit
    return allResults
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }, [debouncedQuery, knowledge, topics, types, categories, minConfidence, limit]);
  
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    knowledgeCategories.forEach(c => cats.add(c));
    return Array.from(cats).sort();
  }, [knowledgeCategories]);
  
  const resultsByType = useMemo(() => {
    return {
      knowledge: results.filter(r => r.type === 'knowledge'),
      research: results.filter(r => r.type === 'research'),
      finding: results.filter(r => r.type === 'finding'),
    };
  }, [results]);
  
  const clearSearch = useCallback(() => {
    setQuery('');
  }, []);
  
  return {
    query,
    setQuery,
    results,
    resultsByType,
    isLoading,
    isSearching: query !== debouncedQuery,
    allCategories,
    totalResults: results.length,
    clearSearch,
  };
};
