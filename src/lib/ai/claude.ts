// Claude API Integration for Diligence Risk Analysis
import Anthropic from '@anthropic-ai/sdk';
import type { RiskAnalysisInput, RiskAnalysisResult } from '@/lib/diligence/types';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for risk analysis (Danish)
const RISK_ANALYSIS_SYSTEM_PROMPT = `Du er en ekspert i due diligence for dansk ejendomsinvestering.
Din opgave er at analysere ejendomsdata og sammenligne dem med information fra uploadede dokumenter for at identificere potentielle risici.

Du skal analysere følgende:
1. **Arealuoverensstemmelser**: Sammenlign BBR-lignende areal (gross_area_m2) med arealer nævnt i dokumenter
2. **Anvendelsesuoverensstemmelser**: Kontroller om den faktiske brug matcher lokalplanens tilladte anvendelse (lokalplan_use)
3. **Forureningsrisici**: Vurder risiko baseret på forureningsniveau (V1 = mulig forurening, V2 = konstateret forurening)
4. **Energimærke**: Energimærker under C indikerer potentielle capex-behov for energiforbedringer
5. **Værdiansættelsesuoverensstemmelser**: Sammenlign offentlig vurdering med eventuelle prisindikationer i dokumenter
6. **Lokalplanuoverensstemmelser**: Kontroller etageantal, bygningshøjde og anvendelse mod lokalplanregler

Sværhedsgrader:
- "low": Mindre uoverensstemmelser eller notificering
- "medium": Betydelige uoverensstemmelser der kræver opmærksomhed
- "high": Alvorlige risici der kræver handling før investering

Overordnet risikoniveau:
- "Groen": Ingen væsentlige risici identificeret
- "Gul": Moderate risici der kræver yderligere undersøgelse
- "Roed": Alvorlige risici der fraråder investering uden afklaring

VIGTIGT: Alle tekster skal være på dansk. Vær specifik med referencer til data.

Returnér ALTID et JSON-objekt med denne præcise struktur:
{
  "risks": [
    {
      "id": "risk_1",
      "title": "Kort titel på dansk",
      "description": "Detaljeret beskrivelse på dansk",
      "severity": "low" | "medium" | "high",
      "evidence": "Specifik reference til data der understøtter risikoen"
    }
  ],
  "overall_risk_level": "Groen" | "Gul" | "Roed",
  "summary_bullets": ["Hovedpunkt 1 på dansk", "Hovedpunkt 2 på dansk"],
  "danish_summary": "En samlet vurdering på dansk (2-3 sætninger der opsummerer analysen)"
}`;

/**
 * Run risk analysis using Claude 3.5 Sonnet
 */
export async function runClaudeRiskAnalysis(
  input: RiskAnalysisInput
): Promise<RiskAnalysisResult> {
  const userMessage = buildUserMessage(input);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: RISK_ANALYSIS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  // Extract text content from response
  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse JSON from response (Claude may wrap in markdown code blocks)
  let jsonStr = textContent.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const result = JSON.parse(jsonStr) as RiskAnalysisResult;

    // Validate the structure
    if (!result.risks || !Array.isArray(result.risks)) {
      result.risks = [];
    }
    if (!result.overall_risk_level) {
      result.overall_risk_level = 'Gul';
    }
    if (!result.summary_bullets || !Array.isArray(result.summary_bullets)) {
      result.summary_bullets = [];
    }
    if (!result.danish_summary) {
      result.danish_summary = 'Analysen kunne ikke generere en opsummering.';
    }

    return result;
  } catch (parseError) {
    console.error('Failed to parse Claude response:', parseError);
    console.error('Raw response:', jsonStr);

    // Return a default error response
    return {
      risks: [{
        id: 'error_1',
        title: 'Analysefejl',
        description: 'Der opstod en fejl under analysen af data. Prøv venligst igen.',
        severity: 'medium',
        evidence: 'Teknisk fejl i AI-analysen'
      }],
      overall_risk_level: 'Gul',
      summary_bullets: ['Analysen kunne ikke gennemføres korrekt'],
      danish_summary: 'Der opstod en teknisk fejl under analysen. Resultaterne bør verificeres manuelt.'
    };
  }
}

