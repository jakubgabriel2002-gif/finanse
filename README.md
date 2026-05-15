# NeoCity 🏙️

Mobilny city builder w React + Vite. Buduj miasto, zarządzaj ekonomią, dbaj o mieszkańców.

## 🎮 Funkcje

- 🏗️ 18 typów budynków (mieszkalne, przemysłowe, usługi, energia, transport, finanse)
- 🛣️ System dróg — budynki bez drogi zarabiają tylko 5%
- 💼 Miejsca pracy vs. siła robocza (60% populacji)
- ⚡💧 Prąd i woda — deficyty wpływają na zadowolenie
- 🌳 CO₂ i środowisko — parki, panele słoneczne, filtry CO₂
- 🎓 Samouczek dla nowych graczy (9 kroków)
- 🏦 Bank — pożyczki 8%/rok na 24 miesiące
- 💸 Opłaty mieszkańców (czynsz, woda, prąd) — regulowane
- 🔍 Kontrole skarbowe — kary dla firm unikających podatków
- 🗳️ Wybory co 4 lata
- 🚨 Zamieszki gdy brak policji
- 🌤️ Pogoda (4 typy) — wpływa na produkcję energii
- 📬 Skrzynka odbiorcza + 📰 Gazeta miejska
- 🎲 10 losowych eventów
- ☀️ Panele słoneczne (-50% energii) i 🌿 filtry CO₂ (-40% emisji)
- 💾 Automatyczny zapis w localStorage

## 🚀 Uruchomienie lokalne

```bash
npm install
npm run dev
```

## 🌐 Deploy na GitHub Pages

1. Wrzuć wszystkie pliki do repozytorium GitHub
2. W ustawieniach repo: **Settings → Pages**
3. Source: **GitHub Actions** lub branch deployment
4. Albo zbuduj lokalnie i wrzuć folder `dist`:

```bash
npm run build
```

Folder `dist` możesz wrzucić na GitHub Pages (zawiera index.html i assety).

## 📂 Struktura

```
src/
├── App.jsx              # Główny komponent + cała logika
├── data.js              # Definicje budynków, eventów, terenu
├── gameLogic.js         # calcStats, generatory, helpery
├── styles.css           # Wszystkie style
├── main.jsx             # React entry
└── components/
    ├── Map.jsx          # Mapa + budynki + drogi
    ├── TopBar.jsx       # Górny pasek statystyk
    ├── BottomNav.jsx    # Dolna nawigacja
    ├── SelPanel.jsx     # Panel wybranego budynku
    ├── Tutorial.jsx     # Samouczek
    └── tabs/
        ├── TownhallTab.jsx
        ├── BuildTab.jsx
        ├── InboxTab.jsx
        └── StatsTab.jsx
```

## 🎯 Sterowanie

- **Tap kafelek** — wybierz miejsce/budynek
- **Drag** — przesuwanie mapy
- **Pinch** — zoom
- **Przyciski na dole** — przełączanie zakładek
