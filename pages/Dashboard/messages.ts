// Every string the dashboard shows (D21), mounted by Dashboard.vue under home.dashboard.
export const messages = {
  en: {
    home: {
      dashboard: {
        morning: 'Good morning, {name}',
        afternoon: 'Good afternoon, {name}',
        evening: 'Good evening, {name}',
        failed: 'Some figures could not be loaded.',
        tiles: {
          customers: 'Active customers',
          openOrders: 'Open orders',
          jobs: 'Running jobs',
          revenue: 'Revenue, last 30 days',
          revenueNote: 'Paid and shipped, in EUR',
        },
        recent: {
          title: 'Recent orders',
          all: 'All orders',
          caption: 'The five newest orders',
          empty: 'No orders yet',
          number: 'Order',
          status: 'Status',
          total: 'Total',
          createdAt: 'Created',
        },
        status: { draft: 'Draft', open: 'Open', paid: 'Paid', shipped: 'Shipped', cancelled: 'Cancelled' },
        jobs: { title: 'Jobs', empty: 'No jobs running' },
        billing: {
          title: 'Billing',
          forbidden: 'Only the finance team can see billing.',
          plan: '{plan} plan, {seats} seats',
        },
      },
    },
  },
  de: {
    home: {
      dashboard: {
        morning: 'Guten Morgen, {name}',
        afternoon: 'Guten Tag, {name}',
        evening: 'Guten Abend, {name}',
        failed: 'Einige Zahlen konnten nicht geladen werden.',
        tiles: {
          customers: 'Aktive Kunden',
          openOrders: 'Offene Bestellungen',
          jobs: 'Laufende Jobs',
          revenue: 'Umsatz, letzte 30 Tage',
          revenueNote: 'Bezahlt und versandt, in EUR',
        },
        recent: {
          title: 'Neueste Bestellungen',
          all: 'Alle Bestellungen',
          caption: 'Die fünf neuesten Bestellungen',
          empty: 'Noch keine Bestellungen',
          number: 'Bestellung',
          status: 'Status',
          total: 'Summe',
          createdAt: 'Angelegt',
        },
        status: { draft: 'Entwurf', open: 'Offen', paid: 'Bezahlt', shipped: 'Versandt', cancelled: 'Storniert' },
        jobs: { title: 'Jobs', empty: 'Keine laufenden Jobs' },
        billing: {
          title: 'Abrechnung',
          forbidden: 'Die Abrechnung sieht nur das Finanzteam.',
          plan: 'Tarif {plan}, {seats} Plätze',
        },
      },
    },
  },
}
