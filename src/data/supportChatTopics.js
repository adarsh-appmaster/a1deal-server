// Fixed quick-topic menu shown when a buyer opens the support chat widget —
// same set everywhere, not context-aware. The topic id/label is only used
// client-side to pick a seed message; it is not stored as a structured field.
export const SUPPORT_TOPICS = [
  {
    id: 'new_project', label: 'New Project', icon: 'apartment',
    seedText: "Hi, I'm interested in learning about new projects available.",
  },
  {
    id: 'site_visit', label: 'Site Visit', icon: 'event',
    seedText: 'Hi, I would like to schedule a site visit.',
  },
  {
    id: 'property_deals', label: 'Property Deals / Mortgage', icon: 'account_balance',
    seedText: 'Hi, I have a question about property deals / mortgage options.',
  },
  {
    id: 'pricing', label: 'Pricing', icon: 'payments',
    seedText: 'Hi, I would like to know more about pricing.',
  },
  {
    id: 'talk_to_agent', label: 'Talk to an Agent', icon: 'support_agent',
    seedText: 'Hi, I would like to talk to an agent.',
  },
];
