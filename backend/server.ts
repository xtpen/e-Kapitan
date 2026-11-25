import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// This file runs from backend/ in dev (tsx server.ts) and from backend/dist/ once built.
const RUNNING_BUILD = path.basename(__dirname) === 'dist';
const BACKEND_ROOT = RUNNING_BUILD ? path.dirname(__dirname) : __dirname;
const FRONTEND_DIST = path.resolve(BACKEND_ROOT, '../frontend/dist');
// The built server serves the built app. NODE_ENV=production does the same for the dev entry.
const SERVE_FRONTEND = RUNNING_BUILD || process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  // Hosts such as Cloud Run set PORT; locally it stays 3000 so the Vite proxy finds it.
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // In-memory or preconfigured Barangay Knowledge Base for the AI Assistant
  const BARANGAY_KNOWLEDGE = `
BARANGAY JURISDICTION & PROFILE:
- Barangay Name: Barangay San Jose (District 1)
- City / Municipality: Pasig City, Metro Manila
- Office Hours: Monday to Friday, 8:00 AM to 5:00 PM (Cut-off for on-site queue: 4:30 PM)
- Emergency Hotlines:
  * Barangay Emergency Response: (02) 8642-1111 / 0917-888-JOSE (5673)
  * Barangay Tanod Headquarters: (02) 8642-2222
  * Barangay Health Center: (02) 8642-3333
  * Fire / Police Emergency: 911 / 166

SERVICES & DOCUMENT REQUIREMENTS:
1. Barangay Clearance:
   - Purpose: Employment, business permit, postal ID, bank requirement, loan application, travel requirement.
   - Requirements: 
     * Valid Government-issued ID with address or proof of residency
     * Community Tax Certificate (Cedula) for the current year
     * 1x1 or 2x2 ID picture
   - Fee: ₱50.00 (Standard Employment) / ₱100.00 (Commercial/Business) / FREE for First-Time Jobseekers under Republic Act 11261.
   - Processing time: 10 - 20 minutes (express on-site) or within 24 hours online.

2. Certificate of Residency:
   - Purpose: School enrollment, scholarship, bank account opening, utility transfer, voter transfer.
   - Requirements:
     * Proof of billing under resident's name or Certificate from Homeowners Association / Landlord contract
     * Valid ID showing residency in Barangay San Jose (at least 6 months residency)
   - Fee: ₱30.00 (Standard) / FREE for students and indigents.
   - Processing time: 10 - 15 minutes.

3. Certificate of Indigency:
   - Purpose: Financial assistance, medical assistance (DSWD, Malasakit, PCSO), legal aid (PAO), burial assistance.
   - Requirements:
     * Endorsement letter from Barangay Kagawad on Committee on Social Services OR Purok Leader verification
     * Valid ID or Voter's Certificate
   - Fee: COMPLETELY FREE (₱0.00).
   - Processing time: Same day release upon verification.

4. Barangay Business Clearance:
   - Purpose: Mayor's Business Permit renewal, new business establishment inside the barangay.
   - Requirements:
     * DTI Registration Certificate (Sole Proprietorship) or SEC Registration (Corporation/Partnership)
     * Lease Contract or Proof of Property Ownership
     * Previous year's Barangay Business Permit (for renewals)
     * Fire Safety Inspection Certificate
   - Fee: ₱300.00 - ₱1,500.00 depending on gross capital / business category.
   - Processing time: 1 to 2 business days.

5. Lupon Tagapamayapa / Barangay Blotter & Conciliation:
   - For neighbor disputes, noise complaints, minor civil damages, tenancy concerns.
   - File personal blotter at Barangay Hall or online via eKapitan Incident Portal.
   - Schedule of mediation: Mondays, Wednesdays, and Fridays 1:00 PM - 4:00 PM.

6. Health Center Services:
   - Immunization: Every Wednesday 8:00 AM - 12:00 PM.
   - Prenatal Checkups: Tuesdays and Thursdays 8:00 AM - 3:00 PM.
   - Senior Citizen Maintenance Medicine Distribution: 1st and 3rd Friday of every month.

RULES FOR THE AI ASSISTANT:
- You are "Ka-Barangay AI", the friendly, approachable virtual civic assistant of Barangay San Jose.
- Answer in clear, polite, and reassuring tone. You may answer in English, Tagalog, or natural conversational Taglish.
- STRICT RULE: You are an informational assistant only. You DO NOT make official decisions, approve permits, or determine eligibility.
- STRICT RULE: Your answers MUST be grounded strictly in the provided Barangay information above. If a resident asks something outside the barangay's services (e.g., how to renew a passport, NBI clearance requirements, national laws), clearly explain that this service is handled by the relevant national agency (DFA, NBI, etc.) and advise them to coordinate with the proper office. If information is not in the knowledge base, state politely that the details are not available and provide the Barangay Hall contact number.
`;

  // API endpoint for AI Citizen Assistant
  app.post('/api/ai-assistant', async (req, res) => {
    try {
      const { message, chatHistory } = req.body;
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
        try {
          const ai = new GoogleGenAI({ apiKey });
          
          const prompt = `System Instructions:
${BARANGAY_KNOWLEDGE}

Current Citizen Query: "${message}"

Please provide a helpful, concise, well-structured, and polite response for the citizen. Use bullet points for requirements or steps. End with an encouraging civic note or hotline reminder if relevant.`;

          const response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          });

          return res.json({
            reply: response.text || 'Paumanhin, hindi maiproseso ang iyong katanungan sa ngayon. Mangyaring tumawag sa Barangay Hall sa (02) 8642-1111.',
            source: 'gemini-ai'
          });
        } catch (apiError: any) {
          console.warn('Gemini API call failed, falling back to local knowledge engine:', apiError?.message);
        }
      }

      // Fallback: Local deterministic knowledge engine
      const query = message.toLowerCase();
      let reply = '';

      if (query.includes('clearance') || query.includes('barangay clearance')) {
        reply = `📄 **Barangay Clearance Guide:**\n\n**Requirements:**\n• Valid Government-issued ID with address or proof of residency\n• Cedula (Community Tax Certificate) for the current year\n• 1x1 or 2x2 ID picture\n\n**Fees:**\n• Standard Employment: ₱50.00\n• Commercial/Business: ₱100.00\n• **FREE** for First-Time Jobseekers (RA 11261)\n\n**How to request:** You can submit an online request right now in the **Document Services** tab!`;
      } else if (query.includes('residency') || query.includes('certificate of residency')) {
        reply = `🏠 **Certificate of Residency Guide:**\n\n**Requirements:**\n• Proof of billing under resident's name or Certificate from Homeowners/Landlord\n• Valid ID showing at least 6 months residency in Barangay San Jose\n\n**Fee:** ₱30.00 (Standard) / FREE for students & seniors.\n\n**Processing time:** 10-15 minutes or ready for pickup within 24 hours.`;
      } else if (query.includes('indigency') || query.includes('indigent') || query.includes('tulong') || query.includes('financial')) {
        reply = `🤝 **Certificate of Indigency Guide:**\n\n**Requirements:**\n• Endorsement letter from Barangay Kagawad (Committee on Social Services) or Purok Leader verification\n• Valid ID or Voter's Certificate\n\n**Fee:** **COMPLETELY FREE (₱0.00)**.\n\n**Uses:** DSWD assistance, Malasakit Center, PAO legal aid, hospital discount.`;
      } else if (query.includes('business') || query.includes('negosyo') || query.includes('permit')) {
        reply = `🏢 **Barangay Business Clearance:**\n\n**Requirements:**\n• DTI Registration (Sole) or SEC Registration\n• Lease Contract or Proof of Property Ownership\n• Previous year's permit (for renewal)\n• Fire Safety Certificate\n\n**Fees:** ₱300 - ₱1,500 depending on capital.`;
      } else if (query.includes('complaint') || query.includes('reklamo') || query.includes('incident') || query.includes('blotter')) {
        reply = `⚖️ **Reporting a Complaint or Incident:**\n\nResidents may file a community report or request conciliation:\n1. Use the **Complaints & Reports** tab in eKapitan.\n2. Provide the date, time, location, and description (photos optional).\n3. You will receive a unique tracking reference number immediately.\n4. Barangay conciliation sessions take place Mon/Wed/Fri 1:00 PM - 4:00 PM at the Lupon office.`;
      } else if (query.includes('hours') || query.includes('oras') || query.includes('open') || query.includes('schedule') || query.includes('bukas')) {
        reply = `⏰ **Barangay Hall Office Hours:**\n\n• **Monday to Friday:** 8:00 AM to 5:00 PM\n• **Queue Cut-off:** 4:30 PM\n• **Emergency Hotlines (24/7):** (02) 8642-1111 / 0917-888-JOSE`;
      } else if (query.includes('health') || query.includes('bakuna') || query.includes('gamot') || query.includes('doktor')) {
        reply = `🏥 **Health Center Schedule:**\n\n• **Child Immunization:** Every Wednesday 8:00 AM - 12:00 PM\n• **Prenatal Care:** Tuesdays & Thursdays 8:00 AM - 3:00 PM\n• **Senior Maintenance Medicine:** 1st & 3rd Friday of every month`;
      } else {
        reply = `Kumusta! Ako si **Ka-Barangay AI**, ang inyong digital citizen information assistant sa Barangay San Jose.\n\nNandito ako para magbigay ng gabay sa:\n• Requirements para sa **Barangay Clearance, Certificate of Residency, at Indigency**\n• **Business Clearance** at permit steps\n• Pag-file ng **Complaints at Incident Reports**\n• Schedule ng opisina at Health Center\n\nPaalala: Bilang information assistant, hindi ako nagbibigay ng pormal na desisyon. Para sa agarang tulong, tumawag sa Barangay hotline: **(02) 8642-1111**. Ano po ang maipaglilingkod ko?`;
      }

      return res.json({
        reply,
        source: 'knowledge-base'
      });
    } catch (err: any) {
      console.error('Error in /api/ai-assistant:', err);
      res.status(500).json({ error: 'Internal server error processing query' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Unknown API routes get a JSON 404, never the app's HTML page.
  app.use('/api', (req, res) => {
    res.status(404).json({ error: `No API route for ${req.method} ${req.originalUrl}` });
  });

  const indexHtml = path.join(FRONTEND_DIST, 'index.html');
  if (SERVE_FRONTEND && fs.existsSync(indexHtml)) {
    // Built app: hashed assets can be cached for a long time; index.html must always be fresh.
    app.use(express.static(FRONTEND_DIST, { index: false, maxAge: '1y', immutable: true }));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(indexHtml);
    });
  } else {
    if (SERVE_FRONTEND) {
      console.warn(`Frontend build not found at ${FRONTEND_DIST}. Run "npm run build" from the project root first.`);
    }
    app.get('/', (req, res) => {
      res.send('eKapitan API Server is running. In dev mode, run the Vite server in the frontend directory.');
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`eKapitan server running on http://0.0.0.0:${PORT}${SERVE_FRONTEND ? ' (serving the built app)' : ''}`);
  });
}

startServer();
