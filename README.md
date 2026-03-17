# Week 1 Concept
 een 1-op-1 interactieve webgame waarbij een smartphone wordt gebruikt als controller voor een desktop boogschietspel via een WebRTC Data Channel.

De desktop toont het spel (boog, pijlen en targets).
De smartphone bestuurt:

Richting via gyroscoop (tilt links/rechts)

Kracht via swipe-beweging (nog te beslissen)

Schieten via een knop of release (nog te beslissen)

De connectie tussen beide toestellen gebeurt via een QR-code.

WebSockets worden enkel gebruikt voor signalling, terwijl alle realtime besturing via WebRTC Data Channels verloopt.

Het doel van het spel is om zoveel mogelijk targets te raken binnen een bepaalde tijd.

Ik heb ook al de mappen structuur klaar gelegd zodat ik volgende week kan beginnen met de connectie tussen GSM en Desktop

# Week 2 Communicatie
In week 2 heb ik de eerste connectie opgezet tussen de smartphone en de desktop.

Ik heb:

Een lokale Node.js server opgezet

WebSockets gebruikt voor signalling

Een eenvoudige WebRTC connectie gemaakt

Een minimale test gebouwd waarbij data van de smartphone naar de desktop gestuurd werd

Resultaat:

Werkende 1-op-1 connectie

Eerste MVP waarbij communicatie mogelijk is
# Week 3 Data verwerking
In deze week heb ik de communicatie verder uitgewerkt zodat er effectief bruikbare data verstuurd en ontvangen wordt.

Ik heb:

Data structuur opgezet (angle, power, shoot)

Input van de smartphone gekoppeld aan events

Data correct ontvangen en verwerkt op de desktop

Tests gedaan met real-time updates

Resultaat:

Stabiele data-overdracht via WebRTC data channel

Basis interactie tussen smartphone en desktop

# Gebruik van AI 
Ik gebruikte AI vooral om de opdracht op te delen in kleine technische stappen, zoals het opzetten van de Node.js server, WebRTC signalling, mobiele inputverwerking en canvas game logica. De gegenereerde code werd niet blind overgenomen, maar getest, vereenvoudigd en aangepast aan mijn eigen projectstructuur.