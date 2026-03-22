import { Request, Response, Router } from 'express';
import type { TrackingEvent, LeadSession, AnalyticsMetrics, DateFilter, SectionMetric, DropOffPoint } from '../shared/types/tracking';

// In-memory storage for tracking data (in production, use a database)
const trackingEvents: TrackingEvent[] = [];
const leadSessions: Map<string, LeadSession> = new Map();

function getDateRange(filter: DateFilter): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  switch (filter.type) {
    case 'today':
      return { start: today, end: tomorrow };

    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: today };

    case 'last7days':
      const week = new Date(today);
      week.setDate(week.getDate() - 7);
      return { start: week, end: tomorrow };

    case 'last14days':
      const twoWeeks = new Date(today);
      twoWeeks.setDate(twoWeeks.getDate() - 14);
      return { start: twoWeeks, end: tomorrow };

    case 'last21days':
      const threeWeeks = new Date(today);
      threeWeeks.setDate(threeWeeks.getDate() - 21);
      return { start: threeWeeks, end: tomorrow };

    case 'last30days':
      const month = new Date(today);
      month.setDate(month.getDate() - 30);
      return { start: month, end: tomorrow };

    case 'custom':
      return {
        start: filter.startDate || today,
        end: filter.endDate || tomorrow
      };

    default:
      return { start: today, end: tomorrow };
  }
}

export const trackingRouter = Router();

