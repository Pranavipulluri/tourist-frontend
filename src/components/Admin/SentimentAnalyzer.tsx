import React, { useEffect, useState } from 'react';
import './SentimentAnalyzer.css';

interface TouristFeedback {
  id: string;
  touristId: string;
  touristName: string;
  nationality: string;
  visitDate: string;
  location: string;
  rating: number; // 1-5
  comment: string;
  category: 'SAFETY' | 'SERVICE' | 'FACILITIES' | 'NAVIGATION' | 'EMERGENCY_RESPONSE' | 'OVERALL_EXPERIENCE';
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  sentimentScore: number; // -1 to 1
  language: string;
  translatedComment?: string;
  keywords: string[];
  emotions: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
    disgust: number;
  };
  reviewHelpful: number;
  officialResponse?: string;
  responseDate?: string;
  status: 'NEW' | 'REVIEWED' | 'RESPONDED' | 'ESCALATED' | 'RESOLVED';
}

interface SentimentTrend {
  date: string;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
  averageRating: number;
  totalFeedbacks: number;
}

interface EmotionAnalysis {
  location: string;
  dominantEmotion: string;
  emotionScores: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
    disgust: number;
  };
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
}

interface LanguageDistribution {
  language: string;
  count: number;
  averageSentiment: number;
  commonIssues: string[];
}

interface SentimentAlert {
  id: string;
  timestamp: string;
  location: string;
  alertType: 'NEGATIVE_SPIKE' | 'SAFETY_CONCERN' | 'SERVICE_ISSUE' | 'EMERGENCY_MENTION';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedFeedbacks: number;
  averageSentiment: number;
  keywordTriggers: string[];
  recommendedActions: string[];
}

