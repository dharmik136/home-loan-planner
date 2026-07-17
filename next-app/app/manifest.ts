import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'The Prepayment Ledger',
    short_name: 'Loan Planner',
    description: 'Home-loan prepayment and payoff planning workspace.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f3f6f5',
    theme_color: '#087454',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
}
