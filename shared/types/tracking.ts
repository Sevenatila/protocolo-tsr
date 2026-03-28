export interface TrackingEvent {
  id: string;
  sessionId: string;
  leadId: string;
  timestamp: Date;
  eventType: 'section_view' | 'section_complete' | 'quiz_start' | 'quiz_abandon' | 'quiz_complete' | 'offer_click' | 'checkout_initiated' | 'pix_generated' | 'pix_pending' | 'purchase';
  sectionId: string;
  sectionIndex: number;
  totalSections: number;
  timeSpent?: number;
  metadata?: Record<string, any>;
}

export interface LeadSession {
  id: string;
  leadId: string;
  startedAt: Date;
  completedAt?: Date;
  lastActiveAt: Date;
  completionRate: number;
  totalSections: number;
  sectionsViewed: number;
  sectionsCompleted: number;
  abandonedAt?: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface AnalyticsMetrics {
  totalLeads: number;
  completedQuizzes: number;
  abandonedQuizzes: number;
  offerClicks: number;
  offerConversionRate: number;
  averageCompletionRate: number;
  averageTimeToComplete: number;
  sectionMetrics: SectionMetric[];
  dropOffPoints: DropOffPoint[];
}

export interface SectionMetric {
  sectionId: string;
  sectionIndex: number;
  viewCount: number;
  completionCount: number;
  abandonmentCount: number;
  averageTimeSpent: number;
  completionRate: number;
}

export interface DropOffPoint {
  sectionId: string;
  sectionIndex: number;
  dropOffCount: number;
  dropOffRate: number;
}

export interface DateFilter {
  type: 'today' | 'yesterday' | 'last7days' | 'last14days' | 'last21days' | 'last30days' | 'custom';
  startDate?: Date;
  endDate?: Date;
}