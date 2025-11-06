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

export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
