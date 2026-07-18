// Broker marketing subscription plans. `amount` is in rupees; the server holds
// the authoritative price (see server/src/subscription/subscription.controller.js).
export const PLANS = [
  {
    id: 'essential',
    name: 'Essential Plan',
    dot: '🟢',
    price: 4999,
    priceLabel: '₹4,999',
    period: '/month',
    tagline: 'Perfect for individual property brokers starting digital marketing.',
    highlighted: false,
    inherits: null,
    sections: [
      { title: 'Branding & Online Presence', items: [
        'Custom Broker Logo',
        'Professional Headline & Business Branding',
        'Your Logo & Slogan shown to buyers in your pincodes (app)',
        'Dedicated Subdomain',
        'Basic SEO Setup',
        'Mobile-Friendly Landing Page',
      ] },
      { title: 'Social Media Content', items: [
        '8 Static Property Creatives',
        '8 Carousel Property Creatives',
        '4 Story Creatives',
        '2 Promotional Banner Designs',
      ] },
      { title: 'Ad Copywriting', items: [
        'High-Converting Primary Ad Copy',
        'Multiple Ad Headlines',
        'Call-to-Action (CTA) Copy',
        'Property Description Copy',
      ] },
      { title: 'Meta Advertising', items: [
        'Weekend Carousel Ad Campaigns',
        'Basic Campaign Setup',
        'Audience Targeting',
        'Ad Monitoring',
      ] },
      { title: 'Digital Marketing', items: [
        'Social Media Marketing (Facebook & Instagram)',
        'Google Business Profile Setup',
        'Basic Digital Marketing Strategy',
      ] },
      { title: 'Support', items: [
        'Monthly Content Planning',
        'WhatsApp Support',
      ] },
    ],
    bestFor: [
      'Individual Property Brokers',
      'Small Real Estate Agencies',
      'Brokers generating local leads',
    ],
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    dot: '🔵',
    price: 9999,
    priceLabel: '₹9,999',
    period: '/month',
    tagline: 'Complete digital marketing solution for serious brokers looking to generate consistent property leads.',
    highlighted: true,
    inherits: 'Everything included in the Essential Plan, plus:',
    sections: [
      { title: 'Professional Branding', items: [
        'Dedicated Domain',
        'Dedicated Subdomain',
        'Advanced SEO',
        'Premium Custom Logo',
        'Brand Slogan',
      ] },
      { title: 'Sales & Lead Management', items: [
        'Sales Team Assistance',
        'Lead Management Dashboard',
        'Telecalling Support',
        'Lead Follow-up Process',
      ] },
      { title: 'Social Media Content', items: [
        '12 Premium Property Creatives',
        '4 Professionally Edited Property Reels (client provides raw video footage)',
        'Promotional Posts',
        'Festival & Trending Content',
      ] },
      { title: 'Meta Advertising', items: [
        '3 Active Meta Ad Campaigns',
        'Reel Advertising',
        'Lead Generation Campaigns',
        'Weekend Carousel Ads',
        'Audience Optimization',
      ] },
      { title: 'Digital Marketing', items: [
        'Complete Digital Marketing Management',
        'Google Business Profile Optimization',
        'Advanced Marketing Strategy & Funnels',
      ] },
      { title: 'Marketing & Analytics', items: [
        'Basic Remarketing Campaign',
        'Weekly Performance Report',
        'Basic Competitor Ad Analysis',
        'Lead Quality Analysis',
      ] },
      { title: 'Consulting', items: [
        'Two Marketing Strategy Calls Every Month',
        'Campaign Review',
        'Growth Suggestions',
      ] },
      { title: 'Priority Support', items: [
        'Priority WhatsApp Support',
        'Faster Creative Delivery',
        'Campaign Assistance',
      ] },
    ],
    bestFor: [
      'Serious brokers scaling lead generation',
      'Agencies wanting a full marketing team',
    ],
  },
  {
    id: 'master',
    name: 'Master Broker Plan',
    dot: '🟣',
    price: 50000,
    priceLabel: '₹50,000',
    period: '/month',
    tagline: 'Full master broker authority — manage sub-brokers, own territory, and earn commissions across your network.',
    highlighted: false,
    inherits: null,
    sections: [
      { title: 'Territory & Sub-Brokers', items: [
        'Own a dedicated pincode territory (coverageAreas)',
        'Create and manage sub-broker accounts',
        'Distribute pincodes to sub-brokers',
        'Commission sharing on sub-broker deals',
      ] },
      { title: 'Visiting Card & Branding', items: [
        'Enhanced Master Broker visiting card',
        'Your branding shown to buyers in your territory',
        'Master badge on your profile',
      ] },
      { title: 'Lead & Deal Management', items: [
        'Commission approval for broker listings in your territory',
        'Territory-wide listing view',
        'Lead assignment to sub-brokers',
        'Deal tracking & analytics',
      ] },
      { title: 'Pincode Expansion', items: [
        'Request additional pincodes (admin approved)',
        'Auto-inherit pincodes to sub-brokers',
      ] },
      { title: 'Priority Support', items: [
        'Priority WhatsApp Support',
        'Dedicated account manager',
        'Faster resolution',
      ] },
    ],
    bestFor: [
      'Experienced brokers managing a team',
      'Brokers wanting to build a network',
      'Those ready to scale across territories',
    ],
  },
];

export const PLAN_BY_ID = Object.fromEntries(PLANS.map((p) => [p.id, p]));
