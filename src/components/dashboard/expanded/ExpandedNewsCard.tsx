import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, Clock, Search, Bookmark, Share2, RefreshCw, TrendingUp } from 'lucide-react';
import { useNews } from '@/hooks/useNews';

const categories = ['All', 'Technology', 'Finance', 'Science', 'Health', 'Sports'];

export const ExpandedNewsCard = () => {
  const { news, isLoading, refetch } = useNews();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  const filteredNews = useMemo(() => {
    let filtered = news;
    
    if (searchQuery) {
      filtered = filtered.filter(article => 
        article.title?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(article => 
        article.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }
    
    return filtered;
  }, [news, searchQuery, selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-140px)] gap-6">
      {/* Left - Article list */}
      <div className="w-96 lg:w-[450px] flex-shrink-0 flex flex-col backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                <Newspaper className="w-4 h-4 text-violet-400" />
              </div>
              <span className="text-sm font-medium text-foreground">{news.length} Articles</span>
            </div>
            <button 
              onClick={() => refetch()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search news..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category 
                    ? 'bg-violet-500/20 text-violet-400' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Article list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {filteredNews.map((article, i) => (
            <motion.button
              key={article.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedArticle(article)}
              className={`w-full text-left p-4 rounded-xl transition-all ${
                selectedArticle?.id === article.id 
                  ? 'bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/30' 
                  : 'hover:bg-muted/50 border border-transparent'
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {article.trending && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-400 bg-amber-500/20 rounded">
                        <TrendingUp className="w-3 h-3" />
                        Trending
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{article.category}</span>
                  </div>
                  <h4 className="font-medium text-sm text-foreground line-clamp-2">{article.title}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">{article.source}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {article.time}
                    </span>
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Right - Article view */}
      <div className="flex-1 flex flex-col backdrop-blur-xl bg-background/30 rounded-2xl border border-border/30 overflow-hidden">
        {selectedArticle ? (
          <motion.div
            key={selectedArticle.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Article content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-2 mb-4">
                  {selectedArticle.category && (
                    <span className="inline-block px-2 py-1 text-xs font-medium text-violet-400 bg-violet-500/20 rounded-lg">
                      {selectedArticle.category}
                    </span>
                  )}
                  {selectedArticle.trending && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-400 bg-amber-500/20 rounded-lg">
                      <TrendingUp className="w-3 h-3" />
                      Trending
                    </span>
                  )}
                </div>
                
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground leading-tight">
                  {selectedArticle.title}
                </h1>
                
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span>{selectedArticle.source}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedArticle.time}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-6">
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <Bookmark className="w-4 h-4" />
                    Save
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  {selectedArticle.url && (
                    <a 
                      href={selectedArticle.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-400 bg-violet-500/10 rounded-lg hover:bg-violet-500/20 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Read Full Article
                    </a>
                  )}
                </div>

                <div className="mt-8 prose prose-invert max-w-none">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Click "Read Full Article" to view the complete story on {selectedArticle.source}.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Select an article to read</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};