// POST endpoint to receive tracking events
trackingRouter.post('/api/tracking', (req: Request, res: Response) => {
  const event = req.body as Partial<TrackingEvent>;

  // Generate ID if not provided
  if (!event.id) {
    event.id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Ensure timestamp is a Date object
  event.timestamp = new Date(event.timestamp || Date.now());

  // Store the event
  trackingEvents.push(event as TrackingEvent);

  // Update or create lead session
  const session = leadSessions.get(event.sessionId!) || {
    id: event.sessionId!,
    leadId: event.leadId!,
    startedAt: event.timestamp,
    lastActiveAt: event.timestamp,
    completionRate: 0,
    totalSections: event.totalSections || 0,
    sectionsViewed: 0,
    sectionsCompleted: 0,
    userAgent: req.headers['user-agent'],
    ipAddress: req.ip
  };

  session.lastActiveAt = event.timestamp;

  switch (event.eventType) {
    case 'quiz_start':
      session.startedAt = event.timestamp;
      session.totalSections = event.totalSections || 0;
      break;

    case 'section_view':
      session.sectionsViewed = Math.max(session.sectionsViewed, event.sectionIndex || 0);
      break;

    case 'section_complete':
      session.sectionsCompleted = Math.max(session.sectionsCompleted, event.sectionIndex || 0);
      session.completionRate = (session.sectionsCompleted / session.totalSections) * 100;
      break;

    case 'quiz_complete':
      session.completedAt = event.timestamp;
      session.completionRate = 100;
      session.sectionsCompleted = session.totalSections;
      break;

    case 'quiz_abandon':
      session.abandonedAt = event.sectionId;
      break;
  }

  leadSessions.set(event.sessionId!, session);

  res.json({ success: true, eventId: event.id });
});

// GET endpoint to retrieve analytics metrics
trackingRouter.get('/api/tracking/analytics', (req: Request, res: Response) => {
  const filter: DateFilter = {
    type: (req.query.filter as any) || 'today'
  };

  if (filter.type === 'custom') {
    filter.startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    filter.endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  }

  const { start, end } = getDateRange(filter);

  // Filter events within the date range
  const filteredEvents = trackingEvents.filter(event => {
    const eventDate = new Date(event.timestamp);
    return eventDate >= start && eventDate < end;
  });

  // Get unique sessions from filtered events
  const sessionIds = new Set(filteredEvents.map(e => e.sessionId));
  const filteredSessions = Array.from(sessionIds)
    .map(id => leadSessions.get(id))
    .filter(s => s) as LeadSession[];

  // Calculate metrics
  const totalLeads = filteredSessions.length;
  const completedQuizzes = filteredSessions.filter(s => s.completedAt).length;
  const abandonedQuizzes = filteredSessions.filter(s => s.abandonedAt).length;

  // Count offer clicks
  const offerClicks = filteredEvents.filter(e => e.eventType === 'offer_click').length;
  const uniqueOfferClickers = new Set(
    filteredEvents.filter(e => e.eventType === 'offer_click').map(e => e.leadId)
  ).size;

  const averageCompletionRate = filteredSessions.length > 0
    ? filteredSessions.reduce((sum, s) => sum + s.completionRate, 0) / filteredSessions.length
    : 0;

  const completedSessions = filteredSessions.filter(s => s.completedAt);
  const averageTimeToComplete = completedSessions.length > 0
    ? completedSessions.reduce((sum, s) => {
        const duration = s.completedAt!.getTime() - s.startedAt.getTime();
        return sum + duration;
      }, 0) / completedSessions.length / 1000 // Convert to seconds
    : 0;

  // Calculate section metrics
  const sectionMap = new Map<string, SectionMetric>();

  filteredEvents.forEach(event => {
    if (!event.sectionId || event.sectionId === 'start' || event.sectionId === 'complete') return;

    if (!sectionMap.has(event.sectionId)) {
      sectionMap.set(event.sectionId, {
        sectionId: event.sectionId,
        sectionIndex: event.sectionIndex,
        viewCount: 0,
        completionCount: 0,
        abandonmentCount: 0,
        averageTimeSpent: 0,
        completionRate: 0
      });
    }

    const metric = sectionMap.get(event.sectionId)!;

    switch (event.eventType) {
      case 'section_view':
        metric.viewCount++;
        break;
      case 'section_complete':
        metric.completionCount++;
        if (event.timeSpent) {
          metric.averageTimeSpent = (metric.averageTimeSpent * (metric.completionCount - 1) + event.timeSpent) / metric.completionCount;
        }
        break;
      case 'quiz_abandon':
        metric.abandonmentCount++;
        break;
    }

    if (metric.viewCount > 0) {
      metric.completionRate = (metric.completionCount / metric.viewCount) * 100;
    }
  });

  const sectionMetrics = Array.from(sectionMap.values()).sort((a, b) => a.sectionIndex - b.sectionIndex);

  // Calculate drop-off points
  const dropOffPoints: DropOffPoint[] = sectionMetrics.map((metric, index) => {
    const dropOffCount = metric.abandonmentCount;
    const dropOffRate = metric.viewCount > 0 ? (dropOffCount / metric.viewCount) * 100 : 0;

    return {
      sectionId: metric.sectionId,
      sectionIndex: metric.sectionIndex,
      dropOffCount,
      dropOffRate
    };
  }).filter(point => point.dropOffCount > 0)
    .sort((a, b) => b.dropOffRate - a.dropOffRate);

  const offerConversionRate = totalLeads > 0 ? (uniqueOfferClickers / totalLeads) * 100 : 0;

  const metrics: AnalyticsMetrics = {
    totalLeads,
    completedQuizzes,
    abandonedQuizzes,
    offerClicks: uniqueOfferClickers,
    offerConversionRate,
    averageCompletionRate,
    averageTimeToComplete,
    sectionMetrics,
    dropOffPoints
  };

  res.json(metrics);
});

// GET endpoint to retrieve individual lead sessions
trackingRouter.get('/api/tracking/sessions', (req: Request, res: Response) => {
  const filter: DateFilter = {
    type: (req.query.filter as any) || 'today'
  };

  if (filter.type === 'custom') {
    filter.startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    filter.endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
  }

  const { start, end } = getDateRange(filter);

  // Filter sessions within the date range
  const filteredSessions = Array.from(leadSessions.values()).filter(session => {
    const sessionDate = new Date(session.startedAt);
    return sessionDate >= start && sessionDate < end;
  });

  res.json(filteredSessions);
});

// GET endpoint to retrieve events for a specific session
trackingRouter.get('/api/tracking/sessions/:sessionId/events', (req: Request, res: Response) => {
  const { sessionId } = req.params;

  const sessionEvents = trackingEvents.filter(event => event.sessionId === sessionId);

  res.json(sessionEvents);
});