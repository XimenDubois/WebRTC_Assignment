# Concept
 een 1-op-1 interactieve webgame waarbij een smartphone wordt gebruikt als controller voor een desktop boogschietspel via een WebRTC Data Channel.

De desktop toont het spel (boog, pijlen en targets).
De smartphone bestuurt:

Richting via gyroscoop (tilt links/rechts)

Kracht via swipe-beweging (nog te beslissen)

Schieten via een knop of release (nog te beslissen)

De connectie tussen beide toestellen gebeurt via een QR-code.

WebSockets worden enkel gebruikt voor signalling, terwijl alle realtime besturing via WebRTC Data Channels verloopt.

Het doel van het spel is om zoveel mogelijk targets te raken binnen een bepaalde tijd.