export const SentimentAnalyzer: React.FC = () => {
  const [touristFeedbacks, setTouristFeedbacks] = useState<TouristFeedback[]>([]);
  const [sentimentTrends, setSentimentTrends] = useState<SentimentTrend[]>([]);
  const [emotionAnalysis, setEmotionAnalysis] = useState<EmotionAnalysis[]>([]);
  const [languageDistribution, setLanguageDistribution] = useState<LanguageDistribution[]>([]);
  const [sentimentAlerts, setSentimentAlerts] = useState<SentimentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'feedbacks' | 'trends' | 'emotions' | 'alerts' | 'insights'>('overview');
  const [filterSentiment, setFilterSentiment] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterRating, setFilterRating] = useState('ALL');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateRange, setDateRange] = useState('7d');

  useEffect(() => {
    loadSentimentData();
    
    // Set up real-time updates every 2 minutes
    const interval = setInterval(loadSentimentData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [dateRange]);

  const loadSentimentData = async () => {
    try {
      setLoading(true);
      
      // Mock comprehensive sentiment analysis data
      const mockFeedbacks: TouristFeedback[] = [
        {
          id: '1',
          touristId: 'tourist_001',
          touristName: 'John Smith',
          nationality: 'USA',
          visitDate: new Date(Date.now() - 86400000).toISOString(),
          location: 'Red Fort',
          rating: 4,
          comment: 'Amazing historical site! The security was very helpful and made us feel safe throughout our visit. The only issue was the crowd management during peak hours.',
          category: 'SAFETY',
          sentiment: 'POSITIVE',
          sentimentScore: 0.7,
          language: 'English',
          keywords: ['amazing', 'security', 'helpful', 'safe', 'crowd management', 'peak hours'],
          emotions: {
            joy: 0.8,
            anger: 0.1,
            fear: 0.1,
            sadness: 0.0,
            surprise: 0.6,
            disgust: 0.0
          },
          reviewHelpful: 23,
          officialResponse: 'Thank you for your feedback! We are working on improving crowd management during peak hours.',
          responseDate: new Date(Date.now() - 43200000).toISOString(),
          status: 'RESPONDED'
        },
        {
          id: '2',
          touristId: 'tourist_002',
          touristName: 'Maria Garcia',
          nationality: 'Spain',
          visitDate: new Date(Date.now() - 172800000).toISOString(),
          location: 'India Gate',
          rating: 2,
          comment: 'La experiencia fue decepcionante. Los oficiales de seguridad no hablaban inglés y nos sentimos perdidos. También hubo un incidente menor que no fue manejado bien.',
          category: 'SERVICE',
          sentiment: 'NEGATIVE',
          sentimentScore: -0.6,
          language: 'Spanish',
          translatedComment: 'The experience was disappointing. Security officers did not speak English and we felt lost. There was also a minor incident that was not handled well.',
          keywords: ['disappointing', 'security', 'language barrier', 'lost', 'incident', 'not handled well'],
          emotions: {
            joy: 0.0,
            anger: 0.7,
            fear: 0.4,
            sadness: 0.5,
            surprise: 0.2,
            disgust: 0.3
          },
          reviewHelpful: 12,
          status: 'ESCALATED'
        },
        {
          id: '3',
          touristId: 'tourist_003',
          touristName: 'Kenji Tanaka',
          nationality: 'Japan',
          visitDate: new Date(Date.now() - 259200000).toISOString(),
          location: 'Lotus Temple',
          rating: 5,
          comment: '素晴らしい体験でした！警備員の方々がとても親切で、日本語で話しかけてくれました。安全で平和な環境で、心配することなく楽しめました。',
          category: 'OVERALL_EXPERIENCE',
          sentiment: 'POSITIVE',
          sentimentScore: 0.9,
          language: 'Japanese',
          translatedComment: 'It was a wonderful experience! The security guards were very kind and spoke to us in Japanese. It was a safe and peaceful environment where we could enjoy without worry.',
          keywords: ['wonderful', 'security guards', 'kind', 'Japanese', 'safe', 'peaceful', 'enjoy'],
          emotions: {
            joy: 0.9,
            anger: 0.0,
            fear: 0.0,
            sadness: 0.0,
            surprise: 0.7,
            disgust: 0.0
          },
          reviewHelpful: 31,
          officialResponse: 'Thank you for your wonderful feedback! We are proud of our multilingual security team.',
          responseDate: new Date(Date.now() - 172800000).toISOString(),
          status: 'RESPONDED'
        },
        {
          id: '4',
          touristId: 'tourist_004',
          touristName: 'Ahmed Hassan',
          nationality: 'Egypt',
          visitDate: new Date(Date.now() - 345600000).toISOString(),
          location: 'Qutub Minar',
          rating: 3,
          comment: 'الموقع جميل لكن كان هناك نقص في اللافتات الإرشادية. كان من الصعب العثور على المرافق وخدمات الطوارئ. الأمن كان موجوداً لكن غير واضح.',
          category: 'NAVIGATION',
          sentiment: 'NEUTRAL',
          sentimentScore: 0.1,
          language: 'Arabic',
          translatedComment: 'The site is beautiful but there was a lack of directional signs. It was difficult to find facilities and emergency services. Security was present but not clear.',
          keywords: ['beautiful site', 'lack of signs', 'difficult to find', 'facilities', 'emergency services', 'security present'],
          emotions: {
            joy: 0.3,
            anger: 0.3,
            fear: 0.2,
            sadness: 0.1,
            surprise: 0.0,
            disgust: 0.1
          },
          reviewHelpful: 8,
          status: 'REVIEWED'
        },
        {
          id: '5',
          touristId: 'tourist_005',
          touristName: 'Emma Thompson',
          nationality: 'UK',
          visitDate: new Date(Date.now() - 432000000).toISOString(),
          location: 'Chandni Chowk',
          rating: 1,
          comment: 'Terrible experience! I felt very unsafe in the area. There was pickpocketing incident and the response was slow. Need much better security presence and faster emergency response.',
          category: 'SAFETY',
          sentiment: 'NEGATIVE',
          sentimentScore: -0.8,
          language: 'English',
          keywords: ['terrible', 'unsafe', 'pickpocketing', 'slow response', 'better security', 'emergency response'],
          emotions: {
            joy: 0.0,
            anger: 0.8,
            fear: 0.9,
            sadness: 0.3,
            surprise: 0.1,
            disgust: 0.6
          },
          reviewHelpful: 45,
          status: 'ESCALATED'
        }
      ];

      const mockTrends: SentimentTrend[] = [
        {
          date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
          positiveCount: 45,
          negativeCount: 12,
          neutralCount: 8,
          averageRating: 4.1,
          totalFeedbacks: 65
        },
        {
          date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
          positiveCount: 52,
          negativeCount: 8,
          neutralCount: 12,
          averageRating: 4.3,
          totalFeedbacks: 72
        },
        {
          date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0],
          positiveCount: 38,
          negativeCount: 18,
          neutralCount: 9,
          averageRating: 3.8,
          totalFeedbacks: 65
        },
        {
          date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
          positiveCount: 41,
          negativeCount: 15,
          neutralCount: 11,
          averageRating: 3.9,
          totalFeedbacks: 67
        },
        {
          date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
          positiveCount: 49,
          negativeCount: 9,
          neutralCount: 7,
          averageRating: 4.2,
          totalFeedbacks: 65
        },
        {
          date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
          positiveCount: 43,
          negativeCount: 14,
          neutralCount: 10,
          averageRating: 4.0,
          totalFeedbacks: 67
        },
        {
          date: new Date().toISOString().split('T')[0],
          positiveCount: 28,
          negativeCount: 8,
          neutralCount: 6,
          averageRating: 4.1,
          totalFeedbacks: 42
        }
      ];

      const mockEmotionAnalysis: EmotionAnalysis[] = [
        {
          location: 'Red Fort',
          dominantEmotion: 'Joy',
          emotionScores: {
            joy: 0.7,
            anger: 0.15,
            fear: 0.1,
            sadness: 0.05,
            surprise: 0.6,
            disgust: 0.08
          },
          riskLevel: 'LOW',
          recommendations: [
            'Maintain current service levels',
            'Address minor crowd management issues',
            'Continue security presence during peak hours'
          ]
        },
        {
          location: 'Chandni Chowk',
          dominantEmotion: 'Fear',
          emotionScores: {
            joy: 0.2,
            anger: 0.6,
            fear: 0.8,
            sadness: 0.3,
            surprise: 0.1,
            disgust: 0.4
          },
          riskLevel: 'HIGH',
          recommendations: [
            'Immediate increase in security patrols',
            'Implement anti-theft measures',
            'Improve emergency response times',
            'Add more CCTV coverage',
            'Deploy plainclothes security officers'
          ]
        },
        {
          location: 'India Gate',
          dominantEmotion: 'Sadness',
          emotionScores: {
            joy: 0.3,
            anger: 0.4,
            fear: 0.3,
            sadness: 0.5,
            surprise: 0.2,
            disgust: 0.3
          },
          riskLevel: 'MEDIUM',
          recommendations: [
            'Improve multilingual support',
            'Enhance service quality training',
            'Better incident management protocols',
            'Regular staff language training'
          ]
        },
        {
          location: 'Lotus Temple',
          dominantEmotion: 'Joy',
          emotionScores: {
            joy: 0.9,
            anger: 0.05,
            fear: 0.05,
            sadness: 0.02,
            surprise: 0.7,
            disgust: 0.03
          },
          riskLevel: 'LOW',
          recommendations: [
            'Continue excellent service standards',
            'Share best practices with other locations',
            'Maintain multilingual staff capabilities'
          ]
        }
      ];

      const mockLanguageDistribution: LanguageDistribution[] = [
        {
          language: 'English',
          count: 180,
          averageSentiment: 0.3,
          commonIssues: ['Crowd management', 'Navigation', 'Emergency response speed']
        },
        {
          language: 'Spanish',
          count: 45,
          averageSentiment: -0.2,
          commonIssues: ['Language barrier', 'Service quality', 'Information availability']
        },
        {
          language: 'French',
          count: 38,
          averageSentiment: 0.1,
          commonIssues: ['Signage clarity', 'Staff communication', 'Facility cleanliness']
        },
        {
          language: 'German',
          count: 29,
          averageSentiment: 0.4,
          commonIssues: ['Operating hours', 'Ticket procedures', 'Group tour management']
        },
        {
          language: 'Japanese',
          count: 24,
          averageSentiment: 0.6,
          commonIssues: ['Cultural sensitivity', 'Photography restrictions', 'Food options']
        },
        {
          language: 'Arabic',
          count: 21,
          averageSentiment: 0.0,
          commonIssues: ['Prayer facilities', 'Directional signs', 'Security visibility']
        },
        {
          language: 'Chinese',
          count: 19,
          averageSentiment: 0.2,
          commonIssues: ['Payment methods', 'Tour guide availability', 'WiFi access']
        }
      ];

      const mockSentimentAlerts: SentimentAlert[] = [
        {
          id: '1',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          location: 'Chandni Chowk',
          alertType: 'SAFETY_CONCERN',
          severity: 'HIGH',
          description: 'Multiple negative feedbacks mentioning safety concerns and theft incidents',
          affectedFeedbacks: 8,
          averageSentiment: -0.7,
          keywordTriggers: ['unsafe', 'pickpocketing', 'theft', 'slow response', 'security'],
          recommendedActions: [
            'Deploy additional security personnel immediately',
            'Investigate recent theft incidents',
            'Review and improve emergency response protocols',
            'Increase CCTV monitoring in the area'
          ]
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          location: 'India Gate',
          alertType: 'SERVICE_ISSUE',
          severity: 'MEDIUM',
          description: 'Language barrier issues reported by international tourists',
          affectedFeedbacks: 5,
          averageSentiment: -0.4,
          keywordTriggers: ['language barrier', 'communication', 'understanding', 'help'],
          recommendedActions: [
            'Provide language training for staff',
            'Deploy multilingual volunteers',
            'Install multilingual information boards',
            'Create digital translation assistance'
          ]
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          location: 'Red Fort',
          alertType: 'NEGATIVE_SPIKE',
          severity: 'LOW',
          description: 'Slight increase in complaints about crowd management',
          affectedFeedbacks: 3,
          averageSentiment: -0.3,
          keywordTriggers: ['crowded', 'waiting', 'queue', 'management'],
          recommendedActions: [
            'Review crowd flow patterns',
            'Consider time-slot booking system',
            'Add temporary crowd barriers',
            'Increase staff during peak hours'
          ]
        }
      ];

      setTouristFeedbacks(mockFeedbacks);
      setSentimentTrends(mockTrends);
      setEmotionAnalysis(mockEmotionAnalysis);
      setLanguageDistribution(mockLanguageDistribution);
      setSentimentAlerts(mockSentimentAlerts);
    } catch (err: any) {
      setError('Failed to load sentiment analysis data');
      console.error('Sentiment analysis loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const respondToFeedback = async (feedbackId: string, response: string) => {
    try {
      const updatedFeedbacks = touristFeedbacks.map(feedback =>
        feedback.id === feedbackId
          ? {
              ...feedback,
              officialResponse: response,
              responseDate: new Date().toISOString(),
              status: 'RESPONDED' as const
            }
          : feedback
      );
      setTouristFeedbacks(updatedFeedbacks);
    } catch (err) {
      setError('Failed to respond to feedback');
      console.error('Feedback response error:', err);
    }
  };

  const escalateFeedback = async (feedbackId: string) => {
    try {
      const updatedFeedbacks = touristFeedbacks.map(feedback =>
        feedback.id === feedbackId
          ? { ...feedback, status: 'ESCALATED' as const }
          : feedback
      );
      setTouristFeedbacks(updatedFeedbacks);
    } catch (err) {
      setError('Failed to escalate feedback');
      console.error('Feedback escalation error:', err);
    }
  };

  const getSentimentColor = (sentiment: TouristFeedback['sentiment']) => {
    switch (sentiment) {
      case 'POSITIVE': return '#4CAF50';
      case 'NEGATIVE': return '#F44336';
      case 'NEUTRAL': return '#FF9800';
      default: return '#757575';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return '#4CAF50';
    if (rating >= 3) return '#FF9800';
    if (rating >= 2) return '#F44336';
    return '#9C27B0';
  };

  const getEmotionColor = (emotion: string, score: number) => {
    const intensity = score * 255;
    switch (emotion) {
      case 'joy': return `rgba(255, 193, 7, ${score})`;
      case 'anger': return `rgba(244, 67, 54, ${score})`;
      case 'fear': return `rgba(156, 39, 176, ${score})`;
      case 'sadness': return `rgba(63, 81, 181, ${score})`;
      case 'surprise': return `rgba(255, 152, 0, ${score})`;
      case 'disgust': return `rgba(76, 175, 80, ${score})`;
      default: return `rgba(158, 158, 158, ${score})`;
    }
  };

  const filteredFeedbacks = touristFeedbacks.filter(feedback => {
    const matchesSentiment = filterSentiment === 'ALL' || feedback.sentiment === filterSentiment;
    const matchesCategory = filterCategory === 'ALL' || feedback.category === filterCategory;
    const matchesRating = filterRating === 'ALL' || 
      (filterRating === '5' && feedback.rating === 5) ||
      (filterRating === '4' && feedback.rating === 4) ||
      (filterRating === '3' && feedback.rating === 3) ||
      (filterRating === '2' && feedback.rating === 2) ||
      (filterRating === '1' && feedback.rating === 1);
    const matchesKeyword = searchKeyword === '' || 
      feedback.comment.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      (feedback.translatedComment && feedback.translatedComment.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      feedback.keywords.some(keyword => keyword.toLowerCase().includes(searchKeyword.toLowerCase()));
    
    return matchesSentiment && matchesCategory && matchesRating && matchesKeyword;
  });

  if (loading) {
    return (
      <div className="sentiment-analyzer">
        <div className="loading-spinner">
          <span className="spinner"></span>
          <p>Loading sentiment analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sentiment-analyzer">
      <div className="sentiment-header">
        <h2>🎭 AI Tourist Sentiment Analyzer</h2>
        <p>Advanced sentiment analysis and emotion detection from tourist feedback</p>
        
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
            <button onClick={() => setError('')} className="close-error">×</button>
          </div>
        )}
      </div>

      <div className="sentiment-overview">
        <div className="overview-cards">
          <div className="overview-card positive">
            <h4>Positive Sentiment</h4>
            <span className="sentiment-value">
              {Math.round((touristFeedbacks.filter(f => f.sentiment === 'POSITIVE').length / touristFeedbacks.length) * 100)}%
            </span>
            <small>{touristFeedbacks.filter(f => f.sentiment === 'POSITIVE').length} feedbacks</small>
          </div>
          <div className="overview-card negative">
            <h4>Negative Sentiment</h4>
            <span className="sentiment-value">
              {Math.round((touristFeedbacks.filter(f => f.sentiment === 'NEGATIVE').length / touristFeedbacks.length) * 100)}%
            </span>
            <small>{touristFeedbacks.filter(f => f.sentiment === 'NEGATIVE').length} feedbacks</small>
          </div>
          <div className="overview-card neutral">
            <h4>Neutral Sentiment</h4>
            <span className="sentiment-value">
              {Math.round((touristFeedbacks.filter(f => f.sentiment === 'NEUTRAL').length / touristFeedbacks.length) * 100)}%
            </span>
            <small>{touristFeedbacks.filter(f => f.sentiment === 'NEUTRAL').length} feedbacks</small>
          </div>
          <div className="overview-card rating">
            <h4>Average Rating</h4>
            <span className="sentiment-value">
              {(touristFeedbacks.reduce((sum, f) => sum + f.rating, 0) / touristFeedbacks.length).toFixed(1)}
            </span>
            <small>out of 5 stars</small>
          </div>
        </div>
      </div>

      <div className="sentiment-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'feedbacks' ? 'active' : ''}`}
          onClick={() => setActiveTab('feedbacks')}
        >
          💬 Feedbacks ({filteredFeedbacks.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'trends' ? 'active' : ''}`}
          onClick={() => setActiveTab('trends')}
        >
          📈 Trends
        </button>
        <button
          className={`tab-button ${activeTab === 'emotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('emotions')}
        >
          🎭 Emotions
        </button>
        <button
          className={`tab-button ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          🚨 Alerts ({sentimentAlerts.length})
        </button>
        <button
          className={`tab-button ${activeTab === 'insights' ? 'active' : ''}`}
          onClick={() => setActiveTab('insights')}
        >
          💡 Insights
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="overview-content">
          <div className="overview-grid">
            <div className="overview-section">
              <h3>🌍 Language Distribution</h3>
              <div className="language-distribution">
                {languageDistribution.map(lang => (
                  <div key={lang.language} className="language-item">
                    <div className="language-header">
                      <span className="language-name">{lang.language}</span>
                      <span className="language-count">{lang.count} feedbacks</span>
                    </div>
                    <div className="language-sentiment">
                      <div 
                        className="sentiment-bar"
                        style={{ 
                          backgroundColor: getSentimentColor(
                            lang.averageSentiment > 0.3 ? 'POSITIVE' : 
                            lang.averageSentiment < -0.3 ? 'NEGATIVE' : 'NEUTRAL'
                          ),
                          width: `${Math.abs(lang.averageSentiment) * 100}%`
                        }}
                      ></div>
                      <span className="sentiment-score">
                        {lang.averageSentiment > 0 ? '+' : ''}{lang.averageSentiment.toFixed(2)}
                      </span>
                    </div>
                    <div className="common-issues">
                      <small>Common issues: {lang.commonIssues.join(', ')}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overview-section">
              <h3>📍 Location Sentiment Summary</h3>
              <div className="location-summary">
                {emotionAnalysis.map(analysis => (
                  <div key={analysis.location} className="location-item">
                    <div className="location-header">
                      <h4>{analysis.location}</h4>
                      <span className={`risk-badge ${analysis.riskLevel.toLowerCase()}`}>
                        {analysis.riskLevel}
                      </span>
                    </div>
                    <div className="dominant-emotion">
                      <span className="emotion-label">Dominant Emotion:</span>
                      <span className="emotion-value">{analysis.dominantEmotion}</span>
                    </div>
                    <div className="emotion-scores">
                      {Object.entries(analysis.emotionScores).map(([emotion, score]) => (
                        <div key={emotion} className="emotion-bar">
                          <span className="emotion-name">{emotion}</span>
                          <div className="emotion-progress">
                            <div 
                              className="emotion-fill"
                              style={{ 
                                backgroundColor: getEmotionColor(emotion, score),
                                width: `${score * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="emotion-score">{(score * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overview-section">
              <h3>📊 Quick Statistics</h3>
              <div className="quick-stats">
                <div className="stat-row">
                  <span className="stat-label">Total Feedbacks:</span>
                  <span className="stat-value">{touristFeedbacks.length}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Response Rate:</span>
                  <span className="stat-value">
                    {Math.round((touristFeedbacks.filter(f => f.status === 'RESPONDED').length / touristFeedbacks.length) * 100)}%
                  </span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Escalated Issues:</span>
                  <span className="stat-value">{touristFeedbacks.filter(f => f.status === 'ESCALATED').length}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Languages Detected:</span>
                  <span className="stat-value">{languageDistribution.length}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">Average Response Time:</span>
                  <span className="stat-value">4.2 hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feedbacks' && (
        <div className="feedbacks-content">
          <div className="feedbacks-controls">
            <input
              type="text"
              placeholder="Search feedback keywords..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="search-input"
            />
            
            <select
              value={filterSentiment}
              onChange={(e) => setFilterSentiment(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Sentiments</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEGATIVE">Negative</option>
              <option value="NEUTRAL">Neutral</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Categories</option>
              <option value="SAFETY">Safety</option>
              <option value="SERVICE">Service</option>
              <option value="FACILITIES">Facilities</option>
              <option value="NAVIGATION">Navigation</option>
              <option value="EMERGENCY_RESPONSE">Emergency Response</option>
              <option value="OVERALL_EXPERIENCE">Overall Experience</option>
            </select>

            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="filter-select"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          <div className="feedbacks-grid">
            {filteredFeedbacks.map(feedback => (
              <div key={feedback.id} className={`feedback-card ${feedback.sentiment.toLowerCase()}`}>
                <div className="feedback-header">
                  <div className="tourist-info">
                    <h4>{feedback.touristName}</h4>
                    <span className="nationality">{feedback.nationality}</span>
                    <span className="visit-date">{new Date(feedback.visitDate).toLocaleDateString()}</span>
                  </div>
                  <div className="feedback-meta">
                    <div className="rating">
                      {[...Array(5)].map((_, i) => (
                        <span 
                          key={i} 
                          className={`star ${i < feedback.rating ? 'filled' : ''}`}
                          style={{ color: getRatingColor(feedback.rating) }}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span 
                      className="sentiment-badge"
                      style={{ backgroundColor: getSentimentColor(feedback.sentiment) }}
                    >
                      {feedback.sentiment}
                    </span>
                  </div>
                </div>

                <div className="feedback-location">
                  <span className="location-icon">📍</span>
                  <span className="location-name">{feedback.location}</span>
                  <span className="category-badge">{feedback.category.replace('_', ' ')}</span>
                </div>

                <div className="feedback-content">
                  <div className="original-comment">
                    <h6>Original Comment ({feedback.language}):</h6>
                    <p>{feedback.comment}</p>
                  </div>
                  
                  {feedback.translatedComment && (
                    <div className="translated-comment">
                      <h6>Translation (English):</h6>
                      <p>{feedback.translatedComment}</p>
                    </div>
                  )}
                </div>

                <div className="sentiment-analysis">
                  <div className="sentiment-score">
                    <span className="score-label">Sentiment Score:</span>
                    <span className="score-value">
                      {feedback.sentimentScore > 0 ? '+' : ''}{feedback.sentimentScore.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="emotion-breakdown">
                    <h6>Emotion Analysis:</h6>
                    <div className="emotion-grid">
                      {Object.entries(feedback.emotions).map(([emotion, score]) => (
                        <div key={emotion} className="emotion-item">
                          <span className="emotion-name">{emotion}</span>
                          <div className="emotion-bar">
                            <div 
                              className="emotion-fill"
                              style={{ 
                                backgroundColor: getEmotionColor(emotion, score),
                                width: `${score * 100}%`
                              }}
                            ></div>
                          </div>
                          <span className="emotion-value">{(score * 100).toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="keywords-section">
                  <h6>Key Topics:</h6>
                  <div className="keywords-list">
                    {feedback.keywords.map((keyword, index) => (
                      <span key={index} className="keyword-tag">{keyword}</span>
                    ))}
                  </div>
                </div>

                {feedback.officialResponse && (
                  <div className="official-response">
                    <h6>Official Response:</h6>
                    <p>{feedback.officialResponse}</p>
                    <small>Responded on {new Date(feedback.responseDate!).toLocaleString()}</small>
                  </div>
                )}

                <div className="feedback-actions">
                  <div className="status-info">
                    <span className={`status-badge ${feedback.status.toLowerCase()}`}>
                      {feedback.status}
                    </span>
                    <span className="helpful-count">👍 {feedback.reviewHelpful} found helpful</span>
                  </div>
                  
                  <div className="action-buttons">
                    {feedback.status === 'NEW' || feedback.status === 'REVIEWED' ? (
                      <>
                        <button 
                          onClick={() => respondToFeedback(feedback.id, 'Thank you for your feedback. We are working to address your concerns.')}
                          className="respond-btn"
                        >
                          💬 Respond
                        </button>
                        <button 
                          onClick={() => escalateFeedback(feedback.id)}
                          className="escalate-btn"
                        >
                          ⬆️ Escalate
                        </button>
                      </>
                    ) : (
                      <button className="view-details-btn">
                        👁️ View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'trends' && (
        <div className="trends-content">
          <div className="trends-header">
            <h3>📈 Sentiment Trends Analysis</h3>
            <p>Track sentiment patterns over time</p>
          </div>

          <div className="trends-chart">
            <h4>Daily Sentiment Distribution</h4>
            <div className="chart-container">
              <div className="chart-placeholder">
                {sentimentTrends.map(trend => (
                  <div key={trend.date} className="trend-day">
                    <div className="trend-date">{new Date(trend.date).toLocaleDateString()}</div>
                    <div className="trend-bars">
                      <div 
                        className="trend-bar positive"
                        style={{ height: `${(trend.positiveCount / trend.totalFeedbacks) * 100}%` }}
                        title={`${trend.positiveCount} positive`}
                      ></div>
                      <div 
                        className="trend-bar negative"
                        style={{ height: `${(trend.negativeCount / trend.totalFeedbacks) * 100}%` }}
                        title={`${trend.negativeCount} negative`}
                      ></div>
                      <div 
                        className="trend-bar neutral"
                        style={{ height: `${(trend.neutralCount / trend.totalFeedbacks) * 100}%` }}
                        title={`${trend.neutralCount} neutral`}
                      ></div>
                    </div>
                    <div className="trend-rating">{trend.averageRating.toFixed(1)}★</div>
                    <div className="trend-total">{trend.totalFeedbacks} total</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="trends-summary">
            <div className="summary-cards">
              <div className="summary-card">
                <h5>Best Day</h5>
                <span className="summary-value">
                  {sentimentTrends.reduce((best, current) => 
                    current.averageRating > best.averageRating ? current : best
                  ).averageRating.toFixed(1)} ★
                </span>
                <small>
                  {new Date(sentimentTrends.reduce((best, current) => 
                    current.averageRating > best.averageRating ? current : best
                  ).date).toLocaleDateString()}
                </small>
              </div>
              
              <div className="summary-card">
                <h5>Worst Day</h5>
                <span className="summary-value">
                  {sentimentTrends.reduce((worst, current) => 
                    current.averageRating < worst.averageRating ? current : worst
                  ).averageRating.toFixed(1)} ★
                </span>
                <small>
                  {new Date(sentimentTrends.reduce((worst, current) => 
                    current.averageRating < worst.averageRating ? current : worst
                  ).date).toLocaleDateString()}
                </small>
              </div>
              
              <div className="summary-card">
                <h5>Total Feedbacks</h5>
                <span className="summary-value">
                  {sentimentTrends.reduce((sum, trend) => sum + trend.totalFeedbacks, 0)}
                </span>
                <small>Last 7 days</small>
              </div>
              
              <div className="summary-card">
                <h5>Average Rating</h5>
                <span className="summary-value">
                  {(sentimentTrends.reduce((sum, trend) => sum + trend.averageRating, 0) / sentimentTrends.length).toFixed(1)} ★
                </span>
                <small>7-day average</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'emotions' && (
        <div className="emotions-content">
          <div className="emotions-header">
            <h3>🎭 Emotion Analysis by Location</h3>
            <p>Deep emotion detection and risk assessment</p>
          </div>

          <div className="emotions-grid">
            {emotionAnalysis.map(analysis => (
              <div key={analysis.location} className="emotion-analysis-card">
                <div className="analysis-header">
                  <h4>{analysis.location}</h4>
                  <span className={`risk-level ${analysis.riskLevel.toLowerCase()}`}>
                    {analysis.riskLevel} RISK
                  </span>
                </div>

                <div className="dominant-emotion-display">
                  <h5>Dominant Emotion: {analysis.dominantEmotion}</h5>
                  <div className="emotion-icon">
                    {analysis.dominantEmotion === 'Joy' ? '😊' :
                     analysis.dominantEmotion === 'Anger' ? '😠' :
                     analysis.dominantEmotion === 'Fear' ? '😨' :
                     analysis.dominantEmotion === 'Sadness' ? '😢' :
                     analysis.dominantEmotion === 'Surprise' ? '😲' : '🤢'}
                  </div>
                </div>

                <div className="emotion-breakdown">
                  <h6>Emotion Breakdown:</h6>
                  {Object.entries(analysis.emotionScores).map(([emotion, score]) => (
                    <div key={emotion} className="emotion-row">
                      <div className="emotion-label">
                        <span className="emotion-emoji">
                          {emotion === 'joy' ? '😊' :
                           emotion === 'anger' ? '😠' :
                           emotion === 'fear' ? '😨' :
                           emotion === 'sadness' ? '😢' :
                           emotion === 'surprise' ? '😲' : '🤢'}
                        </span>
                        <span className="emotion-text">{emotion}</span>
                      </div>
                      <div className="emotion-progress">
                        <div 
                          className="emotion-bar"
                          style={{ 
                            backgroundColor: getEmotionColor(emotion, score),
                            width: `${score * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="emotion-percentage">{(score * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>

                <div className="recommendations-section">
                  <h6>🛡️ Recommendations:</h6>
                  <ul className="recommendations-list">
                    {analysis.recommendations.map((recommendation, index) => (
                      <li key={index}>{recommendation}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="alerts-content">
          <div className="alerts-header">
            <h3>🚨 Sentiment-Based Alerts</h3>
            <p>Real-time alerts triggered by sentiment analysis</p>
          </div>

          <div className="alerts-grid">
            {sentimentAlerts.map(alert => (
              <div key={alert.id} className={`sentiment-alert-card ${alert.severity.toLowerCase()}`}>
                <div className="alert-header">
                  <div className="alert-type">
                    <span className="alert-icon">
                      {alert.alertType === 'SAFETY_CONCERN' ? '🛡️' :
                       alert.alertType === 'SERVICE_ISSUE' ? '🛎️' :
                       alert.alertType === 'NEGATIVE_SPIKE' ? '📉' : '⚠️'}
                    </span>
                    <h4>{alert.alertType.replace('_', ' ')}</h4>
                  </div>
                  <span className="alert-severity">{alert.severity}</span>
                </div>

                <div className="alert-location">
                  <span className="location-icon">📍</span>
                  <span className="location-name">{alert.location}</span>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="alert-description">
                  <p>{alert.description}</p>
                </div>

                <div className="alert-metrics">
                  <div className="metric">
                    <span className="metric-label">Affected Feedbacks:</span>
                    <span className="metric-value">{alert.affectedFeedbacks}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Average Sentiment:</span>
                    <span className="metric-value">{alert.averageSentiment.toFixed(2)}</span>
                  </div>
                </div>

                <div className="keyword-triggers">
                  <h6>Trigger Keywords:</h6>
                  <div className="keywords">
                    {alert.keywordTriggers.map((keyword, index) => (
                      <span key={index} className="trigger-keyword">{keyword}</span>
                    ))}
                  </div>
                </div>

                <div className="recommended-actions">
                  <h6>🛡️ Recommended Actions:</h6>
                  <ul>
                    {alert.recommendedActions.map((action, index) => (
                      <li key={index}>{action}</li>
                    ))}
                  </ul>
                </div>

                <div className="alert-actions">
                  <button className="action-btn primary">🚨 Take Action</button>
                  <button className="action-btn secondary">👁️ Investigate</button>
                  <button className="action-btn">✅ Mark Resolved</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="insights-content">
          <div className="insights-header">
            <h3>💡 AI-Generated Insights</h3>
            <p>Strategic insights from sentiment analysis</p>
          </div>

          <div className="insights-grid">
            <div className="insight-section">
              <h4>🎯 Key Findings</h4>
              <ul className="insights-list">
                <li>Chandni Chowk shows consistently high fear and anger emotions - immediate security intervention needed</li>
                <li>Language barriers are a significant source of negative sentiment among Spanish-speaking tourists</li>
                <li>Lotus Temple maintains excellent sentiment scores - replicate their service model</li>
                <li>Safety concerns are the primary driver of negative feedback (45% of complaints)</li>
                <li>Response times to incidents directly correlate with sentiment scores</li>
              </ul>
            </div>

            <div className="insight-section">
              <h4>📊 Sentiment Patterns</h4>
              <div className="pattern-insights">
                <div className="pattern-item">
                  <span className="pattern-label">Peak Negative Hours:</span>
                  <span className="pattern-value">14:00-18:00 (Tourist rush period)</span>
                </div>
                <div className="pattern-item">
                  <span className="pattern-label">Best Rated Location:</span>
                  <span className="pattern-value">Lotus Temple (4.8★ average)</span>
                </div>
                <div className="pattern-item">
                  <span className="pattern-label">Most Complained Issue:</span>
                  <span className="pattern-value">Security Response Time</span>
                </div>
                <div className="pattern-item">
                  <span className="pattern-label">Language with Lowest Sentiment:</span>
                  <span className="pattern-value">Spanish (-0.2 average)</span>
                </div>
              </div>
            </div>

            <div className="insight-section">
              <h4>🚀 Improvement Recommendations</h4>
              <div className="recommendations">
                <div className="recommendation-item priority-high">
                  <h5>🔴 High Priority</h5>
                  <p>Deploy emergency security reinforcement to Chandni Chowk area immediately</p>
                </div>
                <div className="recommendation-item priority-medium">
                  <h5>🟡 Medium Priority</h5>
                  <p>Implement multilingual support training for all tourist-facing staff</p>
                </div>
                <div className="recommendation-item priority-low">
                  <h5>🟢 Low Priority</h5>
                  <p>Install digital translation kiosks at major tourist locations</p>
                </div>
              </div>
            </div>

            <div className="insight-section">
              <h4>📈 Predicted Outcomes</h4>
              <div className="predictions">
                <div className="prediction-item">
                  <span className="prediction-label">If security is improved in Chandni Chowk:</span>
                  <span className="prediction-value">+35% sentiment improvement expected</span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">With multilingual support:</span>
                  <span className="prediction-value">+20% satisfaction among international tourists</span>
                </div>
                <div className="prediction-item">
                  <span className="prediction-label">Faster emergency response:</span>
                  <span className="prediction-value">+40% improvement in safety ratings</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
