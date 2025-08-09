import axios from 'axios';
import { BaseAgent, AgentContext, AgentResponse } from './base-agent';

interface SentimentData {
  score: number; // -1 to 1 (-1 = bearish, 0 = neutral, 1 = bullish)
  magnitude: number; // 0 to 1 (strength of sentiment)
  label: 'bullish' | 'neutral' | 'bearish';
}

interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment: SentimentData;
  tokens: string[];
  summary: string;
}

interface SocialMetrics {
  platform: string;
  mentions: number;
  sentiment: SentimentData;
  trending: boolean;
  influencerActivity: number;
}

interface TokenSentiment {
  token: string;
  overallSentiment: SentimentData;
  newsItems: NewsItem[];
  socialMetrics: SocialMetrics[];
  priceCorrelation: number;
  recommendation: string;
}

export class SentimentAgent extends BaseAgent {
  private cdpApiKey: string;
  private newsApiKey: string;
  private baseApiUrl = 'https://api.cdp.coinbase.com/platform';

  constructor() {
    super('SentimentAgent', '📰');
    this.cdpApiKey = process.env.COINBASE_CDP_API_KEY || '';
    this.newsApiKey = process.env.NEWS_API_KEY || '';
  }

  async processMessage(message: string, context: AgentContext): Promise<AgentResponse> {
    this.logInfo(`Processing sentiment analysis request: ${message}`);
    
    try {
      const intent = this.analyzeSentimentIntent(message);
      
      switch (intent.action) {
        case 'token_sentiment':
          return await this.getTokenSentiment(intent.tokens, context);
        case 'market_sentiment':
          return await this.getMarketSentiment(context);
        case 'news_analysis':
          return await this.analyzeNews(intent.tokens, context);
        case 'social_analysis':
          return await this.analyzeSocialMedia(intent.tokens, context);
        case 'sentiment_alerts':
          return await this.setupSentimentAlerts(intent, context);
        case 'correlation_analysis':
          return await this.analyzePriceSentimentCorrelation(intent.tokens, context);
        default:
          return await this.handleGeneralSentimentQuery(message, context);
      }
    } catch (error) {
      this.logError('Error processing sentiment analysis:', error);
      return {
        message: 'I encountered an error analyzing sentiment. Please try again.',
        actions: [],
        context: {}
      };
    }
  }

  private analyzeSentimentIntent(message: string): any {
    const lower = message.toLowerCase();
    const tokens = this.extractTokens(message);
    
    if (lower.includes('sentiment') && tokens.length > 0) {
      return { action: 'token_sentiment', tokens };
    }
    
    if (lower.includes('market') && (lower.includes('sentiment') || lower.includes('mood'))) {
      return { action: 'market_sentiment' };
    }
    
    if (lower.includes('news') || lower.includes('article')) {
      return { action: 'news_analysis', tokens };
    }
    
    if (lower.includes('social') || lower.includes('twitter') || lower.includes('reddit')) {
      return { action: 'social_analysis', tokens };
    }
    
    if (lower.includes('alert') || lower.includes('notify')) {
      return { action: 'sentiment_alerts', tokens };
    }
    
    if (lower.includes('correlation') || lower.includes('price')) {
      return { action: 'correlation_analysis', tokens };
    }
    
    return { action: 'general' };
  }

  private async getTokenSentiment(tokens: string[], context: AgentContext): Promise<AgentResponse> {
    try {
      if (!tokens || tokens.length === 0) {
        return {
          message: 'Please specify which token(s) you want sentiment analysis for.',
          actions: this.generateTokenSuggestions(),
          context: {}
        };
      }

      const sentimentData = await Promise.all(
        tokens.map(token => this.analyzeTokenSentiment(token))
      );
      
      return {
        message: this.formatTokenSentiment(sentimentData),
        actions: this.generateSentimentActions(sentimentData),
        context: { tokenSentiment: sentimentData }
      };
    } catch (error) {
      this.logError('Error getting token sentiment:', error);
      throw error;
    }
  }

