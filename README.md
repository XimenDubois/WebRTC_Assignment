# 🎯 Projectoverzicht  
Dit project is een **1-op-1 interactieve webgame** waarbij een smartphone gebruikt wordt als controller voor een desktop boogschietspel via een **WebRTC Data Channel**.

## 🖥️ Desktop (game)
De desktop toont het spel, inclusief:
- Boog  
- Pijlen  
- Targets  

## 📱 Smartphone (controller)
De smartphone wordt gebruikt om het spel te besturen:
- **Richting** → via gyroscoop (links/rechts kantelen)  
- **Kracht** → via swipe-beweging van rechts naar links
- **Schieten** → via knop

## 🔗 Connectie
- Verbinding via **QR-code**
- **WebSockets** → enkel voor signalling  
- **WebRTC Data Channels** → voor realtime communicatie  

## 🎮 Doel van het spel
Raak zoveel mogelijk targets binnen zonder 3x er naast te schieten

---

# 📅 Week 1 — Concept & Setup

## Wat is gedaan:
- Concept van de game uitgewerkt  
- Interactie tussen smartphone en desktop bepaald  
- Mappenstructuur opgezet  

## Resultaat:
- Duidelijke projectbasis  
- Klaar om te starten met de connectie tussen smartphone en desktop  

## 🎯 Volgende week doel:
- Basis connectie opzetten tussen smartphone en desktop  
- Node.js server configureren  
- Eerste WebRTC signalling implementeren  

---

# 📅 Week 2 — Communicatie

## Wat is gedaan:
- Lokale **Node.js server** opgezet  
- **WebSockets** geïmplementeerd voor signalling  
- Eerste **WebRTC connectie** opgezet  
- Minimale test gebouwd voor datatransfer  

## Resultaat:
- Werkende 1-op-1 connectie  
- Eerste MVP waarin communicatie mogelijk is  

## 🎯 Volgende week doel:
- Datastructuur definiëren (angle, power, shoot)  
- Input van smartphone koppelen aan events  
- Betrouwbare data-overdracht testen  

---

# 📅 Week 3 — Data verwerking

## Wat is gedaan:
- Datastructuur opgezet (`angle`, `power`, `shoot`)  
- Smartphone input gekoppeld aan events  
- Data correct ontvangen en verwerkt op de desktop  
- Tests uitgevoerd met realtime updates  

## Resultaat:
- Stabiele data-overdracht via WebRTC Data Channels  
- Basisinteractie tussen smartphone en desktop  

## 🎯 Volgende week doel:
- Game logic implementeren (boog richten en schieten)  
- Visuele feedback toevoegen (pijl, targets)  
- Eerste speelbare prototype maken  

---

## 🤖 Gebruik van AI

Ik heb AI vooral gebruikt om mijn ontwikkelingsproces te versnellen. Daarbij heb ik bewust gewerkt met kleine, gerichte prompts om te vermijden dat ik overspoeld werd met grote hoeveelheden gegenereerde code.

AI werd voornamelijk ingezet voor:
- Complexere berekeningen, zoals het bepalen van hitboxen van de targets en arrows
- Ondersteuning bij technische implementaties  
- Het versnellen van het CSS-proces, zodat ik hier minder tijd aan hoefde te besteden  

De gegenereerde code werd steeds in kleine hoeveelheden gegenereerd, getest en aangepast zodat ik niet zou verdrinken in de grote hoeveelheden code dat AI kan genereren bij te grote prompts.