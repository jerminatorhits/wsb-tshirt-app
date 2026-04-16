/**
 * Shipping address validation so we don't accept payment for addresses that will fail fulfillment.
 * Validates US state + ZIP match (Printful rejects "state and ZIP code don't match").
 */

const US_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA',
  'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR',
  'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'PR', 'VI', 'GU', 'AS', 'MP',
])

/**
 * First 2 digits of US ZIP code -> primary state (USPS). Used to validate state/ZIP consistency.
 * If prefix not in map, we allow (don't block valid addresses we don't have data for).
 */
const ZIP_PREFIX_TO_STATE: Record<string, string> = {
  '00': 'NJ', '01': 'MA', '02': 'RI', '03': 'NH', '04': 'VT', '05': 'NJ', '06': 'CT', '07': 'NJ', '08': 'NJ', '09': 'NJ',
  '10': 'NY', '11': 'NY', '12': 'NY', '13': 'NY', '14': 'NY', '15': 'PA', '16': 'IA', '17': 'NJ', '18': 'MA', '19': 'MA',
  '20': 'VA', '21': 'NC', '22': 'VA', '23': 'KY', '24': 'VA', '25': 'MA', '26': 'OH', '27': 'NC', '28': 'NC', '29': 'SC',
  '30': 'GA', '31': 'GA', '32': 'FL', '33': 'FL', '34': 'FL', '35': 'AL', '36': 'AL', '37': 'TN', '38': 'MS', '39': 'TN',
  '40': 'KY', '41': 'KY', '42': 'KY', '43': 'OH', '44': 'OH', '45': 'OH', '46': 'IN', '47': 'WV', '48': 'MI', '49': 'KY',
  '50': 'IA', '51': 'IA', '52': 'IA', '53': 'WI', '54': 'IL', '55': 'MN', '56': 'SD', '57': 'SD', '58': 'ND', '59': 'MT',
  '60': 'IL', '61': 'IL', '62': 'IL', '63': 'MO', '64': 'MO', '65': 'IL', '66': 'KS', '67': 'KS', '68': 'NE', '69': 'NE',
  '70': 'LA', '71': 'LA', '72': 'AR', '73': 'OK', '74': 'OK', '75': 'TX', '76': 'TX', '77': 'TX', '78': 'TX', '79': 'TX',
  '80': 'CO', '81': 'CO', '82': 'WY', '83': 'ID', '84': 'UT', '85': 'AZ', '86': 'ID', '87': 'NV', '88': 'NV', '89': 'NV',
  '90': 'CA', '91': 'CA', '92': 'CA', '93': 'CA', '94': 'CA', '95': 'CA', '96': 'CA', '97': 'WA', '98': 'WA', '99': 'AK',
}

export interface ShippingAddress {
  name?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}

export interface ValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validate shipping address before payment so fulfillment is unlikely to fail.
 * For US addresses: checks state/ZIP match and required fields.
 */
export function validateShippingAddress(shipping: ShippingAddress): ValidationResult {
  if (!shipping) {
    return { valid: false, error: 'Shipping address is required.' }
  }

  const country = (shipping.country || 'US').toUpperCase().trim()
  const state = (shipping.state || '').toUpperCase().trim().replace(/\s+/g, ' ')
  const zip = (shipping.zip || '').trim().replace(/\s+/g, '')

  const hasAddress = !!(shipping.address && shipping.address.trim())
  const hasCity = !!(shipping.city && shipping.city.trim())
  const hasName = !!(shipping.name && shipping.name.trim())
  const hasEmail = !!(shipping.email && shipping.email.trim())

  if (!hasName) {
    return { valid: false, error: 'Please enter your full name.' }
  }
  if (!hasEmail) {
    return { valid: false, error: 'Please enter your email address.' }
  }
  if (!hasAddress) {
    return { valid: false, error: 'Please enter your street address.' }
  }
  if (!hasCity) {
    return { valid: false, error: 'Please enter your city.' }
  }

  if (country === 'US' || country === 'USA') {
    if (!state) {
      return { valid: false, error: 'Please enter your state.' }
    }
    if (!zip) {
      return { valid: false, error: 'Please enter your ZIP code.' }
    }
    const zip5 = zip.replace(/-.*$/, '').slice(0, 5)
    if (!/^\d{5}$/.test(zip5)) {
      return { valid: false, error: 'Please enter a valid 5-digit ZIP code.' }
    }
    if (!US_STATE_CODES.has(state)) {
      return { valid: false, error: 'Please enter a valid state (e.g. CA, NY).' }
    }
    const prefix = zip5.slice(0, 2)
    const expectedState = ZIP_PREFIX_TO_STATE[prefix]
    if (expectedState && expectedState !== state) {
      return {
        valid: false,
        error: `ZIP code ${zip5} is for ${expectedState}, not ${state}. Please enter the correct state or ZIP code.`,
      }
    }
  }

  return { valid: true }
}
