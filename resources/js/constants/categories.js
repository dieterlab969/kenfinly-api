export const categoryIcons = {
  'food-drinks': '🛒',
  'eating-out': '🍽️',
  'bar': '🍺',
  'shopping': '👕',
  'transportation': '🚗',
  'fuel': '⛽',
  'entertainment': '🎉',
  'home': '🏠',
  'family': '👨‍👩‍👧',
  'health-sport': '❤️',
  'pets': '🐾',
  'other-expenses': '📄',
  'salary': '💰',
  'business': '💼',
  'other-income': '💵',
};

export const getCategoryIcon = (slug) => {
  return categoryIcons[slug] || '📄';
};

export const formatCurrency = (amount, currency = 'VND') => {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
];
