// Utility functions moved outside components to avoid recreation on every render

export const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
};

export const truncate = (text, length = 150) => {
    if (!text) return '';
    const stripped = stripHtml(text);
    if (stripped.length <= length) return stripped;
    return stripped.substring(0, length) + '...';
};

export const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
};
