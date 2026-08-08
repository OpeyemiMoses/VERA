export function getDeliverableImage(
  imageUrl?: string,
  title: string = 'Deliverable Asset',
  category: string = 'Software',
  fileName: string = 'deliverable.png'
): string {
  if (imageUrl && imageUrl.trim().length > 0 && !imageUrl.includes('undefined')) {
    return imageUrl;
  }

  const titleLower = title.toLowerCase();

  if (
    titleLower.includes('bot') ||
    titleLower.includes('telegram') ||
    titleLower.includes('code') ||
    titleLower.includes('script') ||
    titleLower.includes('backend') ||
    titleLower.includes('python')
  ) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  }

  if (
    titleLower.includes('design') ||
    titleLower.includes('ui') ||
    titleLower.includes('figma') ||
    titleLower.includes('logo') ||
    titleLower.includes('brand') ||
    titleLower.includes('vector')
  ) {
    return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80';
  }

  if (
    titleLower.includes('audit') ||
    titleLower.includes('smart contract') ||
    titleLower.includes('security') ||
    titleLower.includes('solidity') ||
    titleLower.includes('monad')
  ) {
    return 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80';
  }

  if (
    titleLower.includes('pdf') ||
    titleLower.includes('document') ||
    titleLower.includes('report') ||
    titleLower.includes('strategy')
  ) {
    return 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80';
  }

  return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
}
