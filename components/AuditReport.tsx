'use client';

import { useState } from 'react';
import { AuditResult } from '@/types';
import TrustScore from './TrustScore';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import jsPDF from 'jspdf';

import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  ExternalLink, 
  Copy, 
  RefreshCw,
  Share2,
  Bookmark,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface AuditReportProps {
  audit: AuditResult;
  showFullDetails?: boolean;
  allowExport?: boolean;
  loading?: boolean;
  onRefresh?: () => void;
}

interface ExpandableSection {
  id: string;
  title: string;
  icon: string;
  content: React.ReactNode;
  defaultExpanded?: boolean;
}

export default function AuditReport({ 
  audit, 
  showFullDetails = true, 
  allowExport = false,
  loading = false,
  onRefresh
}: AuditReportProps) {
  const { trust_score, analysis_data, url, created_at } = audit;
  const { factors, explanations, recommendations, risks } = analysis_data;
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(showFullDetails ? ['overview', 'factors'] : ['overview'])
  );
  const [exportLoading, setExportLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const response = await fetch(`/api/audit/export?id=${audit.id}`);
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `trust-audit-${audit.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleCopyFullReport = async () => {
    // Generate comprehensive report text
    const fullReport = `
═══════════════════════════════════════════════════════════════
                    TRUST AUDIT REPORT
═══════════════════════════════════════════════════════════════

Project URL: ${url}
Report ID: ${audit.id || 'N/A'}
Generated: ${new Date(created_at).toLocaleString()}

═══════════════════════════════════════════════════════════════
                    TRUST SCORE OVERVIEW
═══════════════════════════════════════════════════════════════

Overall Trust Score: ${trust_score}/100
Risk Level: ${trust_score >= 80 ? 'TRUSTED ✓' : trust_score >= 60 ? 'LOW RISK' : trust_score >= 40 ? 'MEDIUM RISK ⚠' : 'HIGH RISK ⚠⚠'}
Strong Areas: ${Object.values(factors).filter(v => v >= 70).length}
Risk Factors Identified: ${risks.length}

═══════════════════════════════════════════════════════════════
                  DETAILED FACTOR ANALYSIS
═══════════════════════════════════════════════════════════════

${Object.entries(factors).map(([key, value]) => {
  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  const explanation = explanations[key] || 'No detailed explanation available.';
  const status = value >= 80 ? '✓ EXCELLENT' : value >= 60 ? '✓ GOOD' : value >= 40 ? '⚠ FAIR' : '✗ POOR';
  
  return `${label}: ${value}% [${status}]
${explanation}
`;
}).join('\n')}

═══════════════════════════════════════════════════════════════
                      RISK ASSESSMENT
═══════════════════════════════════════════════════════════════

${risks.length > 0 ? risks.map((risk, i) => `${i + 1}. ⚠ ${risk}`).join('\n\n') : '✓ No significant risks identified.\nThis project shows good security practices and transparency.'}

═══════════════════════════════════════════════════════════════
                      RECOMMENDATIONS
═══════════════════════════════════════════════════════════════

${recommendations.length > 0 ? recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n\n') : '✓ No specific recommendations.\nThis project appears to follow best practices.'}

═══════════════════════════════════════════════════════════════
                      DISCLAIMER
═══════════════════════════════════════════════════════════════

This report is generated by TrustScan AI for informational purposes
only. It should not be considered as financial, investment, or legal
advice. Always conduct your own research and consult with qualified
professionals before making any investment decisions.

═══════════════════════════════════════════════════════════════

Generated by TrustScan AI
Report Link: ${window.location.href}

© ${new Date().getFullYear()} TrustScan AI. All rights reserved.
`;
    
    try {
      await navigator.clipboard.writeText(fullReport);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setExportLoading(true);
      
      // Create PDF using jsPDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;

      // Helper function to add new page if needed
      const checkPageBreak = (requiredSpace: number) => {
        if (yPos + requiredSpace > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Helper function to wrap text
      const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return lines.length * (fontSize * 0.35); // Return height used
      };

      // Header
      pdf.setFillColor(37, 99, 235); // Blue
      pdf.rect(0, 0, pageWidth, 40, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('TRUST AUDIT REPORT', pageWidth / 2, 20, { align: 'center' });
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Comprehensive Security & Trust Analysis', pageWidth / 2, 30, { align: 'center' });
      
      yPos = 50;

      // Metadata Box
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, yPos, contentWidth, 25, 'F');
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Project URL:', margin + 5, yPos + 7);
      pdf.setFont('helvetica', 'normal');
      const urlHeight = addWrappedText(url, margin + 35, yPos + 7, contentWidth - 40, 9);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Report ID:', margin + 5, yPos + 14);
      pdf.setFont('helvetica', 'normal');
      pdf.text(audit.id?.slice(0, 16) || 'N/A', margin + 35, yPos + 14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Generated:', margin + 5, yPos + 21);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(created_at).toLocaleString(), margin + 35, yPos + 21);
      
      yPos += 35;

      // Trust Score Box
      checkPageBreak(40);
      pdf.setFillColor(102, 126, 234); // Purple gradient approximation
      pdf.rect(margin, yPos, contentWidth, 35, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.text('Overall Trust Score', pageWidth / 2, yPos + 10, { align: 'center' });
      pdf.setFontSize(36);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${trust_score}/100`, pageWidth / 2, yPos + 22, { align: 'center' });
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'normal');
      const riskLabel = trust_score >= 80 ? 'TRUSTED' : trust_score >= 60 ? 'LOW RISK' : trust_score >= 40 ? 'MEDIUM RISK' : 'HIGH RISK';
      pdf.text(riskLabel, pageWidth / 2, yPos + 30, { align: 'center' });
      
      yPos += 45;

      // Statistics
      checkPageBreak(25);
      const statWidth = contentWidth / 3 - 2;
      pdf.setFillColor(249, 250, 251);
      
      // Stat 1
      pdf.rect(margin, yPos, statWidth, 20, 'F');
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(trust_score.toString(), margin + statWidth / 2, yPos + 10, { align: 'center' });
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Trust Score', margin + statWidth / 2, yPos + 16, { align: 'center' });
      
      // Stat 2
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin + statWidth + 2, yPos, statWidth, 20, 'F');
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(Object.values(factors).filter(v => v >= 70).length.toString(), margin + statWidth + 2 + statWidth / 2, yPos + 10, { align: 'center' });
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Strong Areas', margin + statWidth + 2 + statWidth / 2, yPos + 16, { align: 'center' });
      
      // Stat 3
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin + (statWidth + 2) * 2, yPos, statWidth, 20, 'F');
      pdf.setTextColor(37, 99, 235);
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(risks.length.toString(), margin + (statWidth + 2) * 2 + statWidth / 2, yPos + 10, { align: 'center' });
      pdf.setFontSize(9);
      pdf.setTextColor(107, 114, 128);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Risk Factors', margin + (statWidth + 2) * 2 + statWidth / 2, yPos + 16, { align: 'center' });
      
      yPos += 30;

      // Detailed Factor Analysis
      checkPageBreak(15);
      pdf.setFillColor(243, 244, 246);
      pdf.rect(margin, yPos, contentWidth, 10, 'F');
      pdf.setDrawColor(37, 99, 235);
      pdf.setLineWidth(1);
      pdf.line(margin, yPos, margin, yPos + 10);
      pdf.setTextColor(30, 64, 175);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Detailed Factor Analysis', margin + 5, yPos + 7);
      
      yPos += 15;

      // Factors
      Object.entries(factors).forEach(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const explanation = explanations[key] || 'No detailed explanation available.';
        
        // Calculate explanation height
        pdf.setFontSize(8);
        const expLines = pdf.splitTextToSize(explanation, contentWidth - 6);
        const expHeight = expLines.length * (8 * 0.35);
        const boxHeight = Math.max(25, expHeight + 18);
        
        checkPageBreak(boxHeight + 5);
        
        // Factor box with dynamic height
        pdf.setFillColor(249, 250, 251);
        pdf.setDrawColor(229, 231, 235);
        pdf.setLineWidth(0.5);
        pdf.rect(margin, yPos, contentWidth, boxHeight, 'FD');
        
        // Factor name and score
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, margin + 3, yPos + 6);
        
        // Score badge
        const scoreColor = value >= 80 ? [16, 185, 129] : value >= 60 ? [59, 130, 246] : value >= 40 ? [245, 158, 11] : [239, 68, 68];
        pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        pdf.roundedRect(contentWidth + margin - 20, yPos + 2, 18, 6, 3, 3, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${value}%`, contentWidth + margin - 11, yPos + 6, { align: 'center' });
        
        // Progress bar
        pdf.setFillColor(229, 231, 235);
        pdf.rect(margin + 3, yPos + 10, contentWidth - 6, 3, 'F');
        pdf.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
        pdf.rect(margin + 3, yPos + 10, (contentWidth - 6) * (value / 100), 3, 'F');
        
        // Explanation with proper wrapping
        pdf.setTextColor(107, 114, 128);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(expLines, margin + 3, yPos + 17);
        
        yPos += boxHeight + 3;
      });

      // Risk Assessment
      checkPageBreak(15);
      pdf.setFillColor(243, 244, 246);
      pdf.rect(margin, yPos, contentWidth, 10, 'F');
      pdf.setDrawColor(37, 99, 235);
      pdf.line(margin, yPos, margin, yPos + 10);
      pdf.setTextColor(30, 64, 175);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Risk Assessment', margin + 5, yPos + 7);
      
      yPos += 15;

      if (risks.length > 0) {
        risks.forEach((risk, i) => {
          // Calculate text height first
          pdf.setFontSize(9);
          const riskLines = pdf.splitTextToSize(risk, contentWidth - 6);
          const textHeight = riskLines.length * (9 * 0.35);
          const boxHeight = Math.max(15, textHeight + 12);
          
          checkPageBreak(boxHeight + 5);
          
          // Draw box with calculated height
          pdf.setFillColor(254, 242, 242);
          pdf.setDrawColor(239, 68, 68);
          pdf.setLineWidth(1);
          pdf.line(margin, yPos, margin, yPos + boxHeight);
          pdf.rect(margin, yPos, contentWidth, boxHeight, 'FD');
          
          // Add text
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`Risk ${i + 1}:`, margin + 3, yPos + 5);
          pdf.setFont('helvetica', 'normal');
          pdf.text(riskLines, margin + 3, yPos + 10);
          
          yPos += boxHeight + 3;
        });
      } else {
        pdf.setFillColor(240, 253, 244);
        pdf.rect(margin, yPos, contentWidth, 15, 'F');
        pdf.setTextColor(16, 185, 129);
        pdf.setFontSize(10);
        pdf.text('No significant risks identified. This project shows good security practices.', pageWidth / 2, yPos + 10, { align: 'center' });
        yPos += 20;
      }

      // Recommendations
      checkPageBreak(15);
      pdf.setFillColor(243, 244, 246);
      pdf.rect(margin, yPos, contentWidth, 10, 'F');
      pdf.setDrawColor(37, 99, 235);
      pdf.line(margin, yPos, margin, yPos + 10);
      pdf.setTextColor(30, 64, 175);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Recommendations', margin + 5, yPos + 7);
      
      yPos += 15;

      if (recommendations.length > 0) {
        recommendations.forEach((rec, i) => {
          // Calculate text height first
          pdf.setFontSize(9);
          const recLines = pdf.splitTextToSize(rec, contentWidth - 11);
          const textHeight = recLines.length * (9 * 0.35);
          const boxHeight = Math.max(15, textHeight + 10);
          
          checkPageBreak(boxHeight + 5);
          
          // Draw box with calculated height
          pdf.setFillColor(239, 246, 255);
          pdf.setDrawColor(59, 130, 246);
          pdf.setLineWidth(1);
          pdf.line(margin, yPos, margin, yPos + boxHeight);
          pdf.rect(margin, yPos, contentWidth, boxHeight, 'FD');
          
          // Add text
          pdf.setTextColor(0, 0, 0);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${i + 1}.`, margin + 3, yPos + 5);
          pdf.setFont('helvetica', 'normal');
          pdf.text(recLines, margin + 8, yPos + 5);
          
          yPos += boxHeight + 3;
        });
      } else {
        pdf.setFillColor(239, 246, 255);
        pdf.rect(margin, yPos, contentWidth, 15, 'F');
        pdf.setTextColor(59, 130, 246);
        pdf.setFontSize(10);
        pdf.text('No specific recommendations. This project appears to follow best practices.', pageWidth / 2, yPos + 10, { align: 'center' });
        yPos += 20;
      }

      // Footer
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      pdf.setFont('helvetica', 'italic');
      const disclaimer = 'DISCLAIMER: This report is generated by TrustScan AI for informational purposes only. It should not be considered as financial, investment, or legal advice.';
      const disclaimerLines = pdf.splitTextToSize(disclaimer, contentWidth);
      
      // Add footer on last page
      const footerY = pageHeight - 20;
      pdf.text(disclaimerLines, pageWidth / 2, footerY, { align: 'center' });
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated by TrustScan AI | © ${new Date().getFullYear()} All rights reserved`, pageWidth / 2, footerY + 10, { align: 'center' });

      // Save PDF
      pdf.save(`TrustScan-Audit-Report-${audit.id || Date.now()}.pdf`);
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const sections: ExpandableSection[] = [
    {
      id: 'overview',
      title: 'Trust Score Overview',
      icon: '📊',
      defaultExpanded: true,
      content: (
        <div className="space-y-6">
          <TrustScore 
            score={trust_score} 
            breakdown={factors}
            animated={true}
            showDetails={true}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{trust_score}</div>
              <div className="text-sm text-blue-800">Trust Score</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(factors).filter(v => v >= 70).length}
              </div>
              <div className="text-sm text-green-800">Strong Areas</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{risks.length}</div>
              <div className="text-sm text-red-800">Risk Factors</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'factors',
      title: 'Detailed Factor Analysis',
      icon: '🔍',
      content: (
        <div className="space-y-6">
          {Object.entries(factors).map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            const explanation = explanations[key] || 'No detailed explanation available.';
            
            return (
              <div key={key} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-semibold text-gray-800">{label}</h4>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      value >= 80 ? 'bg-green-100 text-green-800' :
                      value >= 60 ? 'bg-blue-100 text-blue-800' :
                      value >= 40 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {value}%
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-1000 ${
                      value >= 80 ? 'bg-green-500' :
                      value >= 60 ? 'bg-blue-500' :
                      value >= 40 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${value}%` }}
                  />
                </div>
                
                <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
              </div>
            );
          })}
        </div>
      )
    },
    {
      id: 'risks',
      title: 'Risk Assessment',
      icon: '⚠️',
      content: (
        <div className="space-y-4">
          {risks.length > 0 ? (
            risks.map((risk, index) => (
              <div key={index} className="p-4 border-l-4 border-red-400 bg-red-50 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                    !
                  </div>
                  <div className="flex-1">
                    <p className="text-red-800 font-medium">{risk}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500 bg-green-50 rounded-lg border border-green-200">
              <div className="text-4xl mb-2">✅</div>
              <p className="font-medium">No significant risks identified</p>
              <p className="text-sm mt-1">This project shows good security practices and transparency.</p>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'recommendations',
      title: 'Recommendations',
      icon: '💡',
      content: (
        <div className="space-y-4">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => (
              <div key={index} className="p-4 border-l-4 border-blue-400 bg-blue-50 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-800">{rec}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500 bg-gray-50 rounded-lg">
              <div className="text-4xl mb-2">👍</div>
              <p className="font-medium">No specific recommendations</p>
              <p className="text-sm mt-1">This project appears to follow best practices.</p>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Report Header */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  trust_score >= 80 ? 'bg-green-500' :
                  trust_score >= 60 ? 'bg-blue-500' :
                  trust_score >= 40 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                Trust Audit Report
              </CardTitle>
              <div className="mt-3 space-y-2">
                <p className="text-gray-600 break-all">
                  <span className="font-medium">Project:</span> {url}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-gray-500">
                  <span>Generated on {new Date(created_at).toLocaleDateString()}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{new Date(created_at).toLocaleTimeString()}</span>
                  {audit.id && (
                    <>
                      <span className="hidden sm:inline">•</span>
                      <span className="font-mono text-xs">ID: {audit.id.slice(0, 8)}...</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {onRefresh && (
                <Button 
                  onClick={onRefresh} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              )}
              
              <Button 
                onClick={handleCopyLink} 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="hidden sm:inline text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </>
                )}
              </Button>
              
              {allowExport && (
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                  disabled={exportLoading}
                  className="flex items-center gap-2"
                >
                  {exportLoading ? (
                    <>
                      <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                      <span className="hidden sm:inline">Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Export PDF</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Expandable Sections */}
      {sections.map((section) => (
        <Card key={section.id} className="shadow-sm">
          <CardHeader 
            className="cursor-pointer hover:bg-gray-50 transition-colors duration-200"
            onClick={() => toggleSection(section.id)}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-3">
                <span className="text-xl sm:text-2xl">{section.icon}</span>
                <span className="break-words">{section.title}</span>
              </CardTitle>
              <div className={`transform transition-transform duration-200 flex-shrink-0 ${
                expandedSections.has(section.id) ? 'rotate-180' : ''
              }`}>
                <ChevronDown className="w-5 h-5 text-gray-500" />
              </div>
            </div>
          </CardHeader>
          
          {expandedSections.has(section.id) && (
            <CardContent className="pt-0">
              <div className="border-t border-gray-200 pt-6">
                {section.content}
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      {/* Quick Actions */}
      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button 
              variant="outline" 
              onClick={() => window.open(url, '_blank')}
              className="flex items-center justify-center gap-2 flex-1 sm:flex-none"
            >
              <ExternalLink className="w-4 h-4" />
              Visit Project
            </Button>
            
            <Button 
              variant="outline"
              onClick={handleCopyFullReport}
              className="flex items-center justify-center gap-2 flex-1 sm:flex-none"
            >
              {copySuccess ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Full Report
                </>
              )}
            </Button>
            
            <Button 
              variant="default"
              onClick={handleDownloadPDF}
              disabled={exportLoading}
              className="flex items-center justify-center gap-2 flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
            >
              {exportLoading ? (
                <>
                  <div className="w-4 h-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Report
                </>
              )}
            </Button>
            
            {onRefresh && (
              <Button 
                variant="outline"
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center justify-center gap-2 flex-1 sm:flex-none"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Re-analyze
              </Button>
            )}
            
            <Button 
              variant="outline"
              onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Just analyzed ${url} with @TrustScanAI - Trust Score: ${trust_score}/100`)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
              className="flex items-center justify-center gap-2 flex-1 sm:flex-none"
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
          
          {/* Success Message */}
          {copySuccess && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Full report copied to clipboard!
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}