/*
 * Privacy Policy, Terms and Conditions and Data Privacy Notice for eKapitan.
 *
 * DRAFT: written in plain language from the Data Privacy Act of 2012 (RA 10173), its IRR and
 * National Privacy Commission guidance. Before launch the barangay's Data Protection Officer
 * (and the municipal legal office) must review it, fill in the DPO's contact details and set the
 * real "Last updated" date. Never put the barangay's name here; the app says "the barangay".
 */

export type LegalDocId = 'privacy_policy' | 'terms' | 'privacy_notice';

export type LegalBlock = string | { list: string[] };

export interface LegalSection {
  heading: string;
  body: LegalBlock[];
}

export interface LegalDoc {
  id: LegalDocId;
  title: string;
  /** One line under the title. */
  summary: string;
  updated: string;
  sections: LegalSection[];
}

const UPDATED = 'November 27, 2026';
const DPO = 'the Data Protection Officer at the barangay hall (weekdays, 8:00 AM to 5:00 PM)';

export const LEGAL_DOCS: Record<LegalDocId, LegalDoc> = {
  privacy_policy: {
    id: 'privacy_policy',
    title: 'Privacy Policy',
    summary: 'How we collect, use, keep and protect your personal information.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Who we are',
        body: [
          'eKapitan is the online service of the barangay. It lets residents request documents, report problems, book the court, visit the hall and ask questions.',
          'The barangay decides how your information is used, so it is the “personal information controller” under the Data Privacy Act of 2012 (Republic Act No. 10173).',
        ],
      },
      {
        heading: 'What we collect',
        body: [
          {
            list: [
              'Account details: your name, birthday, sex, civil status, address, purok, mobile number and email.',
              'Proof of identity: the photo of your valid ID that you upload.',
              'What you ask for: document requests and their purpose, print jobs, court bookings and hall visits.',
              'What you report: the problem, where it happened, photos you add, and the people involved if you name them.',
              'Questions you send to Ask Kap.',
              'Sign-in details: when you sign in and the kind of device you use.',
            ],
          },
          'We only ask for what we need for the service you are using.',
        ],
      },
      {
        heading: 'Why we use it',
        body: [
          {
            list: [
              'To check that you live in the barangay and that you are who you say you are.',
              'To process your requests, reports and bookings, and to release documents to the right person.',
              'To tell you about your requests by app, text message or email, as you choose in Notifications.',
              'To keep the records the barangay must keep by law.',
              'To see how the service is used, in totals only, so we can make it better.',
            ],
          },
          'We never sell your information and we never use it for advertising.',
        ],
      },
      {
        heading: 'Our basis for using it',
        body: [
          'We use your information because you agreed to it when you signed up, because the barangay needs it to carry out its duties as a local government unit, and because some records are required by law (Sections 12 and 13 of the Data Privacy Act).',
        ],
      },
      {
        heading: 'Who can see it',
        body: [
          'Only barangay staff and officials who need it for their work. Each one sees only the parts of the app their job needs, and every time someone opens a resident record it is written to a log that cannot be changed.',
          'We share information outside the barangay only when the law requires it, for example a court order or a request from another government office that has the legal power to ask.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: [
          'We keep your information while your account is open and for as long as the law requires us to keep barangay records (including the rules of the National Archives of the Philippines). After that, we delete it or remove anything that can identify you.',
        ],
      },
      {
        heading: 'How we protect it',
        body: [
          {
            list: [
              'Information travels over an encrypted connection.',
              'Passwords are stored in a form no one can read, not even staff.',
              'Staff accounts only open the parts of the app their work needs.',
              'Opening a resident record is logged, and the log cannot be edited or deleted.',
            ],
          },
          'If a breach ever puts your information at risk, we will tell you and the National Privacy Commission as the law requires.',
        ],
      },
      {
        heading: 'Your rights',
        body: [
          'Under the Data Privacy Act you have the right to:',
          {
            list: [
              'be told how your information is used (this page);',
              'see the information we have about you;',
              'have wrong information corrected;',
              'object to a use, or ask us to delete or block information that is no longer needed or was collected unlawfully;',
              'get a copy of your information in a form you can use elsewhere;',
              'be paid for damages if your information is misused; and',
              'file a complaint with the National Privacy Commission.',
            ],
          },
          'You can correct your mobile number and email yourself in Your profile. For anything else, ask at the barangay hall.',
        ],
      },
      {
        heading: 'Contact us',
        body: [
          `For questions or to use your rights, talk to ${DPO}. You can also contact the National Privacy Commission at privacy.gov.ph.`,
        ],
      },
      {
        heading: 'Changes to this policy',
        body: ['If we change this policy, we will show the new date at the top and tell you in the app before the change takes effect.'],
      },
    ],
  },

  terms: {
    id: 'terms',
    title: 'Terms and Conditions',
    summary: 'The rules for using eKapitan.',
    updated: UPDATED,
    sections: [
      {
        heading: 'Agreeing to these terms',
        body: ['By creating an account or using eKapitan, you agree to these terms and to the Privacy Policy. If you do not agree, please do not use the service; you can still be served at the barangay hall.'],
      },
      {
        heading: 'Who can use eKapitan',
        body: [
          {
            list: [
              'Residents of the barangay who are 18 or older. Younger residents may use it with a parent or guardian.',
              'One account per person. Do not open an account for someone else without their permission.',
              'Barangay staff check new accounts. Some services open only after your account is verified.',
            ],
          },
        ],
      },
      {
        heading: 'Your account',
        body: ['Keep your password to yourself. You are responsible for what is done with your account. If you think someone else has used it, change your password and tell the barangay hall right away.'],
      },
      {
        heading: 'Give true information',
        body: ['Everything you enter and upload must be true and your own. A request with false information or a fake ID will be refused, and false statements in official documents can be punished under the law.'],
      },
      {
        heading: 'Requests, fees and pick-up',
        body: [
          {
            list: [
              'Sending a request online is not an approval. Staff check every request and may ask you to fix something.',
              'Documents are released at the barangay hall to you, or to someone you authorize in writing, after showing a valid ID.',
              'Fees follow the barangay’s ordinances and are paid at the hall.',
              'Times shown in the app (“ready in 1 day”) are estimates, not promises.',
            ],
          },
        ],
      },
      {
        heading: 'Reports',
        body: ['Report real problems only. For emergencies, call 911 first. Reports made in bad faith, or to harass someone, may be acted on by the barangay.'],
      },
      {
        heading: 'Court and hall bookings',
        body: ['Bookings depend on availability. The barangay may move or cancel a booking for official use or safety, and will tell you as early as it can.'],
      },
      {
        heading: 'Ask Kap',
        body: ['Ask Kap answers automatically and can be wrong. Its answers are not legal advice and are not official decisions. When something matters, confirm it at the barangay hall.'],
      },
      {
        heading: 'Using the service properly',
        body: [
          'Do not:',
          {
            list: [
              'pretend to be someone else;',
              'post insulting, threatening or indecent content;',
              'try to get into accounts or parts of the system that are not yours; or',
              'overload, copy or interfere with the service.',
            ],
          },
        ],
      },
      {
        heading: 'When the service is unavailable',
        body: ['We try to keep eKapitan running at all times, but it may stop for maintenance or problems outside our control. The barangay hall stays open for walk-in service.'],
      },
      {
        heading: 'Suspending an account',
        body: ['The barangay may suspend or close an account that breaks these terms. You will be told why and can explain your side at the barangay hall.'],
      },
      {
        heading: 'Limits of responsibility',
        body: ['As far as the law allows, the barangay is not responsible for losses caused by wrong information you gave, by your account being used because your password was shared, or by the service being unavailable.'],
      },
      {
        heading: 'Changes and governing law',
        body: ['We may update these terms and will tell you in the app first. These terms follow the laws of the Republic of the Philippines.'],
      },
    ],
  },

  privacy_notice: {
    id: 'privacy_notice',
    title: 'Data Privacy Notice',
    summary: 'A short notice on what we collect and why.',
    updated: UPDATED,
    sections: [
      {
        heading: 'What we collect',
        body: ['Your name, birthday, sex, civil status, address, contact details and a photo of a valid ID, plus the details of what you request, report or book.'],
      },
      {
        heading: 'Why',
        body: ['To confirm you are a resident, to process what you ask for, to update you about it, and to keep records required by law.'],
      },
      {
        heading: 'Who sees it',
        body: ['Only barangay staff and officials who need it for their work. Every time a record is opened, it is logged. We share it outside the barangay only when the law requires it.'],
      },
      {
        heading: 'How long',
        body: ['For as long as your account is open and the law requires barangay records to be kept, then it is deleted or made anonymous.'],
      },
      {
        heading: 'Your rights',
        body: ['You may see, correct, object to the use of, or ask to delete your information, and you may complain to the National Privacy Commission. See the Privacy Policy for details.'],
      },
      {
        heading: 'Contact',
        body: [`Talk to ${DPO}.`],
      },
      {
        heading: 'Your consent',
        body: ['By creating an account, you agree that the barangay may collect and use your personal information as described here, under the Data Privacy Act of 2012 (RA 10173).'],
      },
    ],
  },
};