/**
 * Build the user message for Claude with all property data
 */
function buildUserMessage(input: RiskAnalysisInput): string {
  const sections: string[] = [];

  // Property data section
  sections.push(`## EJENDOMSDATA (BBR-lignende)
Adresse: ${input.propertyData.address}
Postnummer: ${input.propertyData.postalCode}
By: ${input.propertyData.city}
Kommune: ${input.propertyData.municipalityCode || 'Ikke angivet'}
Matrikelnummer: ${input.propertyData.cadastralNumber || 'Ikke angivet'}
Opførelsesår: ${input.propertyData.buildingYear || 'Ikke angivet'}
Bruttoareal: ${input.propertyData.grossAreaM2 ? `${input.propertyData.grossAreaM2} m²` : 'Ikke angivet'}
Primær anvendelse: ${input.propertyData.primaryUse || 'Ikke angivet'}
Varmetype: ${input.propertyData.heatingType || 'Ikke angivet'}`);

  // Energy label section
  if (input.energyLabel) {
    sections.push(`## ENERGIMÆRKNING
Energimærke: ${input.energyLabel.label}
Sidste inspektion: ${input.energyLabel.lastInspectionDate ? new Date(input.energyLabel.lastInspectionDate).toLocaleDateString('da-DK') : 'Ikke angivet'}
Årligt energiforbrug: ${input.energyLabel.annualEnergyConsumptionKwh ? `${input.energyLabel.annualEnergyConsumptionKwh} kWh` : 'Ikke angivet'}
Forbedringshenstillinger: ${input.energyLabel.improvementRecommendations ? JSON.stringify(input.energyLabel.improvementRecommendations, null, 2) : 'Ingen'}`);
  } else {
    sections.push(`## ENERGIMÆRKNING
Ikke tilgængelig`);
  }

  // Zoning data section
  if (input.zoningData) {
    sections.push(`## LOKALPLANDATA
Tilladt anvendelse: ${input.zoningData.lokalplanUse || 'Ikke angivet'}
Lokalplan ID: ${input.zoningData.lokalplanId || 'Ikke angivet'}
Maks. etager: ${input.zoningData.maxFloors || 'Ikke angivet'}
Maks. højde: ${input.zoningData.maxHeightM ? `${input.zoningData.maxHeightM} m` : 'Ikke angivet'}
Noter: ${input.zoningData.notes || 'Ingen'}`);
  } else {
    sections.push(`## LOKALPLANDATA
Ikke tilgængelig`);
  }

  // Contamination data section
  if (input.contaminationData) {
    const levelDescriptions: Record<string, string> = {
      None: 'Ingen registreret forurening',
      V1: 'Vidensniveau 1 - Mulig forurening',
      V2: 'Vidensniveau 2 - Konstateret forurening',
    };
    sections.push(`## FORURENINGSDATA
Forureningsniveau: ${levelDescriptions[input.contaminationData.contaminationLevel] || input.contaminationData.contaminationLevel}
Kilde: ${input.contaminationData.sourceSystem || 'Ikke angivet'}
Noter: ${input.contaminationData.notes || 'Ingen'}`);
  } else {
    sections.push(`## FORURENINGSDATA
Ikke tilgængelig`);
  }

  // Registry valuation section
  if (input.registryValuation) {
    sections.push(`## OFFENTLIG VURDERING
Vurdering: ${input.registryValuation.publicValuationAmount ? `${input.registryValuation.publicValuationAmount.toLocaleString('da-DK')} kr.` : 'Ikke angivet'}
Vurderingsår: ${input.registryValuation.valuationYear || 'Ikke angivet'}
Vurderingsmetode: ${input.registryValuation.valuationMethod || 'Ikke angivet'}`);
  } else {
    sections.push(`## OFFENTLIG VURDERING
Ikke tilgængelig`);
  }

  // PDF extraction section
  if (input.pdfExtraction) {
    const structuredFieldsStr = input.pdfExtraction.structuredFields
      ? `
Areal fra dokument: ${input.pdfExtraction.structuredFields.area ? `${input.pdfExtraction.structuredFields.area} m²` : 'Ikke fundet'}
Leje fra dokument: ${input.pdfExtraction.structuredFields.rent ? `${input.pdfExtraction.structuredFields.rent.toLocaleString('da-DK')} kr.` : 'Ikke fundet'}
Anvendelse fra dokument: ${input.pdfExtraction.structuredFields.use || 'Ikke fundet'}
Lejer: ${input.pdfExtraction.structuredFields.tenantName || 'Ikke fundet'}
Lejestart: ${input.pdfExtraction.structuredFields.leaseStart || 'Ikke fundet'}
Lejeslut: ${input.pdfExtraction.structuredFields.leaseEnd || 'Ikke fundet'}`
      : 'Ingen strukturerede felter ekstraheret';

    // Truncate raw text if too long
    const rawText = input.pdfExtraction.rawText || 'Ingen tekst ekstraheret';
    const truncatedText = rawText.length > 15000
      ? rawText.substring(0, 15000) + '\n\n[... tekst afkortet ...]'
      : rawText;

    sections.push(`## DOKUMENT-UDTRÆK
### Strukturerede felter
${structuredFieldsStr}

### Rå tekst fra dokument
${truncatedText}`);
  } else {
    sections.push(`## DOKUMENT-UDTRÆK
Ingen PDF uploadet eller analyseret`);
  }

  // Official BBR data section (from Datafordeler)
  if (input.bbrData) {
    sections.push(`## OFFICIELLE BBR-DATA (fra Datafordeler.dk)
Beboelsesareal: ${input.bbrData.livingAreaM2 ? `${input.bbrData.livingAreaM2} m²` : 'Ikke angivet'}
Erhvervsareal: ${input.bbrData.commercialAreaM2 ? `${input.bbrData.commercialAreaM2} m²` : 'Ikke angivet'}
Antal etager: ${input.bbrData.numberOfFloors || 'Ikke angivet'}
Tagmateriale: ${input.bbrData.roofMaterial || 'Ikke angivet'}
Ydervægsmateriale: ${input.bbrData.wallMaterial || 'Ikke angivet'}
Vandforsyning: ${input.bbrData.waterSupply || 'Ikke angivet'}
Afløbsforhold: ${input.bbrData.drainage || 'Ikke angivet'}
Forureningskode: ${input.bbrData.contaminationCode || 'Ikke kortlagt'}
BFE-nummer: ${input.bbrData.bfeNumber || 'Ikke angivet'}
Data hentet: ${new Date(input.bbrData.fetchedAt).toLocaleDateString('da-DK')}`);
  }

  // BBR Discrepancies section
  if (input.bbrDiscrepancies && input.bbrDiscrepancies.length > 0) {
    const discrepancyLines = input.bbrDiscrepancies.map((d) => {
      const severityLabel = d.severity === 'error' ? '🔴' : d.severity === 'warning' ? '🟡' : '🔵';
      return `${severityLabel} ${d.message}`;
    });
    sections.push(`## UOVERENSSTEMMELSER MELLEM BBR OG DOKUMENTER
VIGTIGT: Følgende uoverensstemmelser er fundet mellem officielle BBR-data og data i dokumenter/database:

${discrepancyLines.join('\n')}`);
  }

  // Final instruction
  sections.push(`
---

Analyser ovenstående data og identificer alle potentielle risici for en ejendomsinvestor.
Vær SÆRLIGT opmærksom på:
1. Uoverensstemmelser mellem officielle BBR-data og dokumentdata
2. Uoverensstemmelser mellem databasedata og dokumentdata
3. Forureningsrisici baseret på BBR-data
4. Energimæssige risici
5. Lokalplanuoverensstemmelser

Returnér din analyse som et JSON-objekt med den specificerede struktur.`);

  return sections.join('\n\n');
}

/**
 * Test the Claude connection
 */
export async function testClaudeConnection(): Promise<boolean> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Svar kun med "OK" hvis du kan modtage denne besked.' }],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    return !!textContent;
  } catch (error) {
    console.error('Claude connection test failed:', error);
    return false;
  }
}
