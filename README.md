# 📚 Läxhjälpen - AI-driven Homework Quiz App

En intelligent webapp som hjälper elever studera genom att analysera bilder av läxor och skapa personliga förhör.

## ✨ Funktioner

- 📷 **Bilduppladdning** - Fotografera eller ladda upp bilder av glosor och faktatext
- 🤖 **AI-bildanalys** - Automatisk analys av innehållet med OpenAI GPT-4 Vision
- 🎤 **Muntligt förhör** - Svara muntligt och få AI-feedback via Whisper
- ✅ **Flervalsfrågor** - Visuell feedback med automatisk progression
- 📱 **Mobiloptimerad** - Designad för smartphone-användning
- 🇸🇪 **Svenska** - Fullständigt svenskt gränssnitt och innehåll

## 🚀 Snabbstart

### 1. Installera dependencies
```bash
npm install
```

### 2. Sätt upp OpenAI API
1. Gå till [OpenAI Platform](https://platform.openai.com/api-keys)
2. Skapa en ny API-nyckel
3. Kopiera din nyckel och uppdatera `.env.local`:

```bash
# .env.local
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_ORG_ID=org-your-org-id-here  # (valfritt)
```

### 3. Starta utvecklingsservern
```bash
npm run dev
```

Appen är nu tillgänglig på [http://localhost:3000](http://localhost:3000)

## 🏗️ Deployment på Vercel

### Automatisk deployment
1. Pusha koden till GitHub
2. Gå till [vercel.com](https://vercel.com)
3. Importera ditt GitHub-repo
4. Lägg till environment variables:
   - `OPENAI_API_KEY`
   - `OPENAI_ORG_ID` (valfritt)
5. Klicka Deploy!

## 🛠️ Teknikstack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **AI Integration**: OpenAI GPT-4 Vision, Whisper
- **Deployment**: Vercel
- **Build Tools**: Turbopack

## 📱 Mobilanvändning

Appen är optimerad för mobil och stödjer:
- Touch-vänliga knappar och interaktioner
- Kameraintegration för bilduppladdning
- Mikrofoninspelning för muntliga svar
- Responsiv design för alla skärmstorlekar

## 🎯 Användningsflöde

1. **Ladda upp** - Fotografera eller ladda upp bild av läxor
2. **AI-analys** - Vänta medan AI analyserar innehållet
3. **Välj förhör** - Muntligt eller flervalsfrågor
4. **Genomför** - Svara på 10 frågor med AI-feedback
5. **Resultat** - Se poäng och välj att fortsätta

## 🔐 Säkerhet

- API-nycklar lagras säkert som environment variables
- Ingen användardata sparas permanent
- Session-baserad quiz-data

---

Byggd med ❤️ för svenska elever 🇸🇪
