// Alert manager for threshold-based monitoring and notifications
import { PrismaClient } from '@prisma/client';
import { SnapshotWriter } from './snapshot-writer';
import { AlertThreshold, AlertOperator, AlertEvent } from '../types/aeo';

const prisma = new PrismaClient();

export interface AlertResult {
  alertsTriggered: number;
  alertsSent: number;
  alertsSkipped: number;
  errors: number;
  thresholds: Array<{
    id: string;
    url: string;
    metricType: string;
    triggered: boolean;
    currentValue?: number;
    thresholdValue: number;
    error?: string;
  }>;
}

export class AlertManager {
  private static instance: AlertManager;
  private readonly snapshotWriter!: SnapshotWriter;
  private readonly cooldownPeriod = 4 * 60 * 60 * 1000; // 4 hours in ms
  private readonly maxAlertsPerHour = 10;

  constructor() {
    if (AlertManager.instance) {
      return AlertManager.instance;
    }
    AlertManager.instance = this;
    this.snapshotWriter = new SnapshotWriter();
  }

  // Check all thresholds and create alert events
  async checkAllThresholds(): Promise<AlertResult> {
    const result: AlertResult = {
      alertsTriggered: 0,
      alertsSent: 0,
      alertsSkipped: 0,
      errors: 0,
      thresholds: [],
    };

    try {
      // Get all enabled thresholds
      const thresholds = await prisma.alertThreshold.findMany({
        where: { enabled: true },
        orderBy: { url: 'asc' },
      });

      console.log(`Checking ${thresholds.length} alert thresholds`);

      for (const threshold of thresholds) {
        try {
          const thresholdResult = await this.checkThreshold({
            ...threshold,
            operator: threshold.operator as AlertOperator,
          });
          result.thresholds.push(thresholdResult);

          if (thresholdResult.triggered) {
            result.alertsTriggered++;
          }
        } catch (error) {
          console.error(`Error checking threshold ${threshold.id}:`, error);
          result.errors++;
          result.thresholds.push({
            id: threshold.id,
            url: threshold.url,
            metricType: threshold.metricType,
            triggered: false,
            thresholdValue: threshold.threshold,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      console.log(
        `Threshold check completed: ${result.alertsTriggered} alerts triggered, ${result.errors} errors`
      );
      return result;
    } catch (error) {
      console.error('Failed to check thresholds:', error);
      throw error;
    }
  }

  // Check individual threshold
  private async checkThreshold(threshold: AlertThreshold): Promise<{
    id: string;
    url: string;
    metricType: string;
    triggered: boolean;
    currentValue?: number;
    thresholdValue: number;
    error?: string;
  }> {
    try {
      // Check cooldown period
      if (threshold.lastTriggered) {
        const timeSinceLastTrigger = Date.now() - threshold.lastTriggered.getTime();
        if (timeSinceLastTrigger < this.cooldownPeriod) {
          return {
            id: threshold.id,
            url: threshold.url,
            metricType: threshold.metricType,
            triggered: false,
            thresholdValue: threshold.threshold,
          };
        }
      }

      // Get current value for the metric
      const currentValue = await this.getCurrentMetricValue(threshold.url, threshold.metricType);

      if (currentValue === null) {
        return {
          id: threshold.id,
          url: threshold.url,
          metricType: threshold.metricType,
          triggered: false,
          thresholdValue: threshold.threshold,
          error: 'No data available',
        };
      }

      // Check if threshold is violated
      const isTriggered = this.evaluateThreshold(
        currentValue,
        threshold.operator,
        threshold.threshold
      );

      if (isTriggered) {
        // Create alert event
        const severity = this.calculateSeverity(
          threshold.metricType,
          currentValue,
          threshold.threshold
        );

        await this.createAlertEvent({
          thresholdId: threshold.id,
          url: threshold.url,
          metricType: threshold.metricType,
          currentValue,
          thresholdValue: threshold.threshold,
          severity,
        });

        // Update last triggered time
        await prisma.alertThreshold.update({
          where: { id: threshold.id },
          data: { lastTriggered: new Date() },
        });

        console.log(
          `Alert triggered for ${threshold.url} - ${threshold.metricType}: ${currentValue} ${threshold.operator} ${threshold.threshold}`
        );
      }

      return {
        id: threshold.id,
        url: threshold.url,
        metricType: threshold.metricType,
        triggered: isTriggered,
        currentValue,
        thresholdValue: threshold.threshold,
      };
    } catch (error) {
      throw new Error(
        `Failed to check threshold ${threshold.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Get current metric value from latest snapshot
  private async getCurrentMetricValue(url: string, metricType: string): Promise<number | null> {
    try {
      switch (metricType) {
        case 'psi_performance':
          const psiSnapshot = await this.snapshotWriter.getLatestPSISnapshot(url);
          return psiSnapshot?.performance || null;

        case 'psi_accessibility':
          const psiSnapshotAcc = await this.snapshotWriter.getLatestPSISnapshot(url);
          return psiSnapshotAcc?.accessibility || null;

        case 'psi_seo':
          const psiSnapshotSeo = await this.snapshotWriter.getLatestPSISnapshot(url);
          return psiSnapshotSeo?.seo || null;

        case 'psi_lcp':
          const psiSnapshotLcp = await this.snapshotWriter.getLatestPSISnapshot(url);
          return psiSnapshotLcp?.lcp || null;

        case 'psi_cls':
          const psiSnapshotCls = await this.snapshotWriter.getLatestPSISnapshot(url);
          return psiSnapshotCls?.cls || null;

        case 'opr_clicks':
          const oprSnapshot = await this.snapshotWriter.getLatestOPRSnapshot(url);
          return oprSnapshot?.totalClicks || null;

        case 'opr_impressions':
          const oprSnapshotImp = await this.snapshotWriter.getLatestOPRSnapshot(url);
          return oprSnapshotImp?.totalImpressions || null;

        case 'opr_ctr':
          const oprSnapshotCtr = await this.snapshotWriter.getLatestOPRSnapshot(url);
          return oprSnapshotCtr?.averageCTR || null;

        case 'opr_position':
          const oprSnapshotPos = await this.snapshotWriter.getLatestOPRSnapshot(url);
          return oprSnapshotPos?.averagePosition || null;

        case 'schema_errors':
          const schemaSnapshot = await this.snapshotWriter.getLatestSchemaSnapshot(url);
          return schemaSnapshot?.invalidSchemas || null;

        case 'schema_total':
          const schemaSnapshotTotal = await this.snapshotWriter.getLatestSchemaSnapshot(url);
          return schemaSnapshotTotal?.schemasFound || null;

        default:
          throw new Error(`Unknown metric type: ${metricType}`);
      }
    } catch (error) {
      console.error(`Failed to get metric value for ${metricType} on ${url}:`, error);
      return null;
    }
  }

  // Evaluate threshold condition
  private evaluateThreshold(currentValue: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'lt':
        return currentValue < threshold;
      case 'lte':
        return currentValue <= threshold;
      case 'gt':
        return currentValue > threshold;
      case 'gte':
        return currentValue >= threshold;
      case 'eq':
        return currentValue === threshold;
      default:
        return false;
    }
  }

  // Calculate alert severity
  private calculateSeverity(
    metricType: string,
    currentValue: number,
    threshold: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    const difference = Math.abs(currentValue - threshold);
    const percentDiff = (difference / threshold) * 100;

    // Performance metrics (higher is better)
    if (
      metricType.startsWith('psi_') &&
      !metricType.includes('lcp') &&
      !metricType.includes('cls')
    ) {
      if (percentDiff > 50) return 'critical';
      if (percentDiff > 25) return 'high';
      if (percentDiff > 10) return 'medium';
      return 'low';
    }

    // LCP and CLS (lower is better)
    if (metricType.includes('lcp') || metricType.includes('cls')) {
      if (percentDiff > 100) return 'critical';
      if (percentDiff > 50) return 'high';
      if (percentDiff > 25) return 'medium';
      return 'low';
    }

    // Traffic metrics
    if (metricType.startsWith('opr_')) {
      if (percentDiff > 75) return 'critical';
      if (percentDiff > 50) return 'high';
      if (percentDiff > 25) return 'medium';
      return 'low';
    }

    // Schema errors
    if (metricType.includes('schema')) {
      if (currentValue > threshold * 2) return 'critical';
      if (currentValue > threshold * 1.5) return 'high';
      return 'medium';
    }

    return 'medium';
  }

  // Create alert event
  private async createAlertEvent(eventData: {
    thresholdId: string;
    url: string;
    metricType: string;
    currentValue: number;
    thresholdValue: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    await prisma.alertEvent.create({
      data: {
        thresholdId: eventData.thresholdId,
        url: eventData.url,
        metricType: eventData.metricType,
        currentValue: eventData.currentValue,
        thresholdValue: eventData.thresholdValue,
        severity: eventData.severity,
        sent: false,
      },
    });
  }

  // Send pending alerts
  async sendPendingAlerts(): Promise<{ sent: number; failed: number }> {
    try {
      // Check rate limits
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentAlerts = await prisma.alertEvent.count({
        where: {
          sentAt: { gte: oneHourAgo },
        },
      });

      if (recentAlerts >= this.maxAlertsPerHour) {
        console.warn(`Alert rate limit reached: ${recentAlerts} alerts sent in the last hour`);
        return { sent: 0, failed: 0 };
      }

      // Get pending alerts
      const pendingAlerts = await prisma.alertEvent.findMany({
        where: { sent: false },
        include: { threshold: true },
        orderBy: [{ severity: 'desc' }, { createdAt: 'asc' }],
        take: this.maxAlertsPerHour - recentAlerts, // Respect rate limit
      });

      let sent = 0;
      let failed = 0;

      for (const alert of pendingAlerts) {
        try {
          await this.sendAlert(alert);

          // Mark as sent
          await prisma.alertEvent.update({
            where: { id: alert.id },
            data: {
              sent: true,
              sentAt: new Date(),
            },
          });

          sent++;
        } catch (error) {
          console.error(`Failed to send alert ${alert.id}:`, error);
          failed++;
        }
      }

      console.log(`Alert sending completed: ${sent} sent, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      console.error('Failed to send pending alerts:', error);
      throw error;
    }
  }

  // Send individual alert
  private async sendAlert(alert: any): Promise<void> {
    const emailEnabled = process.env.ALERT_EMAIL_ENABLED === 'true';
    const webhookUrl = process.env.ALERT_WEBHOOK_URL;

    const alertData = {
      url: alert.url,
      metricType: alert.metricType,
      currentValue: alert.currentValue,
      thresholdValue: alert.thresholdValue,
      severity: alert.severity,
      timestamp: alert.createdAt.toISOString(),
      message: this.generateAlertMessage(alert),
    };

    // Send email alert
    if (emailEnabled) {
      await this.sendEmailAlert(alertData);
    }

    // Send webhook alert
    if (webhookUrl) {
      await this.sendWebhookAlert(webhookUrl, alertData);
    }

    // If no notification methods are configured, log the alert
    if (!emailEnabled && !webhookUrl) {
      console.warn('Alert generated but no notification methods configured:', alertData);
    }
  }

  // Generate alert message
  private generateAlertMessage(alert: any): string {
    const metricNames: Record<string, string> = {
      psi_performance: 'Performance Score',
      psi_accessibility: 'Accessibility Score',
      psi_seo: 'SEO Score',
      psi_lcp: 'Largest Contentful Paint',
      psi_cls: 'Cumulative Layout Shift',
      opr_clicks: 'Total Clicks',
      opr_impressions: 'Total Impressions',
      opr_ctr: 'Click-Through Rate',
      opr_position: 'Average Position',
      schema_errors: 'Schema Errors',
      schema_total: 'Total Schemas',
    };

    const metricName = metricNames[alert.metricType] || alert.metricType;
    const operatorText = this.getOperatorText(alert.threshold.operator);

    return `${metricName} alert for ${alert.url}: Current value ${alert.currentValue} is ${operatorText} threshold of ${alert.thresholdValue}`;
  }

  private getOperatorText(operator: string): string {
    switch (operator) {
      case 'lt':
        return 'below';
      case 'lte':
        return 'at or below';
      case 'gt':
        return 'above';
      case 'gte':
        return 'at or above';
      case 'eq':
        return 'equal to';
      default:
        return 'compared to';
    }
  }

  // Send email alert
  private async sendEmailAlert(alertData: any): Promise<void> {
    // This would integrate with your email service (SendGrid, SES, etc.)
    const emailTo = process.env.ALERT_EMAIL_TO || 'alerts@xenlix.ai';
    const emailFrom = process.env.ALERT_EMAIL_FROM || 'noreply@xenlix.ai';

    console.log(`Sending email alert to ${emailTo}:`, alertData.message);

    // TODO: Implement actual email sending
    // Example with a generic email service:
    /*
    await emailService.send({
      to: emailTo,
      from: emailFrom,
      subject: `[${alertData.severity.toUpperCase()}] ${alertData.metricType} Alert`,
      html: this.generateEmailTemplate(alertData),
    });
    */
  }

  // Send webhook alert
  private async sendWebhookAlert(webhookUrl: string, alertData: any): Promise<void> {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'XenlixAI-Alerts/1.0',
      },
      body: JSON.stringify({
        type: 'alert',
        ...alertData,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
    }

    console.log(`Webhook alert sent to ${webhookUrl}`);
  }

  // Threshold management methods
  async createThreshold(data: {
    url: string;
    metricType: string;
    operator: 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
    threshold: number;
  }): Promise<AlertThreshold> {
    const threshold = await prisma.alertThreshold.create({
      data: {
        url: data.url,
        metricType: data.metricType,
        operator: data.operator,
        threshold: data.threshold,
        enabled: true,
      },
    });

    return {
      ...threshold,
      operator: threshold.operator as AlertOperator,
    };
  }

  async updateThreshold(
    id: string,
    data: Partial<{
      threshold: number;
      enabled: boolean;
      operator: 'lt' | 'gt' | 'eq' | 'lte' | 'gte';
    }>
  ): Promise<AlertThreshold> {
    const threshold = await prisma.alertThreshold.update({
      where: { id },
      data,
    });

    return {
      ...threshold,
      operator: threshold.operator as AlertOperator,
    };
  }

  async deleteThreshold(id: string): Promise<void> {
    await prisma.alertThreshold.delete({
      where: { id },
    });
  }

  async getThresholds(url?: string): Promise<AlertThreshold[]> {
    const thresholds = await prisma.alertThreshold.findMany({
      where: url ? { url } : undefined,
      orderBy: { createdAt: 'desc' },
    });

    return thresholds.map((threshold) => ({
      ...threshold,
      operator: threshold.operator as AlertOperator,
    }));
  }

  async getAlertHistory(url?: string, days = 30): Promise<AlertEvent[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await prisma.alertEvent.findMany({
      where: {
        url: url || undefined,
        createdAt: { gte: startDate },
      },
      include: { threshold: true },
      orderBy: { createdAt: 'desc' },
    });

    return events.map((event) => ({
      ...event,
      threshold: event.threshold
        ? {
            ...event.threshold,
            operator: event.threshold.operator as AlertOperator,
          }
        : undefined,
    }));
  }
}
