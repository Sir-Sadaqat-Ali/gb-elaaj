export type AnalyticsEvent = {
  name: string;                                    // "appointment.booked", "signup.completed", etc.
  userId?: string;
  properties?: Record<string, string | number | boolean>;
  timestamp?: Date;
};

export interface AnalyticsProvider {
  readonly name: string;
  capture(event: AnalyticsEvent): Promise<void>;
  identify(userId: string, traits: Record<string, string | number | boolean>): Promise<void>;
}