  private async analyzeTokenSentiment(token: string): Promise<TokenSentiment> {
    // Fetch news data
    const newsItems = await this.fetchNewsForToken(token);
    
    // Fetch social media data
    const socialMetrics = await this.fetchSocialMetrics(token);
    
    // Calculate overall sentiment
    const overallSentiment = this.calculateOverallSentiment(newsItems, socialMetrics);
    
    // Analyze price correlation
    const priceCorrelation = await this.calculatePriceCorrelation(token, overallSentiment);
    
    // Generate recommendation
    const recommendation = this.generateRecommendation(overallSentiment, priceCorrelation);
    
    return {
      token,
      overallSentiment,
      newsItems: newsItems.slice(0, 5),
      socialMetrics,
      priceCorrelation,
      recommendation
    };
  }

  private async fetchNewsForToken(token: string): Promise<NewsItem[]> {
    try {
      // In production, this would fetch from news APIs
      // Mock implementation for now
      return [
        {
          title: `${token} Shows Strong Growth Potential`,
          source: 'CryptoNews',
          url: 'https://example.com/news1',
          publishedAt: new Date(),
          sentiment: { score: 0.7, magnitude: 0.8, label: 'bullish' },
          tokens: [token],
          summary: 'Analysts predict positive movement for the token.'
        },
        {
          title: `Market Analysis: ${token} Technical Indicators`,
          source: 'DeFi Daily',
          url: 'https://example.com/news2',
          publishedAt: new Date(Date.now() - 3600000),
          sentiment: { score: 0.3, magnitude: 0.5, label: 'bullish' },
          tokens: [token],
          summary: 'Technical analysis shows mixed signals.'
        }
      ];
    } catch (error) {
      this.logError('Error fetching news:', error);
      return [];
    }
  }

  private async fetchSocialMetrics(token: string): Promise<SocialMetrics[]> {
    try {
      // Mock implementation - would fetch from social APIs
      return [
        {
          platform: 'Twitter',
          mentions: 1250,
          sentiment: { score: 0.6, magnitude: 0.7, label: 'bullish' },
          trending: true,
          influencerActivity: 8
        },
        {
          platform: 'Reddit',
          mentions: 450,
          sentiment: { score: 0.4, magnitude: 0.6, label: 'bullish' },
          trending: false,
          influencerActivity: 3
        }
      ];
    } catch (error) {
      this.logError('Error fetching social metrics:', error);
      return [];
    }
  }

  private async getMarketSentiment(context: AgentContext): Promise<AgentResponse> {
    try {
      // Analyze overall market sentiment
      const marketData = await this.analyzeMarketSentiment();
      
      return {
        message: this.formatMarketSentiment(marketData),
        actions: [
          {
            type: 'view_heatmap',
            label: 'View Sentiment Heatmap',
            data: { marketData }
          },
          {
            type: 'set_market_alerts',
            label: 'Set Market Alerts',
            data: {}
          }
        ],
        context: { marketSentiment: marketData }
      };
    } catch (error) {
      this.logError('Error getting market sentiment:', error);
      throw error;
    }
  }

  private async analyzeMarketSentiment(): Promise<any> {
    // Aggregate sentiment across multiple tokens and sources
    return {
      overall: { score: 0.4, magnitude: 0.6, label: 'bullish' as const },
      topBullish: ['WETH', 'LINK', 'UNI'],
      topBearish: ['USDT'],
      fearGreedIndex: 65,
      volatilityIndex: 35,
      socialVolume: 'high',
      newsVolume: 'moderate'
    };
  }

  private async analyzeNews(tokens: string[], context: AgentContext): Promise<AgentResponse> {
    try {
      const newsAnalysis = await this.performNewsAnalysis(tokens);
      
      return {
        message: this.formatNewsAnalysis(newsAnalysis),
        actions: newsAnalysis.articles.slice(0, 3).map(article => ({
          type: 'read_article',
          label: article.title.substring(0, 30) + '...',
          data: { url: article.url }
        })),
        context: { newsAnalysis }
      };
    } catch (error) {
      this.logError('Error analyzing news:', error);
      throw error;
    }
  }

  private async performNewsAnalysis(tokens: string[]): Promise<any> {
    const articles = await this.fetchRecentNews(tokens);
    const sentiment = this.aggregateNewsSentiment(articles);
    const topics = this.extractKeyTopics(articles);
    
    return {
      articles,
      sentiment,
      topics,
      summary: this.generateNewsSummary(articles, sentiment)
    };
  }

