/**
 * Format a date to a more readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  // If it's today
  if (diffInDays === 0) {
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    }
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // If it's yesterday
  if (diffInDays === 1) {
    return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  // If it's within the last week
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  // If it's this year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Otherwise show full date
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Format a date for batch display (shorter format)
 */
export function formatBatchDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  // If it's today
  if (diffInDays === 0) {
    return 'Today';
  }

  // If it's yesterday
  if (diffInDays === 1) {
    return 'Yesterday';
  }

  // If it's within the last week
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  // If it's this year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  // Otherwise show full date
  return date.toLocaleDateString([], { year: '2-digit', month: 'short', day: 'numeric' });
}

/**
 * Format timestamp for table display
 */
export function formatTimestamp(dateString: string): { 
  primary: string; 
  secondary: string; 
} {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInHours / 24);

  // If it's today
  if (diffInDays === 0) {
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      if (diffInMinutes < 1) return { primary: 'Just now', secondary: '' };
      if (diffInMinutes < 60) return { primary: `${diffInMinutes}m ago`, secondary: '' };
    }
    return {
      primary: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      secondary: 'Today'
    };
  }

  // If it's yesterday
  if (diffInDays === 1) {
    return {
      primary: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      secondary: 'Yesterday'
    };
  }

  // If it's within the last week
  if (diffInDays < 7) {
    return {
      primary: date.toLocaleDateString([], { weekday: 'short' }),
      secondary: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  }

  // Otherwise
  return {
    primary: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    secondary: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}
