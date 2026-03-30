export const TOPIC_REFERENCE_MAP = {
  cardiologia: [
    {
      title: '2025 ACC/AHA/ACEP/NAEMSP/SCAI Guideline for Acute Coronary Syndromes',
      url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001309',
    },
    {
      title: '2022 AHA/ACC/HFSA Guideline for the Management of Heart Failure',
      url: 'https://www.ahajournals.org/doi/10.1161/CIR.0000000000001063',
    },
  ],
  neurologia: [
    {
      title: '2021 AHA/ASA Guideline for the Prevention of Stroke in Patients With Stroke and TIA',
      url: 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000375',
    },
    {
      title: 'AHA/ASA 2019 Update for Early Management of Acute Ischemic Stroke',
      url: 'https://www.ahajournals.org/doi/10.1161/STR.0000000000000211',
    },
  ],
  infectologia: [
    {
      title: 'IDSA Clinical Pathway for Community-Acquired Pneumonia',
      url: 'https://www.idsociety.org/practice-guideline/community-acquired-pneumonia-cap-in-adults/',
    },
    {
      title: 'Surviving Sepsis Campaign International Guidelines 2021',
      url: 'https://link.springer.com/article/10.1007/s00134-021-06506-y',
    },
  ],
  emergencias: [
    {
      title: 'ACLS Algorithms (AHA)',
      url: 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/algorithms',
    },
    {
      title: 'ATLS Student Course Manual (ACS) overview',
      url: 'https://www.facs.org/quality-programs/trauma/education/atls/',
    },
  ],
};

const DEFAULT_REFERENCES = [
  {
    title: 'WHO Clinical management living guidelines',
    url: 'https://www.who.int/publications/i/item/WHO-2019-nCoV-clinical-2024.1',
  },
];

export function getTopicReferences(topicId) {
  return TOPIC_REFERENCE_MAP[topicId] || DEFAULT_REFERENCES;
}

export function formatReferencesForText(topicId) {
  return getTopicReferences(topicId)
    .map((ref) => `${ref.title}: ${ref.url}`)
    .join(' | ');
}
