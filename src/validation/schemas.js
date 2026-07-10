// Frontend form validation schemas — mirror of the server-side Joi schemas,
// with a few form-only extras (e.g. "confirm password" fields the API never sees).
import Joi, {
  name, email, phone, password, otp, pincode, shortText, longText, url, nonNegative, objectId,
} from './common.js';

const stringArray = Joi.array().items(Joi.string().trim());
const confirmOf = (ref) => Joi.any().valid(Joi.ref(ref)).messages({
  'any.only': 'Passwords do not match.',
  'any.required': 'Please confirm your password.',
});

// ── Auth ──────────────────────────────────────────────────────────────────
export const signupSchema = Joi.object({
  name: name.required(),
  email: email.required(),
  phone: phone.required(),
  password: password.required(),
  confirm: confirmOf('password').required(),
  // master_broker is a frontend-only pseudo-role (submitted to API as broker + inquiry).
  role: Joi.string().valid('buyer', 'broker', 'master_broker', 'developer', 'investor', 'bank').required(),
  company: shortText.allow('', null),
  city: shortText.allow('', null),
  area: shortText.allow('', null),
  pincode: pincode.allow('', null),
});

export const loginSchema = Joi.object({
  email: email.required(),
  password: Joi.string().required().messages({ 'string.empty': 'Password is required.' }),
});

export const otpSchema = Joi.object({
  otp: otp.required(),
});

export const forgotPasswordSchema = Joi.object({
  email: email.required(),
});

export const resetPasswordSchema = Joi.object({
  otp: otp.required(),
  newPassword: password.required(),
  confirm: confirmOf('newPassword').required(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({ 'string.empty': 'Current password is required.' }),
  newPassword: password.required(),
  confirm: confirmOf('newPassword').required(),
});

// ── Enquiry ───────────────────────────────────────────────────────────────
export const enquirySchema = Joi.object({
  name: name.required(),
  phone: phone.required(),
  email: email.allow('', null),
  state: shortText.allow('', null),
  city: shortText.allow('', null),
  area: shortText.allow('', null),
  pincode: pincode.allow('', null),
  message: longText.allow('', null),
});

// ── Support chat ──────────────────────────────────────────────────────────
export const supportChatContactSchema = Joi.object({
  name: name.required(),
  phone: phone.required(),
  email: email.allow('', null),
});

// ── Site visit ────────────────────────────────────────────────────────────
export const siteVisitSchema = Joi.object({
  name: name.required(),
  phone: phone.required(),
  email: email.allow('', null),
  date: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).required().messages({
    'string.empty': 'Please pick a date.',
    'string.pattern.base': 'Please pick a valid date.',
  }),
  slot: shortText.required().messages({ 'string.empty': 'Please pick a time slot.' }),
});

// ── Lead ──────────────────────────────────────────────────────────────────
export const leadSchema = Joi.object({
  name: name.required(),
  phone: phone.required(),
  email: email.allow('', null),
  budget: nonNegative.allow('', null),
  status: shortText.allow('', null),
  source: shortText.allow('', null),
});

// ── Investment ────────────────────────────────────────────────────────────
export const investmentSchema = Joi.object({
  projectName: Joi.string().trim().min(2).max(150).required(),
  city: shortText.required(),
  area: shortText.allow('', null),
  pincode: pincode.allow('', null),
  amount: nonNegative.required(),
  returnRate: Joi.number().min(0).max(100).required(),
  durationYears: Joi.number().min(0).max(100).required(),
  startDate: Joi.date().required(),
  adminNote: longText.allow('', null),
});

// ── Property (developer) ──────────────────────────────────────────────────
export const propertySchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  location: shortText.required(),
  city: shortText.allow('', null),
  price: nonNegative.required(),
  type: shortText.allow('', null),
  status: shortText.allow('', null),
  beds: nonNegative.allow('', null),
  baths: nonNegative.allow('', null),
  sqft: nonNegative.allow('', null),
  rera: shortText.allow('', null),
});

// ── Unit property (admin) ─────────────────────────────────────────────────
export const unitPropertySchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: longText.allow('', null),
  city: shortText.required(),
  area: shortText.allow('', null),
  pincode: pincode.allow('', null),
  address: longText.allow('', null),
  propertyType: shortText.allow('', null),
  price: nonNegative.required(),
  areaSqft: nonNegative.allow('', null),
  bedrooms: nonNegative.allow('', null),
  bathrooms: nonNegative.allow('', null),
  reraNumber: shortText.allow('', null),
  sellerName: shortText.allow('', null),
  sellerPhone: phone.allow('', null),
  sellerEmail: email.allow('', null),
});

