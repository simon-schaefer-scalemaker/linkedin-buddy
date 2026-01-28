# LinkedIn Content Learning System

Ein persönlicher Content-Coach, der aus jedem deiner LinkedIn Posts lernt und dir hilft, systematisch besser zu werden.

## Features

- **Dashboard**: Übersicht deiner Content-Performance und personalisierte Empfehlungen
- **Workspace**: Schreibe Posts mit Live-Feedback basierend auf deinen Erfolgsmustern
- **Chat**: Konversation mit deinem KI-Content-Coach
- **Insights**: Detaillierte Analyse deiner Patterns
- **Posts**: Verwalte und analysiere alle deine Posts

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: Zustand
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **AI**: Claude API (claude-sonnet-4-20250514)

## Setup

### 1. Supabase Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) und erstelle ein neues Projekt
2. Kopiere die **Project URL** und den **anon public key** (unter Settings > API)

### 2. Datenbank Schema einrichten

1. Gehe zum SQL Editor in deinem Supabase Dashboard
2. Füge den Inhalt von `supabase/schema.sql` ein und führe ihn aus
3. Das erstellt automatisch einen Single-User Eintrag (keine Registrierung nötig!)

### 3. Edge Functions deployen

```bash
# Installiere die Supabase CLI
npm install -g supabase

# Login
supabase login

# Link dein Projekt (Project Ref findest du in den Supabase Settings)
supabase link --project-ref YOUR_PROJECT_REF

# Anthropic API Key setzen
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxx

# Functions deployen
supabase functions deploy extract-features
supabase functions deploy analyze-patterns
supabase functions deploy generate-recommendation
supabase functions deploy analyze-draft
supabase functions deploy chat-completion
```

### 4. Frontend einrichten

```bash
# Dependencies installieren
npm install

# Umgebungsvariablen setzen - erstelle eine .env.local Datei:
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" > .env.local
echo "VITE_SUPABASE_ANON_KEY=your-anon-key" >> .env.local

# Development Server starten
npm run dev
```

Die App läuft dann auf http://localhost:5173

## Projektstruktur

```
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui Komponenten
│   │   ├── dashboard/       # Dashboard Komponenten
│   │   ├── workspace/       # Editor & Live Assistant
│   │   ├── chat/            # Chat Interface
│   │   ├── insights/        # Patterns Ansicht
│   │   ├── posts/           # Posts Verwaltung
│   │   ├── settings/        # Einstellungen
│   │   └── layout/          # Layout Komponenten
│   ├── stores/              # Zustand Stores
│   ├── hooks/               # Custom Hooks
│   ├── lib/                 # Utilities & Supabase Client
│   └── types/               # TypeScript Typen
├── supabase/
│   ├── schema.sql           # Datenbank Schema
│   └── functions/           # Edge Functions
└── public/
```

## Entwicklung

```bash
# Development Server
npm run dev

# Build
npm run build

# Preview Production Build
npm run preview
```

## Wie es funktioniert

### Der Lernloop

1. **Post importieren**: Füge deine LinkedIn Posts hinzu (manuell eingeben)
2. **Features extrahieren**: KI analysiert automatisch Topics, Format, Hooks etc.
3. **Patterns erkennen**: System erkennt was bei DEINEM Publikum funktioniert
4. **Empfehlungen generieren**: Personalisierte Content-Ideen basierend auf deinen Patterns
5. **Metriken eintragen**: Trage die Performance deiner Posts ein
6. **Modell verbessern**: System lernt kontinuierlich und wird besser

### Learning Modes

| Posts | Mode | Verhalten |
|-------|------|-----------|
| 0-9 | Bootstrap | Hypothesen, keine Fakten |
| 10-29 | Learning | Erste Patterns mit Confidence |
| 30-49 | Confident | Reliable Patterns, Predictions möglich |
| 50+ | Optimizing | Feintuning, hohe Accuracy |

## Lizenz

MIT
