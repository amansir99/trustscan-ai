interface RiskAlert {
  id: string;
  protocolName: string;
  alertType: 'security' | 'governance' | 'technical' | 'community';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  sources: string[];
}

interface MonitoringConfig {
  protocolName: string;
  monitoringSources: string[];
  alertThresholds: {
    securityScore: number;
    communityActivity: number;
    governanceChanges: boolean;
  };
}

export interface LiveMetrics {
  activeUsers?: number;
  transactionVolume?: number;
  tvl?: number;
  lastUpdated: Date;
  dataSource: string;
}

export class RealTimeMonitor {
  private alerts: RiskAlert[] = [];
  private configs: Map<string, MonitoringConfig> = new Map();

  async setupMonitoring(config: MonitoringConfig): Promise<void> {
    this.configs.set(config.protocolName, config);
    
    // Start monitoring intervals
    setInterval(() => this.checkSecurityAlerts(config), 300000); // 5 min
    setInterval(() => this.checkGovernanceChanges(config), 600000); // 10 min
    setInterval(() => this.checkCommunityActivity(config), 900000); // 15 min
  }

  private async checkSecurityAlerts(config: MonitoringConfig): Promise<void> {
    try {
      // Check for new exploits, audit findings, or security incidents
      const securityFeeds = [
        'https://rekt.news/api/posts',
        'https://defisafety.com/api/alerts',
        'https://immunefi.com/api/bounties'
      ];

      for (const feed of securityFeeds) {
        const incidents = await this.fetchSecurityIncidents(feed, config.protocolName);
        
        for (const incident of incidents) {
          if (this.isNewIncident(incident)) {
            this.createAlert({
              protocolName: config.protocolName,
              alertType: 'security',
              severity: incident.severity,
              message: incident.description,
              sources: [incident.source]
            });
          }
        }
      }
    } catch (error) {
      console.error('Security monitoring error:', error);
    }
  }

  private async checkGovernanceChanges(config: MonitoringConfig): Promise<void> {
    if (!config.alertThresholds.governanceChanges) return;

    try {
      // Monitor governance proposals and voting
      const governanceData = await this.fetchGovernanceActivity(config.protocolName);
      
      if (governanceData.hasSignificantChanges) {
        this.createAlert({
          protocolName: config.protocolName,
          alertType: 'governance',
          severity: 'medium',
          message: `New governance proposal: ${governanceData.latestProposal}`,
          sources: governanceData.sources
        });
      }
    } catch (error) {
      console.error('Governance monitoring error:', error);
    }
  }

  private async checkCommunityActivity(config: MonitoringConfig): Promise<void> {
    try {
      const activity = await this.fetchCommunityMetrics(config.protocolName);
      
      if (activity.score < config.alertThresholds.communityActivity) {
        this.createAlert({
          protocolName: config.protocolName,
          alertType: 'community',
          severity: 'low',
          message: `Community activity declined to ${activity.score}%`,
          sources: activity.sources
        });
      }
    } catch (error) {
      console.error('Community monitoring error:', error);
    }
  }

  private createAlert(alertData: Omit<RiskAlert, 'id' | 'timestamp'>): void {
    const alert: RiskAlert = {
      ...alertData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };

    this.alerts.push(alert);
    this.notifySubscribers(alert);
  }

  private async fetchSecurityIncidents(feed: string, protocolName: string): Promise<any[]> {
    // Implementation would fetch from security feeds
    return [];
  }

  private async fetchGovernanceActivity(protocolName: string): Promise<any> {
    // Implementation would check governance platforms
    return { hasSignificantChanges: false, latestProposal: '', sources: [] };
  }

  private async fetchCommunityMetrics(protocolName: string): Promise<any> {
    // Implementation would check GitHub, Discord, etc.
    return { score: 75, sources: [] };
  }

  private isNewIncident(incident: any): boolean {
    return !this.alerts.some(alert => 
      alert.message.includes(incident.description.substring(0, 50))
    );
  }

  private notifySubscribers(alert: RiskAlert): void {
    // Implementation would send notifications via webhook, email, etc.
    console.log('New risk alert:', alert);
  }

  getAlerts(protocolName?: string): RiskAlert[] {
    if (protocolName) {
      return this.alerts.filter(alert => alert.protocolName === protocolName);
    }
    return this.alerts;
  }

  getLatestAlerts(limit: number = 10): RiskAlert[] {
    return this.alerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}