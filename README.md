# Admin Dashboard Package

Package terpisah untuk admin dashboard dengan template sama seperti dashboard member.

## Fitur

- Login admin (tanpa register dan forgot password)
- Dashboard dengan sidebar responsif
- Manajemen Data
- Pengaturan

## Bahasa

- Bahasa Indonesia saja (tidak multi-language)

## Development

```bash
# Install dependencies
npm install

# Run dev server on port 3001
npm run dev

# Build for production
npm run build
```

## Struktur

```
admin-package/
├── pages/
│   ├── index.vue          # Login page
│   └── dashboard/
│       ├── index.vue      # Dashboard main
│       ├── data.vue       # Data management
│       └── settings.vue   # Settings
├── components/
│   ├── Sidebar.vue        # Sidebar navigation
│   ├── MobileHeader.vue   # Mobile header
│   └── Icon.vue           # Icon component
├── layouts/
│   └── admin.vue          # Admin layout
└── assets/
    └── css/
        └── main.css       # Tailwind CSS
```