// ── Mortgage property (bank / admin) ──────────────────────────────────────
export const mortgagePropertySchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  description: longText.allow('', null),
  city: shortText.required(),
  area: shortText.allow('', null),
  pincode: pincode.allow('', null),
  address: longText.allow('', null),
  type: shortText.allow('', null),
  price: nonNegative.required(),
  bedrooms: nonNegative.allow('', null),
  area_sqft: nonNegative.allow('', null),
  bankName: shortText.allow('', null),
  contactPhone: phone.allow('', null),
  localityPrices: Joi.array().items(Joi.object({
    area: shortText.allow('', null),
    pincode: pincode.allow('', null),
    expectedPrice: nonNegative.allow('', null),
  })),
});

// ── Broker listing ────────────────────────────────────────────────────────
export const brokerListingSchema = Joi.object({
  title: Joi.string().trim().min(2).max(200).required(),
  propertyType: shortText.required(),
  city: shortText.required(),
  price: nonNegative.required(),
  address: longText.allow('', null),
  landmark: shortText.allow('', null),
  pincode: pincode.allow('', null),
  sqft: nonNegative.allow('', null),
  beds: nonNegative.allow('', null),
  baths: nonNegative.allow('', null),
  description: longText.allow('', null),
});

// ── Commission rate (admin) ───────────────────────────────────────────────
const pct = Joi.number().min(0).max(100).messages({ 'number.max': 'Must be 100 or less.' });
export const commissionRateSchema = Joi.object({
  propertyType: Joi.string().valid('mortgage', 'unit').required(),
  scope: Joi.string().valid('global', 'city', 'pincode'),
  city: shortText.allow('', null),
  pincode: pincode.allow('', null),
  brokerPercent: pct.allow('', null),
  masterBrokerPercent: pct.allow('', null),
  directMasterBrokerPercent: pct.allow('', null),
});

// ── WhatsApp group (admin) ────────────────────────────────────────────────
export const whatsappGroupSchema = Joi.object({
  type: Joi.string().valid('mortgage', 'unit').required(),
  city: shortText.required(),
  groupName: Joi.string().trim().min(1).max(150).required(),
  link: url.required(),
  description: longText.allow('', null),
});

// ── WhatsApp schedule ─────────────────────────────────────────────────────
export const whatsappScheduleSchema = Joi.object({
  phone: phone.required(),
  message: longText.required().messages({ 'string.empty': 'Message is required.' }),
  scheduledAt: Joi.date().required(),
});

// ── Email campaign / bulk (admin & master broker) ─────────────────────────
export const emailCampaignSchema = Joi.object({
  subject: Joi.string().trim().min(1).max(200).required().messages({ 'string.empty': 'Subject is required.' }),
  body: Joi.string().trim().min(1).max(100000).required().messages({ 'string.empty': 'Body is required.' }),
  senderName: shortText.allow('', null),
});

export const bulkWhatsAppSchema = Joi.object({
  message: longText.required().messages({ 'string.empty': 'Message is required.' }),
  roles: Joi.array().items(Joi.string()).min(1).required().messages({ 'array.min': 'Select at least one role.' }),
});

// ── Master broker ─────────────────────────────────────────────────────────
export const masterBrokerInquirySchema = Joi.object({
  name: name.required(),
  phone: phone.required(),
  email: email.required(),
  motivation: longText.allow('', null),
});

export const subBrokerSchema = Joi.object({
  name: name.required(),
  email: email.required(),
  phone: phone.allow('', null),
  city: shortText.allow('', null),
  area: shortText.allow('', null),
});

// ── Article (admin) ─────────────────────────────────────────────────────────
export const articleSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required().messages({ 'string.empty': 'Title is required.' }),
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9-]+$/).max(220).allow('', null).messages({
    'string.pattern.base': 'Slug can only contain lowercase letters, numbers and hyphens.',
  }),
  shortDescription: shortText.allow('', null),
  content: Joi.string().trim().min(1).max(200000).required().messages({ 'string.empty': 'Content is required.' }),
  excerpt: longText.allow('', null),

  featuredImage: url.allow('', null),
  bannerImage: url.allow('', null),
  galleryImages: stringArray,
  featuredVideo: url.allow('', null),
  videoThumbnail: url.allow('', null),

  category: shortText.required().messages({ 'string.empty': 'Category is required.' }),
  subcategory: shortText.allow('', null),
  tags: stringArray,

  status: Joi.string().valid('draft', 'published'),
});

export { Joi };
