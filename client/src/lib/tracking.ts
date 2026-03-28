import type { TrackingEvent } from '../../../shared/types/tracking';

class QuizTracker {
  private sessionId: string;
  private leadId: string;
  private startTime: number;
  private sectionStartTime: number;
  private events: TrackingEvent[] = [];
  private apiUrl = '/api/tracking';

  constructor() {
    this.sessionId = this.generateSessionId();
    this.leadId = this.getOrCreateLeadId();
    this.startTime = Date.now();
    this.sectionStartTime = Date.now();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getOrCreateLeadId(): string {
    let leadId = localStorage.getItem('leadId');
    if (!leadId) {
      leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('leadId', leadId);
    }
    return leadId;
  }

  async trackQuizStart(totalSections: number): Promise<void> {
    const event: Partial<TrackingEvent> = {
      sessionId: this.sessionId,
      leadId: this.leadId,
      timestamp: new Date(),
      eventType: 'quiz_start',
      sectionId: 'start',
      sectionIndex: 0,
      totalSections,
    };

    this.events.push(event as TrackingEvent);
    await this.sendEvent(event);
  }

  async trackSectionView(sectionId: string, sectionIndex: number, totalSections: number): Promise<void> {
    this.sectionStartTime = Date.now();

    const event: Partial<TrackingEvent> = {
      sessionId: this.sessionId,
      leadId: this.leadId,
      timestamp: new Date(),
      eventType: 'section_view',
      sectionId,
      sectionIndex,
      totalSections,
    };

    this.events.push(event as TrackingEvent);
    await this.sendEvent(event);
  }

  async trackSectionComplete(sectionId: string, sectionIndex: number, totalSections: number, answers?: any): Promise<void> {
    const timeSpent = Date.now() - this.sectionStartTime;

    const event: Partial<TrackingEvent> = {
      sessionId: this.sessionId,
      leadId: this.leadId,
      timestamp: new Date(),
      eventType: 'section_complete',
      sectionId,
      sectionIndex,
      totalSections,
      timeSpent,
      metadata: answers ? { answers } : undefined,
    };

    this.events.push(event as TrackingEvent);
    await this.sendEvent(event);
  }

  async trackQuizAbandon(sectionId: string, sectionIndex: number, totalSections: number): Promise<void> {
    const event: Partial<TrackingEvent> = {
      sessionId: this.sessionId,
      leadId: this.leadId,
      timestamp: new Date(),
      eventType: 'quiz_abandon',
      sectionId,
      sectionIndex,
      totalSections,
      timeSpent: Date.now() - this.startTime,
    };

    this.events.push(event as TrackingEvent);
    await this.sendEvent(event);
  }

  async trackQuizComplete(totalSections: number): Promise<void> {
    const event: Partial<TrackingEvent> = {
      sessionId: this.sessionId,
      leadId: this.leadId,
      timestamp: new Date(),
      eventType: 'quiz_complete',
      sectionId: 'complete',
      sectionIndex: totalSections,
      totalSections,
      timeSpent: Date.now() - this.startTime,
    };

    this.events.push(event as TrackingEvent);
    await this.sendEvent(event);
  }

  async trackOfferClick(offerUrl?: string): Promise<void> {
    const event: Partial<TrackingEvent> = {
      sessionId: this.sessionId,
      leadId: this.leadId,
      timestamp: new Date(),
      eventType: 'offer_click',
      sectionId: 'offer',
      sectionIndex: -1,
      totalSections: 0,
      metadata: { offerUrl },
    };

    this.events.push(event as TrackingEvent);
    await this.sendEvent(event);
  }

  async trackCheckoutInitiated(): Promise<void> {
    const event: Partial<TrackingEvent> = {
      sessionId: this.sessionId,
      leadId: this.leadId,
      timestamp: new Date(),
      eventType: 'checkout_initiated',
      sectionId: 'checkout',
      sectionIndex: -1,
      totalSections: 0,
    };
    this.events.push(event as TrackingEvent);
    await this.sendEvent(event);
  }

  async trackPixGenerated(paymentId: string): Promise<void> {
    const event: Partial<TrackingEvent> = {
      sessionId: this.sessionId,
      leadId: this.leadId,
      timestamp: new Date(),
      eventType: 'pix_generated',
      sectionId: 'checkout',
      sectionIndex: -1,
      totalSections: 0,
      metadata: { paymentId },
    };
    this.events.push(event as TrackingEvent);
    await this.sendEvent(event);
  }

  async trackPixPending(paymentId: string): Promise<void> {
    const event: Partial<TrackingEvent> = {
      sessionId: this.sessionId,
      leadId: this.leadId,
      timestamp: new Date(),
      eventType: 'pix_pending',
      sectionId: 'checkout',
      sectionIndex: -1,
      totalSections: 0,
      metadata: { paymentId },
    };
    this.events.push(event as TrackingEvent);
    await this.sendEvent(event);
  }

  async trackPurchase(paymentId: string, amount: number, method: string): Promise<void> {
    const event: Partial<TrackingEvent> = {
      sessionId: this.sessionId,
      leadId: this.leadId,
      timestamp: new Date(),
      eventType: 'purchase',
      sectionId: 'checkout',
      sectionIndex: -1,
      totalSections: 0,
      metadata: { paymentId, amount, method },
    };
    this.events.push(event as TrackingEvent);
    await this.sendEvent(event);
  }

  private async sendEvent(event: Partial<TrackingEvent>): Promise<void> {
    try {
      await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to send tracking event:', error);
      this.saveToLocalStorage(event);
    }
  }

  private saveToLocalStorage(event: Partial<TrackingEvent>): void {
    const storedEvents = localStorage.getItem('pendingTrackingEvents');
    const events = storedEvents ? JSON.parse(storedEvents) : [];
    events.push(event);
    localStorage.setItem('pendingTrackingEvents', JSON.stringify(events));
  }

  async syncPendingEvents(): Promise<void> {
    const storedEvents = localStorage.getItem('pendingTrackingEvents');
    if (!storedEvents) return;

    const events = JSON.parse(storedEvents);
    for (const event of events) {
      await this.sendEvent(event);
    }
    localStorage.removeItem('pendingTrackingEvents');
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getLeadId(): string {
    return this.leadId;
  }
}

export const quizTracker = new QuizTracker();