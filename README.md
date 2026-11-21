# UFONO Galaxy 5.2 — Android aplikace + globální server

## Co obsahuje
- **Nativní Android projekt (Java + WebView)**. Hra je zabalená v `app/src/main/assets/` a při hraní proti AI funguje bez internetu.
- **Backend Node.js** pro veřejný komunitní žebříček (`server.js`, `public/`).
- GitHub Actions workflow, které vyrobí **testovací Android APK**, až ho spustíš na GitHubu.
- Online hra, chat a hlas zůstávají z verze 5.0 **experimentální**; přístup k internetu je nutný.

## Jak dostat APK bez Android Studia
1. Vytvoř **soukromý** repozitář na GitHubu a nahraj obsah této složky do jeho kořene.
2. Otevři **Actions → Sestavit UFONO Galaxy APK → Run workflow**.
3. Po úspěšném sestavení otevři běh a v **Artifacts** stáhni `UFONO-Galaxy-Android-APK`.
4. V archivu najdeš `app-debug.apk`; můžeš ho nainstalovat na Androidu (bude potřeba povolit instalaci z neznámého zdroje).
5. Tento **debug APK** je na soukromé testování, ne na prodej. Pro distribuci sestav podepsanou release variantu a zabezpeč podpisový klíč.

## Nebo Android Studio
Open → vyber tuto složku → počkej na Gradle synchronizaci → Build → Build APK(s).
Použij Android SDK 35 a JDK 17. Pro sestavení se musí stáhnout Gradle/Android pluginy.

## Server pro společný žebříček
Na serveru nainstaluj Node.js 20+, spusť `npm start`. Přidej HTTPS doménu a trvalé úložiště `data/`. V mobilní aplikaci v sekci **Celosvětový žebříček** vyplň URL tvého veřejného serveru (například `https://game.example.com`) a ulož. Pak se hráči ze zařízení připojí k jednomu API.

**Pozor:** Výhry jsou stále zasílané klientem. Globální žebříček je testovací a dá se podvádět. Před veřejným prodejem: účty, obnova profilu, ochrana proti podvádění, moderace, GDPR, serverově ověřované hry, zátěžové a bezpečnostní testy. `server.js` sám o sobě neznamená, že je služba zveřejněná.

## iPhone
Android APK na iPhonu nefunguje. Pro iPhone používej HTTPS PWA (Safari → Sdílet → Přidat na plochu), nebo samostatnou iOS aplikaci sestavenou a podepsanou na Macu s Xcode.

## Bezpečnostní poznámka
Projekt používá pro lokální zabalenou hru Android WebView s `setAllowUniversalAccessFromFileURLs(true)`, aby mohla komunikovat s HTTPS žebříčkem. Před veřejným vydáním je lepší přejít na AndroidX WebViewAssetLoader se zabezpečenou HTTPS pseudo-doménou. V aplikaci nenačítej nedůvěryhodné HTML soubory.