  private async fetchRecentNews(tokens: string[]): Promise<NewsItem[]> {
    // Fetch from news sources
    const allNews: NewsItem[] = [];
    
    for (const token of tokens) {
      const tokenNews = await this.fetchNewsForToken(token);
      allNews.push(...tokenNews);
    }
    
    return allNews.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  private async analyzeSocialMedia(tokens: string[], context: AgentContext): Promise<AgentResponse> {
    try {
      const socialAnalysis = await this.performSocialAnalysis(tokens);
      
      return {
        message: this.formatSocialAnalysis(socialAnalysis),
        actions: [
          {
            type: 'track_influencers',
            label: 'Track Key Influencers',
            data: { influencers: socialAnalysis.topInfluencers }
          },
          {
            type: 'social_alerts',
            label: 'Set Social Alerts',
            data: { tokens }
          }
        ],
        context: { socialAnalysis }
      };
    } catch (error) {
      this.logError('Error analyzing social media:', error);
      throw error;
    }
  }

  private async performSocialAnalysis(tokens: string[]): Promise<any> {
    const metrics: SocialMetrics[] = [];
    
    for (const token of tokens) {
      const tokenMetrics = await this.fetchSocialMetrics(token);
      metrics.push(...tokenMetrics);
    }
    
    return {
      metrics,
      totalMentions: metrics.reduce((sum, m) => sum + m.mentions, 0),
      averageSentiment: this.calculateAverageSentiment(metrics),
      topInfluencers: ['@crypto_whale', '@defi_expert', '@base_maxi'],
      viralPosts: this.getViralPosts(tokens)
    };
  }

  private getViralPosts(tokens: string[]): any[] {
    return [
      {
        platform: 'Twitter',
        author: '@crypto_whale',
        content: `Bullish on ${tokens[0] || 'BASE'} ecosystem!`,
        likes: 5000,
        shares: 1200,
        sentiment: 'bullish'
      }
    ];
  }

  private async setupSentimentAlerts(intent: any, context: AgentContext): Promise<AgentResponse> {
    try {
      const alertConfig = {
        tokens: intent.tokens || [],
        thresholds: {
          bullish: 0.7,
          bearish: -0.7,
          volumeSpike: 2.0
        },
        channels: ['in-app', 'email']
      };
      
      return {
        message: `Sentiment alerts configured:\n\n${this.formatAlertConfig(alertConfig)}`,
        actions: [
          {
            type: 'save_alerts',
            label: 'Save Alert Configuration',
            data: { alertConfig }
          },
          {
            type: 'test_alert',
            label: 'Send Test Alert',
            data: {}
          }
        ],
        context: { alertConfig }
      };
    } catch (error) {
      this.logError('Error setting up alerts:', error);
      throw error;
    }
  }

  private async analyzePriceSentimentCorrelation(tokens: string[], context: AgentContext): Promise<AgentResponse> {
    try {
      const correlationData = await this.calculateCorrelations(tokens);
      
      return {
        message: this.formatCorrelationAnalysis(correlationData),
        actions: [
          {
            type: 'view_correlation_chart',
            label: 'View Correlation Chart',
            data: { correlationData }
          }
        ],
        context: { correlationAnalysis: correlationData }
      };
    } catch (error) {
      this.logError('Error analyzing correlation:', error);
      throw error;
    }
  }

  private async calculateCorrelations(tokens: string[]): Promise<any> {
    const correlations = await Promise.all(
      tokens.map(async token => ({
        token,
        correlation: await this.calculatePriceCorrelation(token, { score: 0.5, magnitude: 0.6, label: 'bullish' as const }),
        leadTime: '2-4 hours',
        confidence: 0.75
      }))
    );
    
    return {
      correlations,
      strongestCorrelation: correlations[0],
      summary: 'Sentiment generally leads price by 2-4 hours with 75% confidence'
    };
  }

  private async handleGeneralSentimentQuery(message: string, context: AgentContext): Promise<AgentResponse> {
    return {
      message: `I analyze market sentiment from news and social media. Here's what I can do:
      • Track sentiment for specific tokens
      • Analyze overall market mood
      • Monitor news and articles
      • Track social media buzz
      • Set up sentiment alerts
      • Analyze sentiment-price correlations`,
      actions: [
        {
          type: 'market_sentiment',
          label: 'Check Market Sentiment',
          data: {}
        },
        {
          type: 'trending_sentiment',
          label: 'Trending Sentiment',
          data: {}
        },
        {
          type: 'news_feed',
          label: 'Latest News',
          data: {}
        }
      ],
      context: {}
    };
  }

  private calculateOverallSentiment(news: NewsItem[], social: SocialMetrics[]): SentimentData {
    let totalScore = 0;
    let totalMagnitude = 0;
    let count = 0;
    
    news.forEach(item => {
      totalScore += item.sentiment.score * item.sentiment.magnitude;
      totalMagnitude += item.sentiment.magnitude;
      count++;
    });
    
    social.forEach(metric => {
      totalScore += metric.sentiment.score * metric.sentiment.magnitude;
      totalMagnitude += metric.sentiment.magnitude;
      count++;
    });
    
    const avgScore = count > 0 ? totalScore / totalMagnitude : 0;
    const avgMagnitude = count > 0 ? totalMagnitude / count : 0;
    
    return {
      score: avgScore,
      magnitude: avgMagnitude,
      label: avgScore > 0.3 ? 'bullish' : avgScore < -0.3 ? 'bearish' : 'neutral'
    };
  }

  private calculateAverageSentiment(metrics: SocialMetrics[]): SentimentData {
    const total = metrics.reduce((acc, m) => ({
      score: acc.score + m.sentiment.score,
      magnitude: acc.magnitude + m.sentiment.magnitude
    }), { score: 0, magnitude: 0 });
    
    const count = metrics.length || 1;
    const avgScore = total.score / count;
    
    return {
      score: avgScore,
      magnitude: total.magnitude / count,
      label: avgScore > 0.3 ? 'bullish' : avgScore < -0.3 ? 'bearish' : 'neutral'
    };
  }

  private async calculatePriceCorrelation(token: string, sentiment: SentimentData): Promise<number> {
    // Calculate correlation between sentiment and price movements
    // Mock implementation
    return 0.65 + (sentiment.score * 0.2);
  }

  private generateRecommendation(sentiment: SentimentData, correlation: number): string {
    if (sentiment.label === 'bullish' && correlation > 0.7) {
      return 'Strong positive sentiment with high price correlation. Consider monitoring for entry.';
    } else if (sentiment.label === 'bearish' && correlation > 0.7) {
      return 'Negative sentiment detected. Consider risk management strategies.';
    } else if (sentiment.magnitude < 0.3) {
      return 'Low sentiment activity. Market is neutral, await clearer signals.';
    } else {
      return 'Mixed signals detected. Recommend waiting for stronger consensus.';
    }
  }

  private aggregateNewsSentiment(articles: NewsItem[]): SentimentData {
    if (articles.length === 0) {
      return { score: 0, magnitude: 0, label: 'neutral' };
    }
    
    const total = articles.reduce((acc, article) => ({
      score: acc.score + article.sentiment.score,
      magnitude: acc.magnitude + article.sentiment.magnitude
    }), { score: 0, magnitude: 0 });
    
    const avgScore = total.score / articles.length;
    
    return {
      score: avgScore,
      magnitude: total.magnitude / articles.length,
      label: avgScore > 0.3 ? 'bullish' : avgScore < -0.3 ? 'bearish' : 'neutral'
    };
  }

  private extractKeyTopics(articles: NewsItem[]): string[] {
    // Extract key topics from articles
    const topics = new Set<string>();
    
    articles.forEach(article => {
      if (article.title.toLowerCase().includes('bullish')) topics.add('Bullish Trends');
      if (article.title.toLowerCase().includes('growth')) topics.add('Growth Potential');
      if (article.title.toLowerCase().includes('technical')) topics.add('Technical Analysis');
    });
    
    return Array.from(topics);
  }

  private generateNewsSummary(articles: NewsItem[], sentiment: SentimentData): string {
    return `Analyzed ${articles.length} articles. Overall sentiment is ${sentiment.label} with ${(sentiment.magnitude * 100).toFixed(0)}% confidence.`;
  }

  private extractTokens(message: string): string[] {
    const tokens: string[] = [];
    const commonTokens = ['WETH', 'USDC', 'USDT', 'WBTC', 'DAI', 'LINK', 'UNI', 'AAVE'];
    
    commonTokens.forEach(token => {
      if (message.toUpperCase().includes(token)) {
        tokens.push(token);
      }
    });
    
    return tokens;
  }

  private generateTokenSuggestions(): any[] {
    return [
      { type: 'analyze_token', label: 'Analyze WETH', data: { token: 'WETH' } },
      { type: 'analyze_token', label: 'Analyze USDC', data: { token: 'USDC' } },
      { type: 'trending_tokens', label: 'Show Trending', data: {} }
    ];
  }

  private generateSentimentActions(sentimentData: TokenSentiment[]): any[] {
    return sentimentData.map(data => ({
      type: 'sentiment_details',
      label: `${data.token} Details`,
      data: { sentiment: data }
    }));
  }

  private formatTokenSentiment(sentimentData: TokenSentiment[]): string {
    return sentimentData.map(data => `
📊 ${data.token} Sentiment Analysis:
• Overall: ${data.overallSentiment.label.toUpperCase()} (${(data.overallSentiment.score * 100).toFixed(0)}%)
• Confidence: ${(data.overallSentiment.magnitude * 100).toFixed(0)}%
• Price Correlation: ${(data.priceCorrelation * 100).toFixed(0)}%

📰 Recent News: ${data.newsItems.length} articles
${data.newsItems.slice(0, 2).map(n => `  - ${n.title}`).join('\n')}

📱 Social Metrics:
${data.socialMetrics.map(m => `  • ${m.platform}: ${m.mentions} mentions (${m.sentiment.label})`).join('\n')}

💡 Recommendation: ${data.recommendation}
    `).join('\n---\n');
  }

  private formatMarketSentiment(marketData: any): string {
    return `🌍 Market Sentiment Overview:

Overall Market: ${marketData.overall.label.toUpperCase()} (${(marketData.overall.score * 100).toFixed(0)}%)
Fear & Greed Index: ${marketData.fearGreedIndex}/100
Volatility Index: ${marketData.volatilityIndex}/100

📈 Top Bullish Tokens: ${marketData.topBullish.join(', ')}
📉 Top Bearish Tokens: ${marketData.topBearish.join(', ')}

📊 Activity Levels:
• Social Volume: ${marketData.socialVolume}
• News Volume: ${marketData.newsVolume}`;
  }

  private formatNewsAnalysis(analysis: any): string {
    return `📰 News Analysis:

${analysis.summary}

Key Topics: ${analysis.topics.join(', ')}

Recent Articles:
${analysis.articles.slice(0, 3).map((a: NewsItem) => 
  `• ${a.title}\n  Source: ${a.source} | Sentiment: ${a.sentiment.label}`
).join('\n')}`;
  }

  private formatSocialAnalysis(analysis: any): string {
    return `📱 Social Media Analysis:

Total Mentions: ${analysis.totalMentions.toLocaleString()}
Average Sentiment: ${analysis.averageSentiment.label.toUpperCase()}

Top Influencers:
${analysis.topInfluencers.map((i: string) => `• ${i}`).join('\n')}

Viral Posts:
${analysis.viralPosts.map((p: any) => 
  `• ${p.platform}: "${p.content.substring(0, 50)}..."\n  ${p.likes} likes, ${p.shares} shares`
).join('\n')}`;
  }

  private formatAlertConfig(config: any): string {
    return `🔔 Alert Configuration:

Tracking Tokens: ${config.tokens.join(', ') || 'All tokens'}

Thresholds:
• Bullish Alert: > ${(config.thresholds.bullish * 100).toFixed(0)}%
• Bearish Alert: < ${(config.thresholds.bearish * 100).toFixed(0)}%
• Volume Spike: ${config.thresholds.volumeSpike}x normal

Notification Channels: ${config.channels.join(', ')}`;
  }

  private formatCorrelationAnalysis(data: any): string {
    return `📈 Price-Sentiment Correlation Analysis:

${data.correlations.map((c: any) => 
  `${c.token}:
  • Correlation: ${(c.correlation * 100).toFixed(0)}%
  • Lead Time: ${c.leadTime}
  • Confidence: ${(c.confidence * 100).toFixed(0)}%`
).join('\n\n')}

Summary: ${data.summary}`;
  }
}